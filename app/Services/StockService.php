<?php

namespace App\Services;

use App\Models\Item;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * StockService: Core engine for stock movements and HPP moving average calculations.
 *
 * All stock changes MUST go through this service to guarantee:
 * - Atomic database transactions
 * - Correct moving average HPP recalculation
 * - Complete audit trail in stock_movements
 *
 * HPP Moving Average Formula (per PRD section 8):
 *   HPP_baru = (qty_lama × HPP_lama + qty_masuk × harga_efektif) / (qty_lama + qty_masuk)
 */
class StockService
{
    /**
     * Record a stock-in movement (purchase received).
     *
     * Updates item's stok_saat_ini and hpp_rata_rata using moving average.
     *
     * @param  Item  $item  The item to restock
     * @param  float  $qty  Quantity incoming (must be positive)
     * @param  int  $hargaEfektifPerUnit  Effective price per unit including cost allocation (Rp)
     * @param  string  $refTipe  Reference type, e.g. 'purchase'
     * @param  int  $refId  Reference ID
     * @param  int|null  $createdBy  User ID
     * @param  string|null  $catatan  Notes
     */
    public function recordMasuk(
        Item $item,
        float $qty,
        int $hargaEfektifPerUnit,
        string $refTipe,
        int $refId,
        ?int $createdBy = null,
        ?string $catatan = null,
    ): StockMovement {
        if ($qty <= 0) {
            throw new InvalidArgumentException("Qty masuk harus positif, diterima: {$qty}");
        }

        return DB::transaction(function () use ($item, $qty, $hargaEfektifPerUnit, $refTipe, $refId, $createdBy, $catatan) {
            // Reload with lock to prevent race conditions
            $item = Item::lockForUpdate()->findOrFail($item->id);

            $qtyLama = (float) $item->stok_saat_ini;
            $hppLama = (int) $item->hpp_rata_rata;

            // Moving average formula
            $qtyBaru = $qtyLama + $qty;
            if ($qtyBaru > 0) {
                $hppBaru = (int) round(($qtyLama * $hppLama + $qty * $hargaEfektifPerUnit) / $qtyBaru);
            } else {
                $hppBaru = $hargaEfektifPerUnit;
            }

            // Update item cache
            $item->stok_saat_ini = $qtyBaru;
            $item->hpp_rata_rata = $hppBaru;
            $item->save();

            // Record movement
            return StockMovement::create([
                'item_id' => $item->id,
                'tipe' => 'purchase',
                'qty' => $qty,
                'hpp_per_unit' => $hppBaru,
                'nilai' => (int) round($qty * $hppBaru),
                'ref_tipe' => $refTipe,
                'ref_id' => $refId,
                'catatan' => $catatan,
                'created_by' => $createdBy,
            ]);
        });
    }

    /**
     * Record a stock-out movement (sale, waste, adjustment minus).
     *
     * HPP rata-rata does NOT change on stock-out; only quantity decreases.
     *
     * @param  Item  $item  The item to consume
     * @param  float  $qty  Quantity outgoing (must be positive)
     * @param  string  $tipe  Movement type: sale|waste|adjust
     * @param  string  $refTipe  Reference type
     * @param  int  $refId  Reference ID
     * @param  string|null  $alasan  Reason
     * @param  int|null  $createdBy  User ID
     * @param  string|null  $catatan  Notes
     * @param  bool  $allowNegative  If false, throws when stock would go negative
     */
    public function recordKeluar(
        Item $item,
        float $qty,
        string $tipe,
        string $refTipe,
        int $refId,
        ?string $alasan = null,
        ?int $createdBy = null,
        ?string $catatan = null,
        bool $allowNegative = false,
    ): StockMovement {
        if ($qty <= 0) {
            throw new InvalidArgumentException("Qty keluar harus positif, diterima: {$qty}");
        }

        return DB::transaction(function () use ($item, $qty, $tipe, $refTipe, $refId, $alasan, $createdBy, $catatan, $allowNegative) {
            $item = Item::lockForUpdate()->findOrFail($item->id);

            $qtyLama = (float) $item->stok_saat_ini;
            $hppSaatIni = (int) $item->hpp_rata_rata;

            if (! $allowNegative && ($qtyLama - $qty) < 0) {
                throw new \RuntimeException(
                    "Stok {$item->nama} tidak cukup. Stok: {$qtyLama}, diminta: {$qty}"
                );
            }

            $item->stok_saat_ini = $qtyLama - $qty;
            // HPP rata-rata tidak berubah pada stock-out (PRD section 8.2)
            $item->save();

            return StockMovement::create([
                'item_id' => $item->id,
                'tipe' => $tipe,
                'qty' => -$qty, // negative = keluar
                'hpp_per_unit' => $hppSaatIni,
                'nilai' => -(int) round($qty * $hppSaatIni),
                'ref_tipe' => $refTipe,
                'ref_id' => $refId,
                'alasan' => $alasan,
                'catatan' => $catatan,
                'created_by' => $createdBy,
            ]);
        });
    }

