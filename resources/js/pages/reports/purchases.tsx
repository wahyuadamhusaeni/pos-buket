import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    Filter,
    Printer,
    Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

interface PurchaseReportRow {
    id: number;
    tanggal: string;
    supplier: string;
    ongkir: number;
    diskon: number;
    biaya_lain: number;
    total_biaya_tambahan: number;
}

interface PurchasesReportProps {
    purchases: PurchaseReportRow[];
    summary: {
        jumlah: number;
        total_ongkir: number;
    };
    filters: {
        dari: string;
        sampai: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan Pembelian & Ongkir',
        href: '/reports/purchases',
    },
];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export default function ReportPurchases({ purchases, summary, filters }: PurchasesReportProps) {
    const [dari, setDari] = useState(filters.dari);
    const [sampai, setSampai] = useState(filters.sampai);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports/purchases', { dari, sampai }, { preserveState: true, preserveScroll: true });
    };

    return (
        <>
            <Head title="Laporan Pembelian & Ongkir - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Truck className="h-6 w-6 text-rose-500" />
                            Laporan Pembelian & Beban Ekspedisi
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Rekapitulasi biaya cargo dan pengiriman bunga dari supplier/kebun
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

                {/* Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground">
                                Total Faktur Diterima
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold text-foreground">
                                {summary.jumlah} <span className="text-sm font-normal text-muted-foreground">transaksi</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground">
                                Total Biaya Ekspedisi / Cargo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold font-mono text-rose-600">
                                {formatRupiah(summary.total_ongkir)}
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
                                    <th className="px-4 py-3">No. Faktur</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Supplier</th>
                                    <th className="px-4 py-3 text-right">Ongkos Kirim</th>
                                    <th className="px-4 py-3 text-right">Diskon Supplier</th>
                                    <th className="px-4 py-3 text-right">Biaya Ekstra Bersih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {purchases.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                            Tidak ada pembelian pada periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    purchases.map((p) => (
                                        <tr key={p.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-mono font-bold">
                                                <Link href={`/purchases/${p.id}`} className="hover:text-rose-500 hover:underline">
                                                    PO-{p.id}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">{p.tanggal}</td>
                                            <td className="px-4 py-3 font-medium text-foreground">{p.supplier}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs">{formatRupiah(p.ongkir)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-emerald-600">-{formatRupiah(p.diskon)}</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-foreground">{formatRupiah(p.total_biaya_tambahan)}</td>
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

ReportPurchases.layout = {
    breadcrumbs,
};
