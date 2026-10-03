<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseRequest;
use App\Models\Item;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Services\PurchaseService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    public function __construct(private readonly PurchaseService $purchaseService) {}

    public function index(Request $request): Response
    {
        $query = Purchase::with('supplier')->orderByDesc('tanggal')->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('no_pesanan', 'like', "%{$request->search}%")
                    ->orWhereHas('supplier', fn ($sq) => $sq->where('nama', 'like', "%{$request->search}%"));
            });
        }

        $purchases = $query->paginate(20)->withQueryString()->through(fn (Purchase $p) => [
            'id' => $p->id,
            'tanggal' => $p->tanggal->format('d/m/Y'),
            'supplier' => $p->supplier?->nama,
            'no_pesanan' => $p->no_pesanan,
            'status' => $p->status,
            'ongkir' => $p->ongkir,
            'diskon' => $p->diskon,
            'biaya_lain' => $p->biaya_lain,
            'total_biaya_tambahan' => $p->total_biaya_tambahan,
            'diterima_at' => $p->diterima_at?->format('d/m/Y H:i'),
        ]);

        return Inertia::render('purchases/index', [
            'purchases' => $purchases,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('purchases/create', [
            'suppliers' => Supplier::where('aktif', true)->select(['id', 'nama', 'platform'])->orderBy('nama')->get(),
            'items' => Item::where('aktif', true)
                ->whereIn('tipe', ['bunga_hidup', 'bunga_artifisial', 'pelengkap'])
                ->select(['id', 'nama', 'tipe', 'satuan', 'stok_saat_ini', 'hpp_rata_rata'])
                ->orderBy('nama')
                ->get(),
        ]);
    }

    public function store(StorePurchaseRequest $request): RedirectResponse
    {
        $purchase = $this->purchaseService->create(
            $request->validated(),
            $request->user()?->id,
        );

        return redirect()->route('purchases.show', $purchase)
            ->with('success', 'Pembelian berhasil dibuat');
    }

    public function show(Purchase $purchase): Response
    {
        $purchase->load('supplier', 'items.item', 'createdBy');

        return Inertia::render('purchases/show', [
            'purchase' => [
                'id' => $purchase->id,
                'tanggal' => $purchase->tanggal->format('d/m/Y'),
                'supplier' => $purchase->supplier?->only(['id', 'nama', 'platform']),
                'no_pesanan' => $purchase->no_pesanan,
                'ongkir' => $purchase->ongkir,
                'diskon' => $purchase->diskon,
                'biaya_lain' => $purchase->biaya_lain,
                'total_biaya_tambahan' => $purchase->total_biaya_tambahan,
                'status' => $purchase->status,
                'catatan' => $purchase->catatan,
                'diterima_at' => $purchase->diterima_at?->format('d/m/Y H:i'),
                'items' => $purchase->items->map(fn (PurchaseItem $pi) => [
                    'id' => $pi->id,
                    'item' => $pi->item->only(['id', 'nama', 'satuan']),
                    'qty' => (float) $pi->qty,
                    'harga_satuan' => $pi->harga_satuan,
                    'nilai' => $pi->nilai,
                    'alokasi_biaya' => $pi->alokasi_biaya,
                    'harga_efektif' => $pi->harga_efektif,
                    'satuan_input' => $pi->satuan_input,
                    'qty_per_satuan' => $pi->qty_per_satuan,
                ]),
            ],
        ]);
    }

    /**
     * Approve/receive a draft purchase.
     */
    public function approve(Purchase $purchase, Request $request): RedirectResponse
    {
        try {
            $this->purchaseService->approve($purchase, $request->user()?->id);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return redirect()->route('purchases.show', $purchase)
            ->with('success', 'Pembelian diterima dan stok diperbarui');
    }

    /**
     * Cancel a purchase with a reason.
     */
    public function cancel(Purchase $purchase, Request $request): RedirectResponse
    {
        $request->validate(['alasan' => 'required|string|max:500']);

        try {
            $this->purchaseService->cancel($purchase, $request->alasan, $request->user()?->id);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return redirect()->route('purchases.show', $purchase)
            ->with('success', 'Pembelian dibatalkan');
    }

    public function edit(Purchase $purchase): Response
    {
        if ($purchase->status !== 'draft') {
            abort(403, 'Hanya pembelian draft yang bisa diedit');
        }

        $purchase->load('items.item');

        return Inertia::render('purchases/edit', [
            'purchase' => $purchase,
            'suppliers' => Supplier::where('aktif', true)->select(['id', 'nama', 'platform'])->orderBy('nama')->get(),
            'items' => Item::where('aktif', true)
                ->whereIn('tipe', ['bunga_hidup', 'bunga_artifisial', 'pelengkap'])
                ->select(['id', 'nama', 'tipe', 'satuan', 'stok_saat_ini', 'hpp_rata_rata'])
                ->orderBy('nama')
                ->get(),
        ]);
    }

    public function update(StorePurchaseRequest $request, Purchase $purchase): RedirectResponse
    {
        try {
            $this->purchaseService->updateDraft($purchase, $request->validated());
        } catch (\RuntimeException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return redirect()->route('purchases.show', $purchase)
            ->with('success', 'Pembelian berhasil diperbarui');
    }

    public function destroy(Purchase $purchase): RedirectResponse
    {
        if ($purchase->status === 'diterima') {
            return back()->withErrors(['general' => 'Gunakan fitur batal untuk membatalkan pembelian yang sudah diterima']);
        }

        $purchase->items()->delete();
        $purchase->delete();

        return redirect()->route('purchases.index')
            ->with('success', 'Pembelian dihapus');
    }
}
