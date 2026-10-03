# PRD: Aplikasi Manajemen Stok & POS Usaha Buket Rumahan

| | |
|---|---|
| **Versi** | 1.0 (draft) |
| **Tanggal** | 3 Oktober 2026 |
| **Status** | Siap dipakai sebagai acuan pengembangan MVP |
| **Platform** | Web app mobile-first (PWA) |

---

## 1. Ringkasan

Aplikasi untuk membantu usaha buket rumahan mengelola **stok bahan (bunga hidup, bunga artifisial, pelengkap)**, **aset/alat kerja**, **pembelian**, dan **penjualan (POS sederhana)**, lengkap dengan perhitungan **HPP otomatis** menggunakan metode **moving average**.

Fokus utama: pencatatan cepat, stok akurat, dan tahu untung riil per buket, tanpa kerumitan sistem akuntansi penuh.

## 2. Latar Belakang & Masalah

| Masalah | Dampak |
|---|---|
| Bunga hidup cepat layu | Waste tidak tercatat, rugi tidak terlihat |
| Satu buket terdiri dari banyak komponen | HPP sulit dihitung, harga jual asal tebak |
| Harga beli bunga bisa berbeda walau jenis sama (beli dari banyak toko online) | HPP tidak konsisten |
| Bunga mirip-mirip dan tanpa barcode | Tidak bisa melacak barang keluar berasal dari pembelian mana |
| Resep buket sering berubah/custom sesuai request | Resep tetap tidak cocok sebagai dasar pemotongan stok |
| Alat kerja (glue gun, tang, dll) hilang/rusak tanpa catatan | Biaya tak terduga |
| Pencatatan di chat/buku | Data tersebar, tidak ada laporan |

## 3. Tujuan & Non-Tujuan

### 3.1 Tujuan
1. Stok bahan real-time, dengan peringatan stok menipis.
2. HPP per item dan per buket dihitung otomatis (moving average).
3. Pencatatan pembelian (stok masuk) dengan alokasi ongkir.
4. Penjualan/POS sederhana yang memotong stok otomatis dari komponen buket final.
5. Adjustment stok (stock opname) dengan jejak audit.
6. Pencatatan aset/alat kerja.
7. Dashboard ringkas: omzet, laba kotor, nilai persediaan, waste.

### 3.2 Non-Tujuan (di luar scope)
- Integrasi pembayaran (QRIS/payment gateway). Pembayaran hanya dicatat manual.
- Akuntansi lengkap (jurnal, neraca, pajak).
- Pelacakan stok per batch/FIFO (diputuskan memakai moving average untuk semua).
- Barcode/scanner.
- Marketplace atau katalog online (kandidat fase lanjutan).

## 4. Pengguna

| Persona | Peran | Kebutuhan utama |
|---|---|---|
| **Owner** | Pemilik usaha | Atur master data, harga, lihat laporan, opname |
| **Admin/Kasir** (opsional) | Pembantu | Input pembelian, buat transaksi, catat waste |

Skala awal: 1-3 pengguna, dipakai terutama lewat HP.

## 5. Keputusan Desain Utama

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Metode HPP | **Moving average** untuk semua item | Bunga mirip tanpa barcode, tidak mungkin tahu barang keluar dari pembelian mana |
| Satuan bunga | **Tangkai** | Seragam untuk bunga hidup dan artifisial |
| Resep buket | **Fleksibel**: template opsional + custom | Resep sering berubah sesuai request |
| Pemotongan stok | Dari **komponen final di transaksi**, bukan resep awal | Stok tetap akurat walau resep diubah |
| Pembayaran | Tunai/Transfer dicatat manual, status Lunas/DP/Belum bayar | Tanpa integrasi payment |
| Stok | Disimpan sebagai **riwayat pergerakan** (`stock_movements`), saldo di-cache | Audit dan laporan mudah |

## 6. Ruang Lingkup Fitur

### 6.1 MVP (Fase 1)
- F1. Master item (bahan, aset, produk template)
- F2. Pembelian / stok masuk
- F3. Adjustment stok & waste
- F4. POS / penjualan buket (template & custom)
- F5. Dashboard & laporan dasar
- F6. Autentikasi sederhana

