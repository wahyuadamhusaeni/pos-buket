<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleRequest;
use App\Models\Item;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\SaleFee;
use App\Models\SaleLine;
use App\Models\SaleLineItem;
use App\Models\Setting;
use App\Models\Template;
use App\Services\SaleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function __construct(private readonly SaleService $saleService) {}

    public function index(Request $request): Response
    {
        $query = Sale::with('payments')->orderByDesc('tanggal')->orderByDesc('id');

        if ($request->input('status_bayar') === 'belum_lunas') {
            $query->whereIn('status_bayar', ['dp', 'belum']);
        } elseif ($request->filled('status_bayar')) {
            $query->where('status_bayar', $request->status_bayar);
        }

        if ($request->filled('jadwal') && $request->jadwal === 'hari_ini') {
            $query->whereDate('tanggal_ambil', now()->toDateString());
        }

        if ($request->filled('status_pesanan')) {
            $query->where('status_pesanan', $request->status_pesanan);
        }

        if ($request->filled('search')) {
            $query->where('pelanggan', 'like', "%{$request->search}%");
        }

        if ($request->filled('tanggal_dari')) {
            $query->whereDate('tanggal', '>=', $request->tanggal_dari);
        }

        if ($request->filled('tanggal_sampai')) {
            $query->whereDate('tanggal', '<=', $request->tanggal_sampai);
        }

        if ($request->input('status') !== 'semua') {
            $query->where('status', $request->input('status', 'selesai'));
        }

        $sales = $query->paginate(20)->withQueryString()->through(fn (Sale $s) => [
            'id' => $s->id,
            'tanggal' => $s->tanggal->format('d/m/Y'),
            'jenis_pesanan' => $s->jenis_pesanan ?? 'langsung',
            'tanggal_ambil' => $s->tanggal_ambil?->format('d/m/Y'),
            'jam_ambil' => $s->jam_ambil,
            'tipe_pengiriman' => $s->tipe_pengiriman ?? 'pickup',
            'status_pesanan' => $s->status_pesanan ?? 'selesai',
            'pelanggan' => $s->pelanggan ?? 'Umum',
            'telepon_pelanggan' => $s->telepon_pelanggan,
            'total_harga' => $s->total_harga,
            'total_hpp' => $s->total_hpp,
            'laba_kotor' => $s->laba_kotor,
            'status_bayar' => $s->status_bayar,
            'metode' => $s->metode,
            'total_terbayar' => $s->total_terbayar,
            'sisa_tagihan' => $s->sisa_tagihan,
            'status' => $s->status,
        ]);

        $stats = [
            'total_belum_lunas' => Sale::where('status', 'selesai')->whereIn('status_bayar', ['dp', 'belum'])->count(),
            'po_hari_ini' => Sale::where('status', 'selesai')->whereDate('tanggal_ambil', now()->toDateString())->count(),
        ];

        return Inertia::render('sales/index', [
            'sales' => $sales,
            'stats' => $stats,
            'filters' => $request->only(['status_bayar', 'search', 'tanggal_dari', 'tanggal_sampai', 'status', 'jadwal', 'status_pesanan']),
        ]);
    }

    public function create(): Response
    {
        $marginTarget = (float) Setting::get('margin_target', 30);

        return Inertia::render('sales/create', [
            'items' => Item::where('aktif', true)
                ->whereIn('tipe', ['bunga_hidup', 'bunga_artifisial', 'pelengkap'])
                ->select(['id', 'nama', 'tipe', 'satuan', 'stok_saat_ini', 'hpp_rata_rata'])
                ->orderBy('nama')
                ->get(),
            'templates' => Template::where('aktif', true)
                ->with('templateItems.item:id,nama,satuan,stok_saat_ini,hpp_rata_rata')
                ->select(['id', 'nama', 'harga_default'])
                ->orderBy('nama')
                ->get(),
            'margin_target' => $marginTarget,
        ]);
    }

    public function store(StoreSaleRequest $request): RedirectResponse
    {
        try {
            $sale = $this->saleService->create(
                $request->validated(),
                $request->user()?->id,
            );
        } catch (\RuntimeException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return redirect()->route('sales.show', $sale)
            ->with('success', 'Transaksi pesanan berhasil disimpan');
    }

    public function show(Sale $sale): Response
    {
        $sale->load('lines.lineItems.item', 'payments', 'createdBy', 'fees');

        return Inertia::render('sales/show', [
            'sale' => [
                'id' => $sale->id,
                'tanggal' => $sale->tanggal->format('d/m/Y'),
                'jenis_pesanan' => $sale->jenis_pesanan ?? 'langsung',
                'tanggal_ambil' => $sale->tanggal_ambil?->format('d/m/Y'),
                'jam_ambil' => $sale->jam_ambil,
                'tipe_pengiriman' => $sale->tipe_pengiriman ?? 'pickup',
                'status_pesanan' => $sale->status_pesanan ?? 'selesai',
                'pelanggan' => $sale->pelanggan,
                'telepon_pelanggan' => $sale->telepon_pelanggan,
                'catatan' => $sale->catatan,
                'total_harga' => $sale->total_harga,
                'total_hpp' => $sale->total_hpp,
                'laba_kotor' => $sale->laba_kotor,
                'status_bayar' => $sale->status_bayar,
                'metode' => $sale->metode,
                'nominal_dp' => $sale->nominal_dp,
                'status' => $sale->status,
                'alasan_batal' => $sale->alasan_batal,
                'penanganan_stok' => $sale->penanganan_stok,
                'penanganan_dp' => $sale->penanganan_dp,
                'nominal_refund' => $sale->nominal_refund,
                'total_terbayar' => $sale->total_terbayar,
                'sisa_tagihan' => $sale->sisa_tagihan,
                'total_biaya_jasa' => $sale->total_biaya_jasa,
                'fees' => $sale->fees->map(fn (SaleFee $f) => [
                    'id' => $f->id,
                    'nama' => $f->nama,
                    'nominal' => $f->nominal,
                    'catatan' => $f->catatan,
                ]),
                'lines' => $sale->lines->map(fn (SaleLine $l) => [
                    'id' => $l->id,
                    'nama_buket' => $l->nama_buket,
                    'harga_jual' => $l->harga_jual,
                    'hpp_total' => $l->hpp_total,
                    'biaya_tambahan' => $l->biaya_tambahan,
                    'margin_persen' => $l->margin_persen,
                    'laba_kotor' => $l->laba_kotor,
                    'template_id' => $l->template_id,
                    'components' => $l->lineItems->map(fn (SaleLineItem $li) => [
                        'id' => $li->id,
                        'item' => $li->item->only(['id', 'nama', 'satuan']),
                        'qty' => (float) $li->qty,
                        'hpp_snapshot' => $li->hpp_snapshot,
                        'nilai_hpp' => $li->nilai_hpp,
                    ]),
                ]),
                'payments' => $sale->payments->map(fn (Payment $p) => [
                    'id' => $p->id,
                    'tanggal' => $p->tanggal->format('d/m/Y'),
                    'nominal' => $p->nominal,
                    'metode' => $p->metode,
                    'catatan' => $p->catatan,
                ]),
            ],
        ]);
    }

    /**
     * Cancel / Resolve abandoned sale.
     */
    public function cancel(Sale $sale, Request $request): RedirectResponse
    {
        $request->validate([
            'alasan' => 'required|string|max:500',
            'penanganan_stok' => 'nullable|in:restock,ready_stock,waste',
            'penanganan_dp' => 'nullable|in:hangus,refund',
            'nominal_refund' => 'nullable|integer|min:0',
            'metode_refund' => 'nullable|in:tunai,transfer,lainnya',
        ]);

        try {
            $this->saleService->cancel($sale, $request->only([
                'alasan',
                'penanganan_stok',
                'penanganan_dp',
                'nominal_refund',
                'metode_refund',
            ]), $request->user()?->id);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return redirect()->route('sales.show', $sale)
            ->with('success', 'Pembatalan pesanan berhasil diproses');
    }

    /**
     * Add a payment to a sale.
     */
    public function addPayment(Sale $sale, Request $request): RedirectResponse
    {
        $request->validate([
            'tanggal' => 'required|date',
            'nominal' => 'required|integer|min:1',
            'metode' => 'required|in:tunai,transfer,lainnya',
            'catatan' => 'nullable|string|max:500',
            'mark_as_completed' => 'nullable|boolean',
        ]);

        try {
            $this->saleService->addPayment($sale, $request->only(['tanggal', 'nominal', 'metode', 'catatan', 'mark_as_completed']));
        } catch (\RuntimeException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return back()->with('success', 'Pembayaran / pelunasan berhasil dicatat');
    }

    /**
     * Update order stage status (antrean, proses, siap, selesai).
     */
    public function updateStatusPesanan(Sale $sale, Request $request): RedirectResponse
    {
        $request->validate([
            'status_pesanan' => 'required|in:antrean,proses,siap,selesai,dibatalkan',
        ]);

        try {
            $this->saleService->updateStatusPesanan($sale, $request->status_pesanan);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return back()->with('success', 'Status pengerjaan pesanan berhasil diperbarui');
    }
}
