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

test('sale with DP records initial payment and can be settled later', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $bunga = Item::create([
        'nama' => 'Mawar Merah Sexy Red',
        'tipe' => 'bunga_hidup',
        'satuan' => 'tangkai',
        'stok_saat_ini' => 30,
        'hpp_rata_rata' => 5000,
        'stok_min' => 5,
        'aktif' => true,
    ]);

    // Create a Pre-Order with DP
    $response = $this->actingAs($user)->post(route('sales.store'), [
        'tanggal' => now()->toDateString(),
        'jenis_pesanan' => 'preorder',
        'tanggal_ambil' => now()->addDays(2)->toDateString(),
        'jam_ambil' => '14:00',
        'tipe_pengiriman' => 'pickup',
        'pelanggan' => 'Kak Amanda',
        'telepon_pelanggan' => '08123456789',
        'status_bayar' => 'dp',
        'metode' => 'transfer',
        'nominal_dp' => 40000,
        'lines' => [
            [
                'nama_buket' => 'Buket Wisuda Amanda',
                'harga_jual' => 100000,
                'biaya_tambahan' => 10000,
                'components' => [
                    ['item_id' => $bunga->id, 'qty' => 5],
                ],
            ],
        ],
    ]);

    $sale = Sale::where('pelanggan', 'Kak Amanda')->first();
    expect($sale)->not->toBeNull()
        ->and($sale->status_bayar)->toEqual('dp')
        ->and($sale->nominal_dp)->toEqual(40000)
        ->and($sale->total_harga)->toEqual(100000)
        ->and($sale->total_terbayar)->toEqual(40000)
        ->and($sale->sisa_tagihan)->toEqual(60000)
        ->and($sale->jenis_pesanan)->toEqual('preorder')
        ->and($sale->status_pesanan)->toEqual('antrean');

    // Update order status to siap
    $this->actingAs($user)->patch(route('sales.status-pesanan.update', $sale), [
        'status_pesanan' => 'siap',
    ]);
    expect($sale->fresh()->status_pesanan)->toEqual('siap');

    // 2 days later: Customer settles remaining 60,000 on pickup
    $settleResponse = $this->actingAs($user)->post(route('sales.payments.store', $sale), [
        'tanggal' => now()->addDays(2)->toDateString(),
        'nominal' => 60000,
        'metode' => 'tunai',
        'catatan' => 'Pelunasan sisa saat buket diambil di toko',
        'mark_as_completed' => true,
    ]);

    $sale->refresh();
    expect($sale->status_bayar)->toEqual('lunas')
        ->and($sale->total_terbayar)->toEqual(100000)
        ->and($sale->sisa_tagihan)->toEqual(0)
        ->and($sale->status_pesanan)->toEqual('selesai');
});

test('sale with belum bayar does not require payment method and creates no payments', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $bunga = Item::create([
        'nama' => 'Bunga Lily Orange',
        'tipe' => 'bunga_hidup',
        'satuan' => 'tangkai',
        'stok_saat_ini' => 15,
        'hpp_rata_rata' => 8000,
        'stok_min' => 2,
        'aktif' => true,
    ]);

    $response = $this->actingAs($user)->post(route('sales.store'), [
        'tanggal' => now()->toDateString(),
        'jenis_pesanan' => 'preorder',
        'tanggal_ambil' => now()->addDays(1)->toDateString(),
        'pelanggan' => 'Pak Budi',
        'status_bayar' => 'belum',
        'lines' => [
            [
                'nama_buket' => 'Buket Meja Kantor',
                'harga_jual' => 80000,
                'components' => [
                    ['item_id' => $bunga->id, 'qty' => 3],
                ],
            ],
        ],
    ]);

    $sale = Sale::where('pelanggan', 'Pak Budi')->first();
    expect($sale)->not->toBeNull()
        ->and($sale->status_bayar)->toEqual('belum')
        ->and($sale->total_terbayar)->toEqual(0)
        ->and($sale->sisa_tagihan)->toEqual(80000)
        ->and($sale->payments)->toHaveCount(0);
});

test('sale handles multi service fees (jasa rangkai, jasa tukar uang, bensin)', function () {
    $user = User::factory()->create(['role' => 'owner']);

    $bunga = Item::create([
        'nama' => 'Mawar Merah',
        'tipe' => 'bunga_hidup',
        'satuan' => 'tangkai',
        'stok_saat_ini' => 20,
        'hpp_rata_rata' => 5000,
        'stok_min' => 2,
        'aktif' => true,
    ]);

    $response = $this->actingAs($user)->post(route('sales.store'), [
        'tanggal' => now()->toDateString(),
        'pelanggan' => 'Siti Khadijah',
        'status_bayar' => 'dp',
        'metode' => 'transfer',
        'nominal_dp' => 50000,
        'lines' => [
            [
                'nama_buket' => 'Money Bouquet Tower',
                'harga_jual' => 100000,
                'components' => [
                    ['item_id' => $bunga->id, 'qty' => 4],
                ],
            ],
        ],
        'fees' => [
            ['nama' => 'Jasa Rangkai Buket Uang', 'nominal' => 35000],
            ['nama' => 'Jasa Penukaran Uang Baru Pecahan 50rb', 'nominal' => 25000],
            ['nama' => 'Biaya Bensin / Antar Kurir', 'nominal' => 15000],
        ],
    ]);

    $sale = Sale::where('pelanggan', 'Siti Khadijah')->first();
    expect($sale)->not->toBeNull();
    $response->assertRedirect(route('sales.show', $sale));
    expect($sale)->not->toBeNull()
        // Grand total = 100.000 (buket) + 35.000 + 25.000 + 15.000 = 175.000
        ->and($sale->total_harga)->toEqual(175000)
        ->and($sale->fees)->toHaveCount(3)
        ->and($sale->total_biaya_jasa)->toEqual(75000)
        ->and($sale->total_terbayar)->toEqual(50000)
        ->and($sale->sisa_tagihan)->toEqual(125000);
});