### 6.2 Fase 2
- Pre-order dengan booking stok dan tanggal ambil/kirim
- Estimasi kesegaran bunga hidup (tanggal masuk, alert hampir layu)
- Struk digital untuk dibagikan ke WhatsApp
- Laporan lanjutan (laba per produk, bunga terlaris, perbandingan harga antar toko)
- Multi-user dengan role

### 6.3 Fase 3
- Katalog online + link order
- Prediksi kebutuhan stok musiman (Valentine, Hari Ibu, wisuda)
- Cetak struk Bluetooth
- Ekspor laporan ke Excel/PDF

## 7. Kebutuhan Fungsional

### F1. Master Item

**Tipe item:**

| Tipe | Contoh | Ikut stok & HPP? |
|---|---|---|
| `bunga_hidup` | Mawar segar, baby breath | Ya |
| `bunga_artifisial` | Mawar plastik pink, bunga satin | Ya |
| `pelengkap` | Kertas, pita, floral foam, kartu ucapan, plastik wrap | Ya |
| `aset` | Glue gun, tang, gunting | Tidak (hanya pencatatan jumlah & kondisi) |

**Field item bahan:** nama, tipe, kategori (opsional), satuan (default tangkai), stok minimum, foto (opsional), catatan, status aktif.

**Field aset:** nama, jumlah, kondisi (baik/rusak/hilang), tanggal beli, harga beli, lokasi simpan, catatan.

**Aturan:**
- FR-1.1: Nama item unik dalam satu tipe.
- FR-1.2: Item tidak dihapus permanen jika punya riwayat; hanya dinonaktifkan.
- FR-1.3: Bisa tambah item baru langsung dari layar pembelian dan POS (quick add).
- FR-1.4: Pencarian dan filter berdasarkan nama, tipe, dan stok menipis.

**Template buket (opsional):**
- Nama template, daftar komponen (item + qty), harga jual default, foto.
- Template hanya titik awal; tidak mengunci transaksi.

### F2. Pembelian (Stok Masuk)

**Header:** tanggal, supplier/toko, nomor pesanan (opsional), ongkir, diskon, biaya lain, catatan, status (`draft` / `diterima`).

**Detail:** item, jumlah, harga satuan, subtotal.

**Aturan:**
- FR-2.1: Stok bertambah **hanya saat status `diterima`**.
- FR-2.2: Input satuan alternatif (mis. "2 ikat @ 20 tangkai") otomatis dikonversi ke tangkai dan harga per tangkai.
- FR-2.3: **Ongkir, diskon, dan biaya lain dialokasikan proporsional terhadap nilai tiap item** agar HPP mencerminkan biaya riil.
- FR-2.4: Saat status `diterima`, sistem menghitung ulang HPP rata-rata item (lihat Bagian 8).
- FR-2.5: Pembelian yang sudah `diterima` tidak bisa diedit bebas. Koreksi dilakukan dengan **pembatalan** (reverse movement) atau adjustment, dengan alasan tercatat.
- FR-2.6: Riwayat harga beli per item per supplier disimpan dan bisa dilihat (perbandingan antar toko).
- FR-2.7: Supplier: nama, platform (Shopee/Tokopedia/offline/lainnya), link/kontak, catatan.

### F3. Adjustment Stok & Waste

**Stock opname:**
1. Pilih item (satu, beberapa, atau semua).
2. Sistem menampilkan stok sistem; user mengisi stok fisik.
3. Selisih dihitung otomatis.
4. User memilih alasan + catatan.
5. Simpan → tercatat sebagai pergerakan tipe `adjust`.

**Alasan adjustment:** hilang, rusak, salah catat, ketemu lagi, lainnya.

**Waste (terpisah dari adjustment):** bunga layu, rusak saat dikerjakan, sisa potongan. Tipe pergerakan `waste` supaya laporan kerugian jelas.

**Aturan:**
- FR-3.1: Selisih minus mengurangi stok pada **HPP rata-rata saat itu** dan dihitung sebagai kerugian.
- FR-3.2: Selisih plus menambah stok pada HPP rata-rata saat itu (tidak mengubah rata-rata).
- FR-3.3: Setiap adjustment/waste wajib punya alasan, waktu, dan pelaku; tidak bisa dihapus diam-diam.
- FR-3.4: Stok tidak boleh negatif. Jika pemakaian melebihi stok, user diberi peringatan dan diminta melakukan adjustment dulu atau melanjutkan dengan konfirmasi (flag "stok negatif" ditandai untuk dikoreksi).
- FR-3.5: Aset memiliki adjustment sederhana: ubah jumlah dan kondisi dengan catatan.

