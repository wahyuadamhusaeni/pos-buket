<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    private const SETTINGS = [
        'nama_usaha',
        'margin_target',
        'stok_min_default',
        'mata_uang',
    ];

    public function index(): Response
    {
        $settings = [];
        foreach (self::SETTINGS as $key) {
            $settings[$key] = Setting::get($key);
        }

        // Defaults
        $settings['nama_usaha'] ??= 'KIYOMI STOCK';
        $settings['margin_target'] ??= '30';
        $settings['stok_min_default'] ??= '5';
        $settings['mata_uang'] ??= 'IDR';

        return Inertia::render('settings/business', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama_usaha' => ['required', 'string', 'max:100'],
            'margin_target' => ['required', 'numeric', 'min:0', 'max:99'],
            'stok_min_default' => ['required', 'numeric', 'min:0'],
            'mata_uang' => ['required', 'string', 'max:10'],
        ]);

        foreach ($validated as $key => $value) {
            Setting::set($key, (string) $value);
        }

        return back()->with('success', 'Pengaturan berhasil disimpan');
    }
}
