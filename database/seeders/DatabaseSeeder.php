<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Item;
use App\Models\Setting;
use App\Models\Supplier;
use App\Models\Template;
use App\Models\TemplateItem;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Users (single-store: seeded, no public registration) ──────────────
        User::updateOrCreate(
            ['email' => 'owner@kiyomi.local'],
            [
                'name' => 'Owner',
                'role' => 'owner',
                'password' => Hash::make('owner123'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin@kiyomi.local'],
            [
                'name' => 'Admin',
                'role' => 'admin',
                'password' => Hash::make('admin123'),
            ]
        );

        // Business settings
        Setting::set('nama_usaha', 'KIYOMI STOCK');
        Setting::set('margin_target', '35');
        Setting::set('stok_min_default', '5');
        Setting::set('mata_uang', 'IDR');

        // Suppliers
        $shopee = Supplier::create([
            'nama' => 'Toko Bunga Segar Shopee',
            'platform' => 'shopee',
            'link' => 'https://shopee.co.id/tokobunga',
            'kontak' => '08123456789',
            'catatan' => 'Supplier bunga hidup terpercaya',
        ]);

        $tokped = Supplier::create([
            'nama' => 'Floral Paradise Tokopedia',
            'platform' => 'tokopedia',
            'kontak' => '08987654321',
            'catatan' => 'Supplier bunga artifisial dan pelengkap',
        ]);

        $offline = Supplier::create([
            'nama' => 'Pasar Bunga Rawa Belong',
            'platform' => 'offline',
            'catatan' => 'Pasar bunga grosir - Jakarta Barat',
        ]);

        // Items - Bunga Hidup
        $mawarMerah = Item::create(['nama' => 'Mawar Merah', 'tipe' => 'bunga_hidup', 'satuan' => 'tangkai', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 10]);
        $mawarPutih = Item::create(['nama' => 'Mawar Putih', 'tipe' => 'bunga_hidup', 'satuan' => 'tangkai', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 10]);
        $mawarPink = Item::create(['nama' => 'Mawar Pink', 'tipe' => 'bunga_hidup', 'satuan' => 'tangkai', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 10]);
        $babyBreath = Item::create(['nama' => 'Baby Breath', 'tipe' => 'bunga_hidup', 'satuan' => 'tangkai', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 5]);
        $tulip = Item::create(['nama' => 'Tulip', 'tipe' => 'bunga_hidup', 'satuan' => 'tangkai', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 5]);
        $sunflower = Item::create(['nama' => 'Bunga Matahari', 'tipe' => 'bunga_hidup', 'satuan' => 'tangkai', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 3]);

        // Items - Bunga Artifisial
        $mawarArtMerah = Item::create(['nama' => 'Mawar Artifisial Merah', 'tipe' => 'bunga_artifisial', 'satuan' => 'tangkai', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 20]);
        $mawarArtPink = Item::create(['nama' => 'Mawar Artifisial Pink', 'tipe' => 'bunga_artifisial', 'satuan' => 'tangkai', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 20]);
        $bungaSatin = Item::create(['nama' => 'Bunga Satin Mix', 'tipe' => 'bunga_artifisial', 'satuan' => 'tangkai', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 15]);

        // Items - Pelengkap
        $kertasKraft = Item::create(['nama' => 'Kertas Kraft Coklat', 'tipe' => 'pelengkap', 'satuan' => 'lembar', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 50]);
        $pitaRibbon = Item::create(['nama' => 'Pita Ribbon Satin', 'tipe' => 'pelengkap', 'satuan' => 'meter', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 10]);
        $floralFoam = Item::create(['nama' => 'Floral Foam', 'tipe' => 'pelengkap', 'satuan' => 'pcs', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 5]);
        $kartuUcapan = Item::create(['nama' => 'Kartu Ucapan', 'tipe' => 'pelengkap', 'satuan' => 'pcs', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 20]);
        $plastikWrap = Item::create(['nama' => 'Plastik Wrap', 'tipe' => 'pelengkap', 'satuan' => 'lembar', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 30]);
        $bungaPita = Item::create(['nama' => 'Pita Twistel', 'tipe' => 'pelengkap', 'satuan' => 'pcs', 'stok_saat_ini' => 0, 'hpp_rata_rata' => 0, 'stok_min' => 10]);

        // Assets
        Asset::create(['nama' => 'Glue Gun', 'jumlah' => 2, 'kondisi' => 'baik', 'tanggal_beli' => '2024-01-15', 'harga_beli' => 85000, 'lokasi' => 'Laci merah', 'catatan' => 'Ukuran mini']);
        Asset::create(['nama' => 'Tang', 'jumlah' => 1, 'kondisi' => 'baik', 'tanggal_beli' => '2024-01-15', 'harga_beli' => 35000, 'lokasi' => 'Laci merah']);
        Asset::create(['nama' => 'Gunting Floral', 'jumlah' => 3, 'kondisi' => 'baik', 'harga_beli' => 25000, 'lokasi' => 'Meja kerja']);
        Asset::create(['nama' => 'Wire Cutter', 'jumlah' => 1, 'kondisi' => 'baik', 'harga_beli' => 45000, 'lokasi' => 'Laci merah']);
        Asset::create(['nama' => 'Vase Display', 'jumlah' => 5, 'kondisi' => 'baik', 'harga_beli' => 25000, 'lokasi' => 'Rak display']);

        // Template buket
        $templateRomantis = Template::create([
            'nama' => 'Buket Romantis Merah',
            'harga_default' => 150000,
            'catatan' => 'Buket klasik mawar merah cocok untuk wisuda dan ulang tahun',
        ]);

        TemplateItem::create(['template_id' => $templateRomantis->id, 'item_id' => $mawarMerah->id, 'qty' => 12]);
        TemplateItem::create(['template_id' => $templateRomantis->id, 'item_id' => $babyBreath->id, 'qty' => 5]);
        TemplateItem::create(['template_id' => $templateRomantis->id, 'item_id' => $kertasKraft->id, 'qty' => 2]);
        TemplateItem::create(['template_id' => $templateRomantis->id, 'item_id' => $pitaRibbon->id, 'qty' => 1]);
        TemplateItem::create(['template_id' => $templateRomantis->id, 'item_id' => $kartuUcapan->id, 'qty' => 1]);

        $templateArtifisial = Template::create([
            'nama' => 'Buket Artifisial Pink Abadi',
            'harga_default' => 200000,
            'catatan' => 'Buket mawar artifisial tahan lama, cocok sebagai hadiah kenangan',
        ]);

        TemplateItem::create(['template_id' => $templateArtifisial->id, 'item_id' => $mawarArtPink->id, 'qty' => 15]);
        TemplateItem::create(['template_id' => $templateArtifisial->id, 'item_id' => $bungaSatin->id, 'qty' => 5]);
        TemplateItem::create(['template_id' => $templateArtifisial->id, 'item_id' => $kertasKraft->id, 'qty' => 3]);
        TemplateItem::create(['template_id' => $templateArtifisial->id, 'item_id' => $pitaRibbon->id, 'qty' => 1.5]);
        TemplateItem::create(['template_id' => $templateArtifisial->id, 'item_id' => $plastikWrap->id, 'qty' => 2]);
    }
}
