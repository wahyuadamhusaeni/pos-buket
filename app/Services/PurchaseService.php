<?php

namespace App\Services;

use App\Models\Item;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

/**
 * PurchaseService: Orchestrates purchase creation and approval.
 *
 * On approval ("diterima"):
 * 1. Allocate shared costs (ongkir, biaya_lain - diskon) proportionally.
 * 2. Calculate effective price per unit for each item.
 * 3. Call StockService to update stock and HPP moving average atomically.
 */
class PurchaseService
{
    public function __construct(private readonly StockService $stockService) {}

    /**
     * Create a purchase in draft state.
     *
     * @param  array{
     *   tanggal: string,
     *   supplier_id: int|null,
     *   no_pesanan: string|null,
     *   ongkir: int,
     *   diskon: int,
     *   biaya_lain: int,
     *   catatan: string|null,
     *   items: array<array{item_id: int, qty: float, harga_satuan: int, satuan_input: string|null, qty_per_satuan: float|null}>
     * }  $data
     */
    public function create(array $data, ?int $createdBy = null): Purchase
    {
        return DB::transaction(function () use ($data, $createdBy) {
            $purchase = Purchase::create([
                'tanggal' => $data['tanggal'],
                'supplier_id' => $data['supplier_id'] ?? null,
                'no_pesanan' => $data['no_pesanan'] ?? null,
                'ongkir' => $data['ongkir'] ?? 0,
                'diskon' => $data['diskon'] ?? 0,
                'biaya_lain' => $data['biaya_lain'] ?? 0,
                'status' => 'draft',
                'catatan' => $data['catatan'] ?? null,
                'created_by' => $createdBy,
            ]);

            foreach ($data['items'] as $itemData) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'item_id' => $itemData['item_id'],
                    'qty' => $itemData['qty'],
                    'harga_satuan' => $itemData['harga_satuan'],
                    'satuan_input' => $itemData['satuan_input'] ?? null,
                    'qty_per_satuan' => $itemData['qty_per_satuan'] ?? null,
                ]);
            }

            return $purchase->fresh('items');
        });
    }

    /**
     * Approve (terima) a draft purchase.
     *
     * This is the critical path: allocates costs and updates stock + HPP.
     */
    public function approve(Purchase $purchase, ?int $approvedBy = null): Purchase
    {
        if ($purchase->status !== 'draft') {
            throw new \RuntimeException("Hanya pembelian berstatus 'draft' yang bisa diterima");
        }

        return DB::transaction(function () use ($purchase, $approvedBy) {
            $purchase->loadMissing('items.item');

            $purchaseItems = $purchase->items;
            $totalBiaya = $purchase->ongkir + $purchase->biaya_lain - $purchase->diskon;

            // Build value array for proportional allocation
            $nilaiItems = $purchaseItems->map(fn (PurchaseItem $pi) => [
                'nilai' => (int) ($pi->qty * $pi->harga_satuan),
            ])->toArray();

            $allocations = $this->stockService->alokasiProporsional($nilaiItems, $totalBiaya);

            foreach ($purchaseItems as $index => $purchaseItem) {
                $alokasi = $allocations[$index];
                $nilaiItem = (int) ($purchaseItem->qty * $purchaseItem->harga_satuan);
                $hargaEfektif = $purchaseItem->qty > 0
                    ? (int) round(($nilaiItem + $alokasi) / $purchaseItem->qty)
                    : $purchaseItem->harga_satuan;

                // Update purchase item with computed values
                $purchaseItem->update([
                    'alokasi_biaya' => $alokasi,
                    'harga_efektif' => $hargaEfektif,
                ]);

                // Update stock and HPP
                $this->stockService->recordMasuk(
                    item: $purchaseItem->item,
                    qty: (float) $purchaseItem->qty,
                    hargaEfektifPerUnit: $hargaEfektif,
                    refTipe: 'purchase',
                    refId: $purchase->id,
                    createdBy: $approvedBy,
                    catatan: "Pembelian #{$purchase->id}",
                );
            }

            $purchase->update([
                'status' => 'diterima',
                'diterima_at' => now(),
                'created_by' => $approvedBy ?? $purchase->created_by,
            ]);

            return $purchase->fresh('items.item');
        });
    }

    /**
     * Cancel a received purchase (reversal).
     */
    public function cancel(Purchase $purchase, string $alasan, ?int $cancelledBy = null): Purchase
    {
        if ($purchase->status === 'dibatalkan') {
            throw new \RuntimeException('Pembelian sudah dibatalkan');
        }

        return DB::transaction(function () use ($purchase, $alasan, $cancelledBy) {
            if ($purchase->status === 'diterima') {
                // Reverse each stock movement for this purchase
                $movements = StockMovement::where('ref_tipe', 'purchase')
                    ->where('ref_id', $purchase->id)
                    ->where('tipe', 'purchase')
                    ->get();

                foreach ($movements as $movement) {
                    $this->stockService->reversePurchaseMovement($movement, $cancelledBy, $alasan);
                }
            }

            $purchase->update(['status' => 'dibatalkan']);

            return $purchase->fresh();
        });
    }

    /**
     * Update a draft purchase (not yet approved).
     */
    public function updateDraft(Purchase $purchase, array $data): Purchase
    {
        if ($purchase->status !== 'draft') {
            throw new \RuntimeException("Hanya pembelian 'draft' yang bisa diedit");
        }

        return DB::transaction(function () use ($purchase, $data) {
            $purchase->update([
                'tanggal' => $data['tanggal'] ?? $purchase->tanggal,
                'supplier_id' => $data['supplier_id'] ?? $purchase->supplier_id,
                'no_pesanan' => $data['no_pesanan'] ?? $purchase->no_pesanan,
                'ongkir' => $data['ongkir'] ?? $purchase->ongkir,
                'diskon' => $data['diskon'] ?? $purchase->diskon,
                'biaya_lain' => $data['biaya_lain'] ?? $purchase->biaya_lain,
                'catatan' => $data['catatan'] ?? $purchase->catatan,
            ]);

            if (isset($data['items'])) {
                $purchase->items()->delete();
                foreach ($data['items'] as $itemData) {
                    PurchaseItem::create([
                        'purchase_id' => $purchase->id,
                        'item_id' => $itemData['item_id'],
                        'qty' => $itemData['qty'],
                        'harga_satuan' => $itemData['harga_satuan'],
                        'satuan_input' => $itemData['satuan_input'] ?? null,
                        'qty_per_satuan' => $itemData['qty_per_satuan'] ?? null,
                    ]);
                }
            }

            return $purchase->fresh('items');
        });
    }
}
