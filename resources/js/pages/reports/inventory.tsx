import { Head, Link } from '@inertiajs/react';
import {
    Coins,
    Layers,
    Package,
    Printer,
    ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

interface InventoryItem {
    id: number;
    nama: string;
    tipe: string;
    satuan: string;
    stok_saat_ini: number;
    hpp_rata_rata: number;
    nilai_persediaan: number;
    stok_min: number;
    is_low_stock: boolean;
}

interface InventoryReportProps {
    items: InventoryItem[];
    total_nilai: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan Nilai Persediaan',
        href: '/reports/inventory',
    },
];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

const getTipeBadge = (tipe: string) => {
    switch (tipe) {
        case 'bunga_hidup':
            return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">Bunga Hidup</Badge>;
        case 'bunga_artifisial':
            return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30">Artifisial</Badge>;
        case 'pelengkap':
            return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">Pelengkap</Badge>;
        default:
            return <Badge variant="outline">{tipe}</Badge>;
    }
};

export default function ReportInventory({ items, total_nilai }: InventoryReportProps) {
    const lowStockCount = items.filter((it) => it.is_low_stock).length;

    return (
        <>
            <Head title="Laporan Nilai Persediaan - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Coins className="h-6 w-6 text-rose-500" />
                            Laporan Nilai Buku Persediaan (Valuasi Moving Average HPP)
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Valuasi total modal aset bahan baku yang saat ini tersimpan di etalase dan kulkas toko
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

                {/* KPI */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground flex items-center justify-between">
                                <span>Total Valuasi Nilai Persediaan</span>
                                <Coins className="h-4 w-4 text-rose-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold font-mono text-rose-600">
                                {formatRupiah(total_nilai)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total kapitalisasi modal stok toko
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground flex items-center justify-between">
                                <span>Total Varian Bahan Baku</span>
                                <Layers className="h-4 w-4 text-foreground" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-foreground">
                                {items.length} <span className="text-sm font-normal text-muted-foreground">jenis bahan</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground flex items-center justify-between">
                                <span>Bahan Perlu Kulakan (Menipis)</span>
                                <ShieldAlert className="h-4 w-4 text-amber-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-amber-600">
                                {lowStockCount} <span className="text-sm font-normal text-muted-foreground">bahan</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Stok berada di bawah ambang batas minimum
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
                                    <th className="px-4 py-3">Nama Bahan Baku</th>
                                    <th className="px-4 py-3">Tipe</th>
                                    <th className="px-4 py-3 text-right">Stok Fisik Saat Ini</th>
                                    <th className="px-4 py-3 text-right">HPP Rata-Rata</th>
                                    <th className="px-4 py-3 text-right">Total Nilai Persediaan</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {items.map((it) => (
                                    <tr key={it.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3.5 font-medium text-foreground">
                                            <Link href={`/items/${it.id}`} className="hover:text-rose-500 hover:underline">
                                                {it.nama}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3.5">{getTipeBadge(it.tipe)}</td>
                                        <td className="px-4 py-3.5 text-right font-bold">
                                            <span className={it.is_low_stock ? 'text-rose-600' : ''}>
                                                {it.stok_saat_ini} {it.satuan}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono text-xs">
                                            {formatRupiah(it.hpp_rata_rata)}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground">
                                            {formatRupiah(it.nilai_persediaan)}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            {it.is_low_stock ? (
                                                <Badge variant="destructive" className="text-[11px]">Menipis</Badge>
                                            ) : (
                                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 text-[11px]">Aman</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </>
    );
}

ReportInventory.layout = {
    breadcrumbs,
};
