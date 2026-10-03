<?php

use App\Models\Item;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;

test('dashboard is accessible by authenticated owner', function () {
    $user = User::factory()->create(['role' => 'owner']);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
});

test('item can be created and listed', function () {
    $user = User::factory()->create(['role' => 'owner']);

    $response = $this->actingAs($user)->post(route('items.store'), [
        'nama' => 'Mawar Merah Holland',
        'tipe' => 'bunga_hidup',
        'kategori' => 'Mawar',
        'satuan' => 'tangkai',
        'stok_min' => 10,
        'aktif' => true,
    ]);

    $response->assertRedirect(route('items.index'));
    $this->assertDatabaseHas('items', ['nama' => 'Mawar Merah Holland']);
});

test('purchase increases stock and calculates moving average hpp', function () {
    $user = User::factory()->create(['role' => 'owner']);
    $supplier = Supplier::create([
        'nama' => 'Kebun Bunga Lembang',
        'platform' => 'offline',
        'aktif' => true,
    ]);

    $item = Item::create([
        'nama' => 'Bunga Lily Putih',
        'tipe' => 'bunga_hidup',
        'satuan' => 'tangkai',
        'stok_saat_ini' => 0,
        'hpp_rata_rata' => 0,
        'stok_min' => 5,
        'aktif' => true,
    ]);

    // Batch 1: Buy 10 units @ 10,000 with 20,000 shipping -> effective 12,000 each
    $response = $this->actingAs($user)->post(route('purchases.store'), [
        'tanggal' => now()->toDateString(),
        'supplier_id' => $supplier->id,
        'no_pesanan' => 'PO-001',
        'ongkir' => 20000,
        'diskon' => 0,
        'biaya_lain' => 0,
        'items' => [
            [
                'item_id' => $item->id,
                'qty' => 10,
                'harga_satuan' => 10000,
            ],
        ],
    ]);

    $purchase = Purchase::first();
    $this->actingAs($user)->post(route('purchases.approve', $purchase));

    $item->refresh();
    expect($item->stok_saat_ini)->toEqual(10)
        ->and($item->hpp_rata_rata)->toEqual(12000);
});

test('sale deducts component stock and computes gross profit', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $bunga = Item::create([
        'nama' => 'Mawar Pink Candy',
        'tipe' => 'bunga_hidup',
        'satuan' => 'tangkai',
        'stok_saat_ini' => 20,
        'hpp_rata_rata' => 5000,
        'stok_min' => 5,
        'aktif' => true,
    ]);

    $kertas = Item::create([
        'nama' => 'Kertas Wrapping Pink',
        'tipe' => 'pelengkap',
        'satuan' => 'lembar',
        'stok_saat_ini' => 10,
        'hpp_rata_rata' => 3000,
        'stok_min' => 2,
        'aktif' => true,
    ]);

    $response = $this->actingAs($user)->post(route('sales.store'), [
        'tanggal' => now()->toDateString(),
        'pelanggan' => 'Ibu Rina',
        'status_bayar' => 'lunas',
        'metode' => 'transfer',
        'lines' => [
            [
                'nama_buket' => 'Buket Valentine Pink',
                'harga_jual' => 100000,
                'biaya_tambahan' => 10000,
                'components' => [
                    ['item_id' => $bunga->id, 'qty' => 5], // 5 * 5000 = 25000
                    ['item_id' => $kertas->id, 'qty' => 2], // 2 * 3000 = 6000
                ],
            ],
        ],
    ]);

    $sale = Sale::first();
    expect($sale)->not->toBeNull()
        ->and($sale->total_harga)->toEqual(100000)
        ->and($sale->total_hpp)->toEqual(31000) // 25000 + 6000
        ->and($sale->total_biaya_tambahan)->toEqual(10000)
        ->and($sale->laba_kotor)->toEqual(59000); // 100000 - 31000 - 10000

    // Stock should be deducted
    expect($bunga->fresh()->stok_saat_ini)->toEqual(15)
        ->and($kertas->fresh()->stok_saat_ini)->toEqual(8);
});

test('waste adjustment reduces stock and creates audit movement', function () {
    $user = User::factory()->create(['role' => 'owner']);

    $item = Item::create([
        'nama' => 'Mawar Putih Avalance',
        'tipe' => 'bunga_hidup',
        'satuan' => 'tangkai',
        'stok_saat_ini' => 10,
        'hpp_rata_rata' => 7000,
        'stok_min' => 2,
        'aktif' => true,
    ]);

    $response = $this->actingAs($user)->post(route('stock.adjustments.store'), [
        'item_id' => $item->id,
        'qty' => 3,
        'tipe' => 'waste',
        'arah' => 'minus',
        'alasan' => 'Bunga layu rontok terkena AC mati',
    ]);

    expect($item->fresh()->stok_saat_ini)->toEqual(7);

    $movement = StockMovement::where('item_id', $item->id)->first();
    expect($movement)->not->toBeNull()
        ->and($movement->tipe)->toEqual('waste')
        ->and($movement->qty)->toEqual(-3);
});
