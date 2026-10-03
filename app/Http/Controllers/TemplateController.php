<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Template;
use App\Models\TemplateItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TemplateController extends Controller
{
    public function index(Request $request): Response
    {
        $templates = Template::when(
            $request->filled('search'),
            fn ($q) => $q->where('nama', 'like', "%{$request->search}%")
        )
            ->where('aktif', true)
            ->withCount('templateItems')
            ->orderBy('nama')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('templates/index', [
            'templates' => $templates,
            'filters' => $request->only('search'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('templates/create', [
            'items' => Item::where('aktif', true)
                ->whereIn('tipe', ['bunga_hidup', 'bunga_artifisial', 'pelengkap'])
                ->select(['id', 'nama', 'tipe', 'satuan', 'hpp_rata_rata'])
                ->orderBy('nama')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'harga_default' => ['nullable', 'integer', 'min:0'],
            'foto' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,svg,gif', 'max:5120'],
            'foto_url' => ['nullable', 'string', 'max:500'],
            'catatan' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'exists:items,id'],
            'items.*.qty' => ['required', 'numeric', 'min:0.001'],
        ]);

        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('templates', 'public');
            $validated['foto_url'] = Storage::url($path);
        }

        DB::transaction(function () use ($validated) {
            $template = Template::create([
                'nama' => $validated['nama'],
                'harga_default' => $validated['harga_default'] ?? 0,
                'foto_url' => $validated['foto_url'] ?? null,
                'catatan' => $validated['catatan'] ?? null,
            ]);

            foreach ($validated['items'] as $itemData) {
                TemplateItem::create([
                    'template_id' => $template->id,
                    'item_id' => $itemData['item_id'],
                    'qty' => $itemData['qty'],
                ]);
            }
        });

        return redirect()->route('templates.index')
            ->with('success', 'Template buket berhasil disimpan');
    }

    public function show(Template $template): Response
    {
        $template->load('templateItems.item');

        $hppTotal = (int) $template->templateItems->sum(
            fn (TemplateItem $ti) => $ti->qty * $ti->item->hpp_rata_rata
        );

        return Inertia::render('templates/show', [
            'template' => array_merge($template->toArray(), [
                'hpp_total' => $hppTotal,
            ]),
        ]);
    }

    public function edit(Template $template): Response
    {
        $template->load('templateItems.item');

        return Inertia::render('templates/edit', [
            'template' => $template,
            'items' => Item::where('aktif', true)
                ->whereIn('tipe', ['bunga_hidup', 'bunga_artifisial', 'pelengkap'])
                ->select(['id', 'nama', 'tipe', 'satuan', 'hpp_rata_rata'])
                ->orderBy('nama')
                ->get(),
        ]);
    }

    public function update(Request $request, Template $template): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'harga_default' => ['nullable', 'integer', 'min:0'],
            'foto' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,svg,gif', 'max:5120'],
            'foto_url' => ['nullable', 'string', 'max:500'],
            'hapus_foto' => ['nullable', 'boolean'],
            'catatan' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'exists:items,id'],
            'items.*.qty' => ['required', 'numeric', 'min:0.001'],
        ]);

        if ($request->boolean('hapus_foto')) {
            if ($template->foto_url && str_starts_with($template->foto_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $template->foto_url);
                Storage::disk('public')->delete($oldPath);
            }
            $validated['foto_url'] = null;
        } elseif ($request->hasFile('foto')) {
            if ($template->foto_url && str_starts_with($template->foto_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $template->foto_url);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('foto')->store('templates', 'public');
            $validated['foto_url'] = Storage::url($path);
        }

        DB::transaction(function () use ($template, $validated) {
            $template->update([
                'nama' => $validated['nama'],
                'harga_default' => $validated['harga_default'] ?? 0,
                'foto_url' => $validated['foto_url'] ?? $template->foto_url,
                'catatan' => $validated['catatan'] ?? null,
            ]);

            $template->templateItems()->delete();
            foreach ($validated['items'] as $itemData) {
                TemplateItem::create([
                    'template_id' => $template->id,
                    'item_id' => $itemData['item_id'],
                    'qty' => $itemData['qty'],
                ]);
            }
        });

        return redirect()->route('templates.show', $template)
            ->with('success', 'Template berhasil diperbarui');
    }

    public function destroy(Template $template): RedirectResponse
    {
        $template->update(['aktif' => false]);

        return redirect()->route('templates.index')
            ->with('success', 'Template dinonaktifkan');
    }
}