### F4. POS / Penjualan Buket

**Alur:**
1. Buat transaksi baru → isi nama pelanggan (opsional) dan catatan pesanan.
2. Tambah item buket: pilih **dari template** atau **custom**.
3. Template: komponen terisi otomatis dan **bisa diedit** (ganti jenis bunga, ubah jumlah tangkai, tambah/hapus komponen).
4. Custom: tambah komponen manual dari stok.
5. Sistem menampilkan **HPP buket** (dari komponen) dan **saran harga jual** (HPP + margin target).
6. User mengisi **harga jual** (bisa override saran).
7. Pilih pembayaran: **Tunai / Transfer**, status **Lunas / DP / Belum bayar**; jika DP, isi nominal.
8. Simpan transaksi → stok komponen terpotong.

**Aturan:**
- FR-4.1: Stok dipotong dari **komponen final** transaksi, bukan dari resep template.
- FR-4.2: Satu transaksi dapat berisi lebih dari satu buket.
- FR-4.3: HPP komponen di-snapshot saat transaksi (tidak berubah walau HPP item berubah kemudian).
- FR-4.4: Transaksi `Belum bayar`/`DP` bisa dilunasi kemudian; riwayat pembayaran tercatat.
- FR-4.5: Pembatalan transaksi mengembalikan stok komponen (reverse movement) dengan alasan.
- FR-4.6: Margin target default diatur di pengaturan, bisa diubah per transaksi.
- FR-4.7: Opsional: simpan buket custom sebagai template baru dari transaksi.
- FR-4.8: Daftar transaksi dengan filter tanggal, status bayar, dan pencarian pelanggan.
- FR-4.9: Biaya tambahan per buket (mis. ongkir kirim, jasa dekorasi) bisa dicatat sebagai komponen non-stok.

### F5. Dashboard & Laporan

**Dashboard:**
- Omzet hari ini / minggu ini / bulan ini
- Laba kotor (penjualan dikurangi HPP)
- **Nilai persediaan** (total qty × HPP rata-rata)
- Daftar stok menipis
- Total kerugian waste & adjustment bulan ini
- Piutang (transaksi DP/belum bayar)

**Laporan dasar:**
- Penjualan per periode
- Pergerakan stok per item (kartu stok)
- Pembelian per supplier/periode
- Waste & adjustment
- Nilai persediaan per item

### F6. Autentikasi & Pengaturan
- Login email/password (atau metode sederhana lain).
- Pengaturan usaha: nama usaha, margin target default, ambang stok menipis default, mata uang (IDR).
- Backup otomatis dan ekspor data (CSV).

## 8. Aturan Perhitungan HPP (Moving Average)

### 8.1 Pembelian diterima
```
alokasi_biaya_item = (nilai_item / total_nilai_item_di_pembelian) x (ongkir + biaya_lain - diskon)
harga_efektif_per_unit = (nilai_item + alokasi_biaya_item) / qty_item

HPP_baru = (qty_lama x HPP_lama + qty_masuk x harga_efektif_per_unit) / (qty_lama + qty_masuk)
stok_baru = qty_lama + qty_masuk
```

**Contoh:** Mawar artifisial pink. Stok 20 tangkai @ Rp 2.000 (nilai Rp 40.000). Beli 30 tangkai @ Rp 1.500 (Rp 45.000), tanpa ongkir.
HPP baru = (40.000 + 45.000) / 50 = **Rp 1.700/tangkai**.

### 8.2 Pemakaian (penjualan, waste, adjustment minus)
- Stok berkurang, HPP rata-rata **tidak berubah**.
- Nilai keluar = qty keluar × HPP rata-rata saat itu.

### 8.3 Adjustment plus
- Stok bertambah pada HPP rata-rata saat itu; HPP rata-rata **tidak berubah**.

### 8.4 Stok nol
- Saat stok mencapai 0, HPP rata-rata terakhir dipertahankan sebagai referensi; pembelian berikutnya menghitung dari nol (HPP = harga efektif pembelian itu).

### 8.5 HPP buket
```
HPP_buket = jumlah(qty_komponen x HPP_rata_rata_komponen saat transaksi) + biaya_tambahan
laba_kotor = harga_jual - HPP_buket
margin_% = laba_kotor / harga_jual x 100
saran_harga = HPP_buket / (1 - margin_target)
```

