<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleRequest;
use App\Models\Item;
use App\Models\Payment;
use App\Models\Sale;
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
        $query = Sale::orderByDesc('tanggal')->orderByDesc('id');

        if ($request->filled('status_bayar')) {
            $query->where('status_bayar', $request->status_bayar);
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
            'pelanggan' => $s->pelanggan ?? 'Umum',
            'total_harga' => $s->total_harga,
            'total_hpp' => $s->total_hpp,
            'laba_kotor' => $s->laba_kotor,
            'status_bayar' => $s->status_bayar,
            'metode' => $s->metode,
            'status' => $s->status,
        ]);

        return Inertia::render('sales/index', [
            'sales' => $sales,
            'filters' => $request->only(['status_bayar', 'search', 'tanggal_dari', 'tanggal_sampai', 'status']),
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
            ->with('success', 'Transaksi berhasil disimpan');
    }

    public function show(Sale $sale): Response
    {
        $sale->load('lines.lineItems.item', 'payments', 'createdBy');

        return Inertia::render('sales/show', [
            'sale' => [
                'id' => $sale->id,
                'tanggal' => $sale->tanggal->format('d/m/Y'),
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
                'total_terbayar' => $sale->total_terbayar,
                'sisa_tagihan' => $sale->sisa_tagihan,
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
     * Cancel a sale and reverse stock.
     */
    public function cancel(Sale $sale, Request $request): RedirectResponse
    {
        $request->validate(['alasan' => 'required|string|max:500']);

        try {
            $this->saleService->cancel($sale, $request->alasan, $request->user()?->id);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return redirect()->route('sales.show', $sale)
            ->with('success', 'Penjualan dibatalkan dan stok dikembalikan');
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
        ]);

        try {
            $this->saleService->addPayment($sale, $request->only(['tanggal', 'nominal', 'metode', 'catatan']));
        } catch (\RuntimeException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return back()->with('success', 'Pembayaran berhasil dicatat');
    }
}
