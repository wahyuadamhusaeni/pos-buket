<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Models\Item;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Item::query()->where('aktif', true);

        if ($request->filled('search')) {
            $query->where('nama', 'like', "%{$request->search}%");
        }

        if ($request->filled('tipe')) {
            $query->where('tipe', $request->tipe);
        }

        if ($request->boolean('stok_menipis')) {
            $query->whereRaw('stok_saat_ini <= stok_min');
        }

        $items = $query->orderBy('nama')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Item $item) => [
                'id' => $item->id,
                'nama' => $item->nama,
                'tipe' => $item->tipe,
                'kategori' => $item->kategori,
                'satuan' => $item->satuan,
                'stok_saat_ini' => (float) $item->stok_saat_ini,
                'hpp_rata_rata' => (int) $item->hpp_rata_rata,
                'stok_min' => (float) $item->stok_min,
                'nilai_persediaan' => $item->nilai_persediaan,
                'is_low_stock' => $item->isLowStock(),
                'foto_url' => $item->foto_url,
            ]);

        return Inertia::render('items/index', [
            'items' => $items,
            'filters' => $request->only(['search', 'tipe', 'stok_menipis']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('items/create');
    }

    public function store(StoreItemRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('items', 'public');
            $validated['foto_url'] = Storage::url($path);
        }

        unset($validated['foto']);

        Item::create($validated);

        return redirect()->route('items.index')
            ->with('success', 'Bahan baru berhasil didaftarkan ke sistem');
    }

    public function show(Item $item): Response
    {
        $item->load(['stockMovements' => function ($q) {
            $q->orderByDesc('created_at')->limit(50);
        }]);

        $movements = $item->stockMovements->map(fn (
            StockMovement $m
        ) => [
            'id' => $m->id,
            'tipe' => $m->tipe,
            'qty' => (float) $m->qty,
            'hpp_per_unit' => (int) $m->hpp_per_unit,
            'nilai' => (int) $m->nilai,
            'alasan' => $m->alasan,
            'catatan' => $m->catatan,
            'created_at' => $m->created_at?->format('d/m/Y H:i'),
        ]);

        return Inertia::render('items/show', [
            'item' => [
                'id' => $item->id,
                'nama' => $item->nama,
                'tipe' => $item->tipe,
                'kategori' => $item->kategori,
                'satuan' => $item->satuan,
                'stok_saat_ini' => (float) $item->stok_saat_ini,
                'hpp_rata_rata' => (int) $item->hpp_rata_rata,
                'stok_min' => (float) $item->stok_min,
                'nilai_persediaan' => $item->nilai_persediaan,
                'is_low_stock' => $item->isLowStock(),
                'foto_url' => $item->foto_url,
                'catatan' => $item->catatan,
                'aktif' => $item->aktif,
            ],
            'movements' => $movements,
        ]);
    }

    public function edit(Item $item): Response
    {
        return Inertia::render('items/edit', [
            'item' => $item->only([
                'id', 'nama', 'tipe', 'kategori', 'satuan',
                'stok_min', 'foto_url', 'catatan', 'aktif',
            ]),
        ]);
    }

    public function update(UpdateItemRequest $request, Item $item): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->boolean('hapus_foto')) {
            if ($item->foto_url && str_starts_with($item->foto_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $item->foto_url);
                Storage::disk('public')->delete($oldPath);
            }
            $validated['foto_url'] = null;
        } elseif ($request->hasFile('foto')) {
            if ($item->foto_url && str_starts_with($item->foto_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $item->foto_url);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('foto')->store('items', 'public');
            $validated['foto_url'] = Storage::url($path);
        }

        unset($validated['foto'], $validated['hapus_foto']);

        $item->update($validated);

        return redirect()->route('items.show', $item)
            ->with('success', 'Data bahan berhasil diperbarui');
    }

    public function destroy(Item $item): RedirectResponse
    {
        // FR-1.2: Soft-deactivate instead of delete if item has history
        $hasHistory = $item->stockMovements()->exists()
            || $item->purchaseItems()->exists()
            || $item->saleLineItems()->exists();

        if ($hasHistory) {
            $item->update(['aktif' => false]);

            return redirect()->route('items.index')
                ->with('success', 'Item dinonaktifkan karena memiliki riwayat transaksi');
        }

        $item->delete();

        return redirect()->route('items.index')
            ->with('success', 'Item berhasil dihapus');
    }
}
