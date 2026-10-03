<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAssetRequest;
use App\Models\Asset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssetController extends Controller
{
    public function index(Request $request): Response
    {
        $assets = Asset::when(
            $request->filled('search'),
            fn ($q) => $q->where('nama', 'like', "%{$request->search}%")
        )
            ->when($request->filled('kondisi'), fn ($q) => $q->where('kondisi', $request->kondisi))
            ->where('aktif', true)
            ->orderBy('nama')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('assets/index', [
            'assets' => $assets,
            'filters' => $request->only(['search', 'kondisi']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('assets/create');
    }

    public function store(StoreAssetRequest $request): RedirectResponse
    {
        Asset::create($request->validated());

        return redirect()->route('assets.index')
            ->with('success', 'Aset berhasil ditambahkan');
    }

    public function show(Asset $asset): Response
    {
        return Inertia::render('assets/show', [
            'asset' => $asset,
        ]);
    }

    public function edit(Asset $asset): Response
    {
        return Inertia::render('assets/edit', [
            'asset' => $asset,
        ]);
    }

    public function update(StoreAssetRequest $request, Asset $asset): RedirectResponse
    {
        $asset->update($request->validated());

        return redirect()->route('assets.show', $asset)
            ->with('success', 'Aset berhasil diperbarui');
    }

    public function destroy(Asset $asset): RedirectResponse
    {
        $asset->update(['aktif' => false]);

        return redirect()->route('assets.index')
            ->with('success', 'Aset berhasil dihapus');
    }
}
