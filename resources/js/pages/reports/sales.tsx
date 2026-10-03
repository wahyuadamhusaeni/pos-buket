import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Calendar,
    Coins,
    DollarSign,
    Filter,
    Percent,
    Printer,
    Receipt,
    TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

interface SaleReportRow {
    id: number;
    tanggal: string;
    pelanggan: string;
    total_harga: number;
    total_hpp: number;
    laba_kotor: number;
    status_bayar: string;
    jumlah_buket: number;
}

interface SalesReportProps {
    sales: SaleReportRow[];
    summary: {
        total_omzet: number;
        total_hpp: number;
        total_laba: number;
        jumlah_transaksi: number;
    };
    filters: {
        dari: string;
        sampai: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan Penjualan',
        href: '/reports/sales',
    },
];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export default function ReportSales({ sales, summary, filters }: SalesReportProps) {
    const [dari, setDari] = useState(filters.dari);
    const [sampai, setSampai] = useState(filters.sampai);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports/sales', { dari, sampai }, { preserveState: true, preserveScroll: true });
    };

    const marginPersen = summary.total_omzet > 0
        ? (summary.total_laba / summary.total_omzet) * 100
        : 0;

    return (
        <>
            <Head title="Laporan Penjualan & Laba Kotor - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <TrendingUp className="h-6 w-6 text-rose-500" />
                            Laporan Penjualan & Laba Kotor
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Rekapitulasi omzet omzet, realisasi modal HPP bunga, dan profitabilitas toko
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                        className="text-xs"
                    >
                        <Printer className="h-3.5 w-3.5 mr-1.5" />
                        Cetak Laporan
                    </Button>
                </div>

                {/* Filter Date */}
                <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-4">
                        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="dari" className="text-xs">Dari Tanggal:</Label>
                                <Input
                                    id="dari"
                                    type="date"
                                    value={dari}
                                    onChange={(e) => setDari(e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="sampai" className="text-xs">Sampai Tanggal:</Label>
                                <Input
                                    id="sampai"
                                    type="date"
                                    value={sampai}
                                    onChange={(e) => setSampai(e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>

                            <Button type="submit" size="sm" className="h-8 bg-rose-500 hover:bg-rose-600 text-white text-xs">
                                <Filter className="h-3.5 w-3.5 mr-1.5" />
                                Terapkan Filter
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground flex items-center justify-between">
                                <span>Total Omzet Penjualan</span>
                                <Receipt className="h-4 w-4 text-rose-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold font-mono text-rose-600">
                                {formatRupiah(summary.total_omzet)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary.jumlah_transaksi} nota transaksi
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground flex items-center justify-between">
                                <span>Total Modal HPP</span>
                                <Coins className="h-4 w-4 text-amber-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold font-mono text-foreground">
                                {formatRupiah(summary.total_hpp)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Modal bunga & bahan terpakai
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground flex items-center justify-between">
                                <span>Laba Kotor (Gross Profit)</span>
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold font-mono text-emerald-600">
                                {formatRupiah(summary.total_laba)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Omzet dikurangi Modal HPP
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground flex items-center justify-between">
                                <span>Margin Keuntungan</span>
                                <Percent className="h-4 w-4 text-blue-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold font-mono text-blue-600">
                                {marginPersen.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Rasio laba kotor terhadap omzet
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[700px]">
                            <thead className="text-xs uppercase bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-4 py-3">No. Nota</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Pelanggan</th>
                                    <th className="px-4 py-3 text-center">Buket</th>
                                    <th className="px-4 py-3 text-right">Omzet</th>
                                    <th className="px-4 py-3 text-right">Modal HPP</th>
                                    <th className="px-4 py-3 text-right">Laba Kotor</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {sales.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                                            Tidak ada transaksi penjualan pada rentang tanggal yang dipilih.
                                        </td>
                                    </tr>
                                ) : (
                                    sales.map((s) => (
                                        <tr key={s.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-mono font-bold">#{s.id}</td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">{s.tanggal}</td>
                                            <td className="px-4 py-3 font-medium text-foreground">{s.pelanggan}</td>
                                            <td className="px-4 py-3 text-center text-xs">{s.jumlah_buket} buket</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                                                {formatRupiah(s.total_harga)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-muted-foreground text-xs">
                                                {formatRupiah(s.total_hpp)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">
                                                {formatRupiah(s.laba_kotor)}
                                            </td>
                                            <td className="px-4 py-3 text-center capitalize text-xs">
                                                <Badge variant="outline" className="text-[11px]">{s.status_bayar}</Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </>
    );
}

ReportSales.layout = {
    breadcrumbs,
};
