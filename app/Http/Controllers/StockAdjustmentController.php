<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAdjustmentRequest;
use App\Models\Item;
use App\Services\StockService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class StockAdjustmentController extends Controller
{
    public function __construct(private readonly StockService $stockService) {}

    public function index(): Response
    {
        $items = Item::where('aktif', true)
            ->whereIn('tipe', ['bunga_hidup', 'bunga_artifisial', 'pelengkap'])
            ->select(['id', 'nama', 'tipe', 'satuan', 'stok_saat_ini', 'hpp_rata_rata', 'stok_min'])
            ->orderBy('nama')
            ->get();

        return Inertia::render('stock/adjustments', [
            'items' => $items,
        ]);
    }

    public function store(StoreAdjustmentRequest $request): RedirectResponse
    {
        $item = Item::findOrFail($request->validated('item_id'));
        $qty = (float) $request->validated('qty');
        $alasan = $request->validated('alasan');
        $catatan = $request->validated('catatan');
        $tipe = $request->validated('tipe');
        $arah = $request->validated('arah');

        try {
            if ($arah === 'plus') {
                $this->stockService->recordAdjustPlus(
                    item: $item,
                    qty: $qty,
                    alasan: $alasan,
                    createdBy: $request->user()?->id,
                    catatan: $catatan,
                );
            } else {
                $this->stockService->recordAdjustMinus(
                    item: $item,
                    qty: $qty,
                    tipe: $tipe,
                    alasan: $alasan,
                    createdBy: $request->user()?->id,
                    catatan: $catatan,
                );
            }
        } catch (\RuntimeException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return back()->with('success', "Stok {$item->nama} berhasil disesuaikan");
    }
}
