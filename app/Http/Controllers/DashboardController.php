<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\StockMovement;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $today = Carbon::today();
        $startOfMonth = $today->copy()->startOfMonth();
        $startOfWeek = $today->copy()->startOfWeek(Carbon::MONDAY);

        // Sales metrics
        $salesQuery = Sale::where('status', 'selesai');

        $omzetHariIni = (int) (clone $salesQuery)->whereDate('tanggal', $today)->sum('total_harga');
        $omzetMingguIni = (int) (clone $salesQuery)->whereBetween('tanggal', [$startOfWeek, $today])->sum('total_harga');
        $omzetBulanIni = (int) (clone $salesQuery)->whereBetween('tanggal', [$startOfMonth, $today])->sum('total_harga');

        $hppBulanIni = (int) (clone $salesQuery)->whereBetween('tanggal', [$startOfMonth, $today])->sum('total_hpp');
        $labaKotorBulanIni = $omzetBulanIni - $hppBulanIni;

        // Inventory value: sum(stok_saat_ini * hpp_rata_rata) for non-asset items
        $nilaiPersediaan = (int) Item::where('aktif', true)
            ->whereIn('tipe', ['bunga_hidup', 'bunga_artifisial', 'pelengkap'])
            ->get()
            ->sum(fn (Item $item) => $item->stok_saat_ini * $item->hpp_rata_rata);

        // Low stock items
        $stokMenipis = Item::where('aktif', true)
            ->whereIn('tipe', ['bunga_hidup', 'bunga_artifisial', 'pelengkap'])
            ->whereRaw('stok_saat_ini <= stok_min')
            ->select(['id', 'nama', 'tipe', 'satuan', 'stok_saat_ini', 'stok_min'])
            ->orderBy('stok_saat_ini')
            ->limit(10)
            ->get()
            ->map(fn (Item $item) => [
                'id' => $item->id,
                'nama' => $item->nama,
                'tipe' => $item->tipe,
                'satuan' => $item->satuan,
                'stok_saat_ini' => (float) $item->stok_saat_ini,
                'stok_min' => (float) $item->stok_min,
            ]);

        // Waste and adjustments loss this month
        $kerugianBulanIni = (int) StockMovement::whereIn('tipe', ['waste', 'adjust'])
            ->where('qty', '<', 0)
            ->whereBetween('created_at', [$startOfMonth, $today->copy()->endOfDay()])
            ->sum('nilai'); // negative values = loss
        $kerugianBulanIni = abs($kerugianBulanIni);

        // Receivables (unpaid/DP sales)
        $piutang = Sale::where('status', 'selesai')
            ->whereIn('status_bayar', ['dp', 'belum'])
            ->select(['id', 'tanggal', 'pelanggan', 'total_harga', 'nominal_dp', 'status_bayar'])
            ->orderByDesc('tanggal')
            ->limit(10)
            ->get()
            ->map(function (Sale $s) {
                $paid = $s->status_bayar === 'dp' ? $s->nominal_dp : 0;

                return [
                    'id' => $s->id,
                    'tanggal' => $s->tanggal->format('d/m/Y'),
                    'pelanggan' => $s->pelanggan ?? 'Umum',
                    'total_harga' => $s->total_harga,
                    'sisa' => $s->total_harga - $paid,
                    'status_bayar' => $s->status_bayar,
                ];
            });

        $totalPiutang = (int) Sale::where('status', 'selesai')
            ->whereIn('status_bayar', ['dp', 'belum'])
            ->get()
            ->sum(fn (Sale $s) => $s->total_harga - ($s->status_bayar === 'dp' ? $s->nominal_dp : 0));

        // Recent transactions
        $transaksiTerakhir = Sale::where('status', 'selesai')
            ->with('lines')
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn (Sale $s) => [
                'id' => $s->id,
                'tanggal' => $s->tanggal->format('d/m/Y'),
                'pelanggan' => $s->pelanggan ?? 'Umum',
                'total_harga' => $s->total_harga,
                'total_hpp' => $s->total_hpp,
                'laba_kotor' => $s->total_harga - $s->total_hpp,
                'status_bayar' => $s->status_bayar,
                'jumlah_buket' => $s->lines->count(),
            ]);

        // Monthly sales chart data (last 6 months)
        $chartData = collect(range(5, 0))->map(function (int $monthsAgo) {
            $month = Carbon::now()->subMonths($monthsAgo);
            $start = $month->copy()->startOfMonth();
            $end = $month->copy()->endOfMonth();

            $query = Sale::where('status', 'selesai')->whereBetween('tanggal', [$start, $end]);
            $omzet = (int) (clone $query)->sum('total_harga');
            $hpp = (int) (clone $query)->sum('total_hpp');

            return [
                'bulan' => $month->translatedFormat('M Y'),
                'omzet' => $omzet,
                'laba' => $omzet - $hpp,
            ];
        })->values();

        $businessName = Setting::get('nama_usaha', 'KIYOMI STOCK');

        return Inertia::render('dashboard', [
            'metrics' => [
                'omzet_hari_ini' => $omzetHariIni,
                'omzet_minggu_ini' => $omzetMingguIni,
                'omzet_bulan_ini' => $omzetBulanIni,
                'laba_kotor_bulan_ini' => $labaKotorBulanIni,
                'nilai_persediaan' => $nilaiPersediaan,
                'kerugian_bulan_ini' => $kerugianBulanIni,
                'total_piutang' => $totalPiutang,
            ],
            'stok_menipis' => $stokMenipis,
            'piutang' => $piutang,
            'transaksi_terakhir' => $transaksiTerakhir,
            'chart_data' => $chartData,
            'business_name' => $businessName,
        ]);
    }
}