### 8.6 Pembatalan pembelian
- Reverse movement mengurangi stok, lalu HPP dihitung ulang dari riwayat pergerakan (rekalkulasi) agar konsisten. Jika stok sisa tidak cukup untuk dibalik, sistem menolak dan meminta adjustment.

## 9. Model Data

```
users            (id, nama, email, password_hash, role, created_at)

items            (id, nama, tipe[bunga_hidup|bunga_artifisial|pelengkap|aset],
                  kategori, satuan, stok_saat_ini, hpp_rata_rata,
                  stok_min, foto_url, catatan, aktif, created_at)

assets           (id, item_id, jumlah, kondisi[baik|rusak|hilang],
                  tanggal_beli, harga_beli, lokasi, catatan)

suppliers        (id, nama, platform, link, kontak, catatan)

purchases        (id, tanggal, supplier_id, no_pesanan, ongkir, diskon,
                  biaya_lain, status[draft|diterima|dibatalkan],
                  catatan, created_by)

purchase_items   (id, purchase_id, item_id, qty, harga_satuan,
                  alokasi_biaya, harga_efektif)

templates        (id, nama, harga_default, foto_url, catatan, aktif)
template_items   (id, template_id, item_id, qty)

sales            (id, tanggal, pelanggan, catatan, total_harga, total_hpp,
                  status_bayar[lunas|dp|belum], metode[tunai|transfer],
                  status[selesai|dibatalkan], created_by)

sale_lines       (id, sale_id, nama_buket, template_id?, harga_jual,
                  hpp_total, biaya_tambahan)
sale_line_items  (id, sale_line_id, item_id, qty, hpp_snapshot)

payments         (id, sale_id, tanggal, nominal, metode, catatan)

stock_movements  (id, item_id, tipe[purchase|sale|waste|adjust|reversal],
                  qty, hpp_per_unit, nilai, ref_tipe, ref_id,
                  alasan, catatan, created_by, created_at)

settings         (key, value)
```

**Catatan implementasi:**
- `items.stok_saat_ini` dan `hpp_rata_rata` adalah cache; sumber kebenaran adalah `stock_movements` dan bisa dihitung ulang.
- Semua perubahan stok dan HPP dilakukan dalam **satu transaksi database** agar konsisten.
- Simpan uang sebagai integer (Rupiah) atau decimal; hindari floating point.
- `qty` memakai angka bulat (tangkai) untuk bunga; pelengkap seperti pita bisa pecahan (meter), jadi gunakan decimal untuk qty.

## 10. Alur Pengguna Utama

### 10.1 Beli bunga
Pembelian → Tambah → pilih supplier → tambah item (qty, harga) → isi ongkir/diskon → status Diterima → stok & HPP terupdate.

### 10.2 Jual buket custom
POS → Transaksi baru → Tambah buket → Custom → pilih komponen & qty → lihat HPP & saran harga → isi harga jual → pilih pembayaran → Simpan → stok terpotong.

### 10.3 Opname mingguan
Stok → Opname → pilih item → isi stok fisik → pilih alasan selisih → Simpan.

### 10.4 Catat bunga layu
Stok → Waste → pilih item → qty → alasan "layu" → Simpan.

## 11. Kebutuhan Non-Fungsional

| Aspek | Target |
|---|---|
| Kecepatan input | Catat penjualan sederhana maksimal ±30 detik / 3-4 tap utama |
| Perangkat | Mobile-first, nyaman satu tangan; tetap usable di desktop |
| Koneksi | PWA; baca data tetap bisa saat sinyal jelek, input diutamakan online (offline-write fase 2) |
| Keamanan | Password ter-hash, HTTPS, validasi input, sesi aman |
| Integritas data | Transaksi atomik, audit trail pergerakan stok, tidak ada hapus diam-diam |
| Backup | Backup harian otomatis + ekspor CSV |
| Performa | Halaman utama < 2 detik pada koneksi 4G |
| Bahasa | Indonesia |
| Aksesibilitas | Kontras jelas, tombol cukup besar untuk layar sentuh |

## 12. Rekomendasi Teknis (opsional, bisa disesuaikan)

