import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    Filter,
    Flower2,
    Printer,
    Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

interface WasteRow {
    id: number;
    item?: {
        id: number;
        nama: string;
        satuan: string;
    } | null;
    tipe: string;
    qty: number;
    hpp_per_unit: number;
    nilai_kerugian: number;
    alasan: string;
    created_at: string;
}

interface WasteReportProps {
    movements: WasteRow[];
    summary: {
        total_kerugian: number;
        jumlah_kejadian: number;
    };
    filters: {
        dari: string;
        sampai: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan Bunga Layu & Waste',
        href: '/reports/waste',
    },
];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export default function ReportWaste({ movements, summary, filters }: WasteReportProps) {
    const [dari, setDari] = useState(filters.dari);
    const [sampai, setSampai] = useState(filters.sampai);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports/waste', { dari, sampai }, { preserveState: true, preserveScroll: true });
    };

    return (
        <>
            <Head title="Laporan Bunga Layu & Kerugian Waste - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Flower2 className="h-6 w-6 text-rose-500" />
                            Laporan Bunga Rusak, Layu & Waste
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Evaluasi kerugian bunga busuk/patah untuk meningkatkan efisiensi penyimpanan & perawatan toko
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

                {/* Filter */}
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

                {/* KPI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground flex items-center justify-between">
                                <span>Total Kerugian Finansial</span>
                                <AlertTriangle className="h-4 w-4 text-rose-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold font-mono text-rose-600">
                                {formatRupiah(summary.total_kerugian)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Dihitung berdasarkan nilai HPP riil saat bunga dibuang
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground flex items-center justify-between">
                                <span>Jumlah Kejadian Pembuangan</span>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-foreground">
                                {summary.jumlah_kejadian} <span className="text-sm font-normal text-muted-foreground">pencatatan</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[700px]">
                            <thead className="text-xs uppercase bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Waktu Pencatatan</th>
                                    <th className="px-4 py-3">Nama Bahan</th>
                                    <th className="px-4 py-3 text-right">Kuantitas Terbuang</th>
                                    <th className="px-4 py-3 text-right">HPP Satuan</th>
                                    <th className="px-4 py-3 text-right">Nilai Kerugian</th>
                                    <th className="px-4 py-3">Penyebab / Alasan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {movements.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                            Tidak ada catatan bunga rusak atau waste pada periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    movements.map((m) => (
                                        <tr key={m.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{m.created_at}</td>
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                <Link href={`/items/${m.item?.id}`} className="hover:text-rose-500 hover:underline">
                                                    {m.item?.nama}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-rose-600">
                                                {m.qty} {m.item?.satuan}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                                                {formatRupiah(m.hpp_per_unit)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                                                {formatRupiah(m.nilai_kerugian)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-foreground">
                                                {m.alasan}
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

ReportWaste.layout = {
    breadcrumbs,
};