    /**
     * Record an adjustment-plus (stock opname: physical > system).
     *
     * Adds stock at current HPP average without changing the average (PRD 8.3).
     */
    public function recordAdjustPlus(
        Item $item,
        float $qty,
        ?string $alasan = null,
        ?int $createdBy = null,
        ?string $catatan = null,
    ): StockMovement {
        if ($qty <= 0) {
            throw new InvalidArgumentException('Qty adjust plus harus positif');
        }

        return DB::transaction(function () use ($item, $qty, $alasan, $createdBy, $catatan) {
            $item = Item::lockForUpdate()->findOrFail($item->id);
            $hppSaatIni = (int) $item->hpp_rata_rata;

            $item->stok_saat_ini = (float) $item->stok_saat_ini + $qty;
            // HPP rata-rata tidak berubah (PRD 8.3)
            $item->save();

            return StockMovement::create([
                'item_id' => $item->id,
                'tipe' => 'adjust',
                'qty' => $qty,
                'hpp_per_unit' => $hppSaatIni,
                'nilai' => (int) round($qty * $hppSaatIni),
                'alasan' => $alasan,
                'catatan' => $catatan,
                'created_by' => $createdBy,
            ]);
        });
    }

    /**
     * Record an adjustment-minus (stock opname: physical < system) or waste.
     *
     * Reduces stock at current HPP average; counts as a loss.
     */
    public function recordAdjustMinus(
        Item $item,
        float $qty,
        string $tipe, // 'adjust' or 'waste'
        ?string $alasan = null,
        ?int $createdBy = null,
        ?string $catatan = null,
    ): StockMovement {
        return $this->recordKeluar(
            item: $item,
            qty: $qty,
            tipe: $tipe,
            refTipe: $tipe,
            refId: $item->id, // self-reference for adjustments
            alasan: $alasan,
            createdBy: $createdBy,
            catatan: $catatan,
            allowNegative: false,
        );
    }

    /**
     * Reverse a purchase movement (cancellation).
     *
     * Removes the incoming stock and recalculates HPP from movement history.
     * Throws if remaining stock is insufficient.
     */
    public function reversePurchaseMovement(
        StockMovement $movement,
        ?int $createdBy = null,
        ?string $alasan = null,
    ): StockMovement {
        if ($movement->tipe !== 'purchase') {
            throw new InvalidArgumentException("Hanya pergerakan tipe 'purchase' yang bisa di-reverse");
        }

        $qty = abs((float) $movement->qty);

        return DB::transaction(function () use ($movement, $qty, $createdBy, $alasan) {
            $item = Item::lockForUpdate()->findOrFail($movement->item_id);

            if ((float) $item->stok_saat_ini < $qty) {
                throw new \RuntimeException(
                    "Stok {$item->nama} tidak cukup untuk membatalkan pembelian. ".
                    "Stok: {$item->stok_saat_ini}, perlu dikembalikan: {$qty}"
                );
            }

            // Recalculate HPP from history (excluding this movement)
            $newHpp = $this->recalculateHppExcluding($item, $movement->id);

            $item->stok_saat_ini = (float) $item->stok_saat_ini - $qty;
            $item->hpp_rata_rata = $newHpp;
            $item->save();

            return StockMovement::create([
                'item_id' => $item->id,
                'tipe' => 'reversal',
                'qty' => -$qty,
                'hpp_per_unit' => $newHpp,
                'nilai' => -(int) round($qty * $newHpp),
                'ref_tipe' => 'stock_movement',
                'ref_id' => $movement->id,
                'alasan' => $alasan ?? 'Pembatalan pembelian',
                'created_by' => $createdBy,
            ]);
        });
    }