- **Frontend:** Next.js (App Router) + Tailwind, dirancang sebagai PWA.
- **Backend:** Route handlers / server actions Next.js.
- **Database:** PostgreSQL (atau SQLite untuk skala sangat kecil) dengan ORM seperti Drizzle.
- **Auth:** NextAuth/Auth.js atau sejenisnya.
- **Hosting:** Vercel/VPS + managed database dengan backup otomatis.
- Logika HPP dan pergerakan stok ditaruh di satu service/modul terpisah dan diuji unit secara ketat.

## 13. Metrik Keberhasilan

| Metrik | Target |
|---|---|
| Selisih stok sistem vs fisik saat opname | < 5% |
| Waktu input satu penjualan | < 30 detik |
| Transaksi tercatat vs transaksi nyata | > 95% |
| Tren waste bunga hidup | Menurun bulan ke bulan |
| Pemakaian dashboard | Dibuka minimal sekali per hari kerja |
| Buket terjual dengan margin diketahui | 100% |

## 14. Rencana Rilis

| Tahap | Isi | Estimasi |
|---|---|---|
| **M0** Persiapan | Finalisasi PRD, desain UI sederhana, skema database | 1 minggu |
| **M1** Fondasi | Auth, master item, aset, supplier | 1-2 minggu |
| **M2** Stok | Pembelian, moving average, adjustment, waste, kartu stok | 2 minggu |
| **M3** POS | Template, buket custom, transaksi, pembayaran DP/lunas | 2 minggu |
| **M4** Dashboard | Dashboard, laporan dasar, ekspor CSV | 1 minggu |
| **M5** Uji & rilis | Uji dengan data nyata, perbaikan, rilis MVP | 1 minggu |

Estimasi kasar untuk satu developer; sesuaikan dengan kapasitas.

## 15. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Pencatatan pemakaian tidak disiplin sehingga stok melenceng | Input super cepat, opname rutin (mingguan), alert selisih besar |
| HPP rata-rata tidak mencerminkan harga beli terbaru | Tampilkan juga harga beli terakhir dan perbandingan antar toko |
| Resep custom membuat input POS lambat | Template yang mudah diedit, "simpan sebagai template", komponen terakhir dipakai ditampilkan di atas |
| Salah input pembelian (qty/harga) | Konfirmasi ringkasan sebelum Diterima, pembatalan dengan reverse movement |
| Stok negatif karena lupa catat pembelian | Peringatan dan flag koreksi, bukan memblokir total |
| Kehilangan data | Backup otomatis, ekspor CSV berkala |
| Scope melebar (katalog, payment, dsb.) | Pegang non-tujuan dan batasi fitur ke fase |

## 16. Asumsi

- Satu lokasi usaha, satu gudang/tempat simpan.
- Satuan utama bunga adalah tangkai; pelengkap bisa memakai satuan lain (meter, lembar, pcs).
- Semua pembayaran dicatat manual, tanpa integrasi pihak ketiga.
- Pengguna awal sedikit sehingga tidak butuh role/izin kompleks di MVP.

## 17. Pertanyaan Terbuka

1. Perlu pembatasan akses (mis. kasir tidak boleh melihat HPP/laba) sejak MVP atau fase 2?
2. Apakah aplikasi hanya untuk pemakaian sendiri, atau akan dikembangkan untuk banyak usaha (multi-tenant)?
3. Pelengkap seperti pita/kertas dipakai per meter/lembar utuh atau cukup per pcs?
4. Perlu fitur pengiriman (kurir/alamat) di POS, atau cukup catatan?
5. Perlu notifikasi (mis. WhatsApp/email) untuk stok menipis di fase berikutnya?

## 18. Glosarium

| Istilah | Arti |
|---|---|
| **HPP** | Harga Pokok Penjualan: biaya bahan yang terpakai untuk satu buket |
| **Moving average** | Metode HPP dengan harga rata-rata tertimbang yang dihitung ulang tiap pembelian |
| **Stock opname** | Menghitung stok fisik dan mencocokkannya dengan stok sistem |
| **Adjustment** | Koreksi stok akibat selisih |
| **Waste** | Bahan terbuang (layu, rusak, sisa potongan) |
| **Template buket** | Resep standar buket yang bisa dipakai ulang dan diedit |
| **POS** | Point of Sale: pencatatan penjualan |
| **DP** | Uang muka |
| **BOM** | Bill of Materials: daftar komponen penyusun produk |
