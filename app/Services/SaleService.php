<?php

namespace App\Services;

use App\Models\Item;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\SaleLine;
use App\Models\SaleLineItem;
use App\Models\StockMovement;
use App\Models\Template;
use App\Models\TemplateItem;
use Illuminate\Support\Facades\DB;

/**
 * SaleService: Orchestrates POS transaction creation and stock deduction.
 *
 * On sale creation:
 * 1. Snapshot HPP for each component at current rates.
 * 2. Deduct stock for each component via StockService.
 * 3. Compute and persist HPP and margin.
 */
class SaleService
{
    public function __construct(private readonly StockService $stockService) {}

    /**
     * Create a complete sale transaction.
     *
     * @param  array{
     *   tanggal: string,
     *   pelanggan: string|null,
     *   telepon_pelanggan: string|null,
     *   catatan: string|null,
     *   status_bayar: string,
     *   metode: string,
     *   nominal_dp: int,
     *   lines: array<array{
     *     nama_buket: string,
     *     template_id: int|null,
     *     harga_jual: int,
     *     biaya_tambahan: int,
     *     components: array<array{item_id: int, qty: float}>
     *   }>
     * }  $data
     */
    public function create(array $data, ?int $createdBy = null): Sale
    {
        return DB::transaction(function () use ($data, $createdBy) {
            $totalHarga = 0;
            $totalHpp = 0;
            $totalBiayaTambahan = 0;

            // Pre-load all items needed to avoid N+1 and lock them
            $itemIds = collect($data['lines'])->flatMap(
                fn ($line) => collect($line['components'])->pluck('item_id')
            )->unique()->values()->toArray();

            $items = Item::lockForUpdate()->whereIn('id', $itemIds)->get()->keyBy('id');

            // Create the sale header first
            $sale = Sale::create([
                'tanggal' => $data['tanggal'],
                'pelanggan' => $data['pelanggan'] ?? null,
                'telepon_pelanggan' => $data['telepon_pelanggan'] ?? null,
                'catatan' => $data['catatan'] ?? null,
                'total_harga' => 0,
                'total_hpp' => 0,
                'total_biaya_tambahan' => 0,
                'status_bayar' => $data['status_bayar'],
                'metode' => $data['metode'],
                'nominal_dp' => $data['nominal_dp'] ?? 0,
                'status' => 'selesai',
                'created_by' => $createdBy,
            ]);

            foreach ($data['lines'] as $lineData) {
                $hargaJual = (int) $lineData['harga_jual'];
                $biayaTambahan = (int) ($lineData['biaya_tambahan'] ?? 0);

                // Calculate HPP from components (snapshot current HPP rates)
                $hppTotal = 0;
                foreach ($lineData['components'] as $comp) {
                    $item = $items->get($comp['item_id']);
                    if (! $item) {
                        throw new \RuntimeException("Item ID {$comp['item_id']} tidak ditemukan");
                    }
                    $hppTotal += (int) round($comp['qty'] * $item->hpp_rata_rata);
                }

                $totalCost = $hppTotal + $biayaTambahan;
                $marginPersen = $hargaJual > 0
                    ? round(($hargaJual - $totalCost) / $hargaJual * 100, 2)
                    : 0;

                // Create sale line
                $saleLine = SaleLine::create([
                    'sale_id' => $sale->id,
                    'nama_buket' => $lineData['nama_buket'],
                    'template_id' => $lineData['template_id'] ?? null,
                    'harga_jual' => $hargaJual,
                    'hpp_total' => $hppTotal,
                    'biaya_tambahan' => $biayaTambahan,
                    'margin_persen' => $marginPersen,
                ]);

                // Create sale line items and deduct stock
                foreach ($lineData['components'] as $comp) {
                    $item = $items->get($comp['item_id']);
                    $hppSnapshot = (int) $item->hpp_rata_rata; // snapshot BEFORE deduction

                    SaleLineItem::create([
                        'sale_line_id' => $saleLine->id,
                        'item_id' => $item->id,
                        'qty' => $comp['qty'],
                        'hpp_snapshot' => $hppSnapshot,
                    ]);

                    // Deduct stock (HPP snapshot is already captured above)
                    $this->stockService->recordKeluar(
                        item: $item,
                        qty: (float) $comp['qty'],
                        tipe: 'sale',
                        refTipe: 'sale_line',
                        refId: $saleLine->id,
                        createdBy: $createdBy,
                        catatan: "Penjualan #{$sale->id} - {$lineData['nama_buket']}",
                        allowNegative: true, // warn but allow per PRD 3.4
                    );

                    // Reload item so next component uses updated stock (if same item used twice)
                    $items[$item->id] = Item::find($item->id);
                }

                $totalHarga += $hargaJual;
                $totalHpp += $hppTotal;
                $totalBiayaTambahan += $biayaTambahan;
            }

            // Update sale totals
            $sale->update([
                'total_harga' => $totalHarga,
                'total_hpp' => $totalHpp,
                'total_biaya_tambahan' => $totalBiayaTambahan,
            ]);

            // If paid (lunas), record a payment entry automatically
            if ($data['status_bayar'] === 'lunas') {
                Payment::create([
                    'sale_id' => $sale->id,
                    'tanggal' => $data['tanggal'],
                    'nominal' => $totalHarga,
                    'metode' => $data['metode'],
                    'catatan' => 'Pembayaran lunas',
                ]);
            } elseif ($data['status_bayar'] === 'dp' && isset($data['nominal_dp']) && $data['nominal_dp'] > 0) {
                Payment::create([
                    'sale_id' => $sale->id,
                    'tanggal' => $data['tanggal'],
                    'nominal' => $data['nominal_dp'],
                    'metode' => $data['metode'],
                    'catatan' => 'DP',
                ]);
            }

            return $sale->load('lines.lineItems.item', 'payments');
        });
    }

