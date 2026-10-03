<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function sales(Request $request): Response
    {
        $dari = $request->input('dari', now()->startOfMonth()->toDateString());
        $sampai = $request->input('sampai', now()->toDateString());

        $sales = Sale::where('status', 'selesai')
            ->whereBetween('tanggal', [$dari, $sampai])
            ->with('lines')
            ->orderByDesc('tanggal')
            ->get()
            ->map(fn (Sale $s) => [
                'id' => $s->id,
                'tanggal' => $s->tanggal->format('d/m/Y'),
                'pelanggan' => $s->pelanggan ?? 'Umum',
                'total_harga' => $s->total_harga,
                'total_hpp' => $s->total_hpp,
                'laba_kotor' => $s->laba_kotor,
                'status_bayar' => $s->status_bayar,
                'jumlah_buket' => $s->lines->count(),
            ]);

        $summary = [
            'total_omzet' => $sales->sum('total_harga'),
            'total_hpp' => $sales->sum('total_hpp'),
            'total_laba' => $sales->sum('laba_kotor'),
            'jumlah_transaksi' => $sales->count(),
        ];

        return Inertia::render('reports/sales', [
            'sales' => $sales,
            'summary' => $summary,
            'filters' => compact('dari', 'sampai'),
        ]);
    }

    public function stock(Request $request): Response
    {
        $itemId = $request->integer('item_id');
        $dari = $request->input('dari', now()->startOfMonth()->toDateString());
        $sampai = $request->input('sampai', now()->toDateString());

        $movements = StockMovement::with('item:id,nama,satuan', 'createdBy:id,name')
            ->when($itemId, fn ($q) => $q->where('item_id', $itemId))
            ->whereBetween('created_at', [$dari.' 00:00:00', $sampai.' 23:59:59'])
            ->orderByDesc('created_at')
            ->paginate(50)
            ->withQueryString()
            ->through(fn (StockMovement $m) => [
                'id' => $m->id,
                'item' => $m->item?->only(['id', 'nama', 'satuan']),
                'tipe' => $m->tipe,
                'qty' => (float) $m->qty,
                'hpp_per_unit' => $m->hpp_per_unit,
                'nilai' => $m->nilai,
                'alasan' => $m->alasan,
                'catatan' => $m->catatan,
                'created_by' => $m->createdBy?->name,
                'created_at' => $m->created_at?->format('d/m/Y H:i'),
            ]);

        $items = Item::where('aktif', true)
            ->whereIn('tipe', ['bunga_hidup', 'bunga_artifisial', 'pelengkap'])
            ->select(['id', 'nama'])
            ->orderBy('nama')
            ->get();

        return Inertia::render('reports/stock', [
            'movements' => $movements,
            'items' => $items,
            'filters' => compact('dari', 'sampai', 'itemId'),
        ]);
    }

    public function purchases(Request $request): Response
    {
        $dari = $request->input('dari', now()->startOfMonth()->toDateString());
        $sampai = $request->input('sampai', now()->toDateString());

        $purchases = Purchase::with('supplier')
            ->where('status', 'diterima')
            ->whereBetween('tanggal', [$dari, $sampai])
            ->orderByDesc('tanggal')
            ->get()
            ->map(fn (Purchase $p) => [
                'id' => $p->id,
                'tanggal' => $p->tanggal->format('d/m/Y'),
                'supplier' => $p->supplier?->nama ?? 'Tanpa supplier',
                'ongkir' => $p->ongkir,
                'diskon' => $p->diskon,
                'biaya_lain' => $p->biaya_lain,
                'total_biaya_tambahan' => $p->total_biaya_tambahan,
            ]);

        return Inertia::render('reports/purchases', [
            'purchases' => $purchases,
            'summary' => [
                'jumlah' => $purchases->count(),
                'total_ongkir' => $purchases->sum('ongkir'),
            ],
            'filters' => compact('dari', 'sampai'),
        ]);
    }

    public function waste(Request $request): Response
    {
        $dari = $request->input('dari', now()->startOfMonth()->toDateString());
        $sampai = $request->input('sampai', now()->toDateString());

        $movements = StockMovement::with('item:id,nama,satuan')
            ->whereIn('tipe', ['waste', 'adjust'])
            ->where('qty', '<', 0)
            ->whereBetween('created_at', [$dari.' 00:00:00', $sampai.' 23:59:59'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (StockMovement $m) => [
                'id' => $m->id,
                'item' => $m->item?->only(['id', 'nama', 'satuan']),
                'tipe' => $m->tipe,
                'qty' => abs((float) $m->qty),
                'hpp_per_unit' => $m->hpp_per_unit,
                'nilai_kerugian' => abs($m->nilai),
                'alasan' => $m->alasan,
                'created_at' => $m->created_at?->format('d/m/Y H:i'),
            ]);

        return Inertia::render('reports/waste', [
            'movements' => $movements,
            'summary' => [
                'total_kerugian' => $movements->sum('nilai_kerugian'),
                'jumlah_kejadian' => $movements->count(),
            ],
            'filters' => compact('dari', 'sampai'),
        ]);
    }

    public function inventory(): Response
    {
        $items = Item::where('aktif', true)
            ->whereIn('tipe', ['bunga_hidup', 'bunga_artifisial', 'pelengkap'])
            ->orderBy('tipe')
            ->orderBy('nama')
            ->get()
            ->map(fn (Item $item) => [
                'id' => $item->id,
                'nama' => $item->nama,
                'tipe' => $item->tipe,
                'satuan' => $item->satuan,
                'stok_saat_ini' => (float) $item->stok_saat_ini,
                'hpp_rata_rata' => $item->hpp_rata_rata,
                'nilai_persediaan' => $item->nilai_persediaan,
                'stok_min' => (float) $item->stok_min,
                'is_low_stock' => $item->isLowStock(),
            ]);

        $totalNilai = $items->sum('nilai_persediaan');

        return Inertia::render('reports/inventory', [
            'items' => $items,
            'total_nilai' => $totalNilai,
        ]);
    }
}