    /**
     * Recalculate HPP rata-rata from scratch based on all movements except the excluded one.
     * Used during purchase reversal.
     */
    private function recalculateHppExcluding(Item $item, int $excludeMovementId): int
    {
        $movements = StockMovement::where('item_id', $item->id)
            ->where('id', '!=', $excludeMovementId)
            ->where('tipe', 'purchase')
            ->orderBy('created_at')
            ->get();

        $runningQty = 0.0;
        $runningHpp = 0;

        foreach ($movements as $mov) {
            $qty = (float) $mov->qty;
            $hpp = (int) $mov->hpp_per_unit;
            $total = $runningQty + $qty;
            if ($total > 0) {
                $runningHpp = (int) round(($runningQty * $runningHpp + $qty * $hpp) / $total);
            }
            $runningQty = $total;
        }

        return $runningHpp > 0 ? $runningHpp : (int) $item->hpp_rata_rata;
    }

    /**
     * Calculate HPP for a bouquet based on its components.
     *
     * @param  array<array{item: Item, qty: float}>  $components
     */
    public function hitungHppBuket(array $components, int $biayaTambahan = 0): int
    {
        $total = $biayaTambahan;
        foreach ($components as $comp) {
            $total += (int) round($comp['qty'] * $comp['item']->hpp_rata_rata);
        }

        return $total;
    }

    /**
     * Calculate the suggested selling price based on HPP and target margin.
     *
     * Formula: saran_harga = HPP / (1 - margin_target/100)
     */
    public function saranHargaJual(int $hpp, float $marginTargetPersen): int
    {
        if ($marginTargetPersen >= 100 || $marginTargetPersen < 0) {
            throw new InvalidArgumentException('Margin target harus antara 0-99%');
        }

        return (int) round($hpp / (1 - $marginTargetPersen / 100));
    }

    /**
     * Calculate HPP allocation for each purchase item.
     *
     * Proportional allocation of shipping/extra costs.
     *
     * @param  array<array{nilai: int}>  $items  Each item with its nilai (qty * harga_satuan)
     * @param  int  $totalBiayaTambahan  Total extra costs to allocate (ongkir + biaya_lain - diskon)
     * @return array<int> Allocation per item (same order as input)
     */
    public function alokasiProporsional(array $items, int $totalBiayaTambahan): array
    {
        if ($totalBiayaTambahan === 0) {
            return array_fill(0, count($items), 0);
        }

        $totalNilai = array_sum(array_column($items, 'nilai'));
        if ($totalNilai === 0) {
            return array_fill(0, count($items), 0);
        }

        $allocations = [];
        $totalAllocated = 0;
        $lastIndex = count($items) - 1;

        foreach ($items as $index => $item) {
            if ($index === $lastIndex) {
                // Last item gets the remainder to avoid rounding drift
                $allocations[] = $totalBiayaTambahan - $totalAllocated;
            } else {
                $alloc = (int) round($item['nilai'] / $totalNilai * $totalBiayaTambahan);
                $allocations[] = $alloc;
                $totalAllocated += $alloc;
            }
        }

        return $allocations;
    }
}