    /**
     * Cancel a sale and reverse all stock movements.
     */
    public function cancel(Sale $sale, string $alasan, ?int $cancelledBy = null): Sale
    {
        if ($sale->status === 'dibatalkan') {
            throw new \RuntimeException('Penjualan sudah dibatalkan');
        }

        return DB::transaction(function () use ($sale, $alasan, $cancelledBy) {
            // Reverse stock for each component
            $movements = StockMovement::where('ref_tipe', 'sale_line')
                ->whereIn('ref_id', $sale->lines->pluck('id'))
                ->where('tipe', 'sale')
                ->get();

            foreach ($movements as $movement) {
                $item = Item::lockForUpdate()->findOrFail($movement->item_id);
                $qty = abs((float) $movement->qty);
                $hppSnapshot = (int) $movement->hpp_per_unit;

                // Return stock at original HPP snapshot
                $item->stok_saat_ini = (float) $item->stok_saat_ini + $qty;
                $item->save();

                StockMovement::create([
                    'item_id' => $item->id,
                    'tipe' => 'reversal',
                    'qty' => $qty,
                    'hpp_per_unit' => $hppSnapshot,
                    'nilai' => (int) round($qty * $hppSnapshot),
                    'ref_tipe' => 'stock_movement',
                    'ref_id' => $movement->id,
                    'alasan' => $alasan,
                    'created_by' => $cancelledBy,
                ]);
            }

            $sale->update(['status' => 'dibatalkan']);

            return $sale->fresh();
        });
    }

    /**
     * Add a payment to a sale (for DP/belum bayar resolution).
     */
    public function addPayment(Sale $sale, array $data): Payment
    {
        return DB::transaction(function () use ($sale, $data) {
            if ($sale->status === 'dibatalkan') {
                throw new \RuntimeException('Tidak bisa menambah pembayaran ke penjualan yang dibatalkan');
            }

            $payment = Payment::create([
                'sale_id' => $sale->id,
                'tanggal' => $data['tanggal'],
                'nominal' => $data['nominal'],
                'metode' => $data['metode'],
                'catatan' => $data['catatan'] ?? null,
            ]);

            // Recalculate payment status
            $totalPaid = (int) $sale->payments()->sum('nominal');
            $newStatus = $totalPaid >= $sale->total_harga ? 'lunas' : 'dp';
            $sale->update(['status_bayar' => $newStatus]);

            return $payment;
        });
    }

    /**
     * Save a custom sale line as a new template.
     */
    public function saveAsTemplate(SaleLine $saleLine, string $namaTemplate): Template
    {
        return DB::transaction(function () use ($saleLine, $namaTemplate) {
            $template = Template::create([
                'nama' => $namaTemplate,
                'harga_default' => $saleLine->harga_jual,
            ]);

            foreach ($saleLine->lineItems as $lineItem) {
                TemplateItem::create([
                    'template_id' => $template->id,
                    'item_id' => $lineItem->item_id,
                    'qty' => $lineItem->qty,
                ]);
            }

            return $template->load('templateItems.item');
        });
    }
}
