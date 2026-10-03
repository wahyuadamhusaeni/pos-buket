import { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    Filter,
    History,
    Printer,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { BreadcrumbItem } from '@/types';

interface MovementRow {
    id: number;
    item?: {
        id: number;
        nama: string;
        satuan: string;
    } | null;
    tipe: 'in' | 'out';
    qty: number;
    hpp_per_unit: number;
    nilai: number;
    alasan: string;
    catatan?: string | null;
    created_by?: string | null;
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface StockReportProps {
    movements: PaginatedData<MovementRow>;
    items: { id: number; nama: string }[];
    filters: {
        dari: string;
        sampai: string;
        itemId?: number | null;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan Mutasi Stok',
        href: '/reports/stock',
    },
];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export default function ReportStock({ movements, items, filters }: StockReportProps) {
    const [dari, setDari] = useState(filters.dari);
    const [sampai, setSampai] = useState(filters.sampai);
    const [itemId, setItemId] = useState(filters.itemId ? String(filters.itemId) : '');

    const itemFilterOptions = useMemo(() => {
        return [
            { value: '', label: 'Semua Bahan Baku' },
            ...items.map((it) => ({
                value: String(it.id),
                label: it.nama,
            })),
        ];
    }, [items]);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/reports/stock',
            { dari, sampai, item_id: itemId || undefined },
            { preserveState: true, preserveScroll: true }
        );
    };

    return (
        <>
            <Head title="Laporan Mutasi Stok - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <History className="h-6 w-6 text-rose-500" />
                            Laporan Audit Mutasi Stok
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Buku besar log pergerakan stok keluar masuk seluruh bahan bunga dan perlengkapan
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                        className="text-xs self-start sm:self-auto"
                    >
                        <Printer className="h-3.5 w-3.5 mr-1.5" />
                        Cetak Laporan
                    </Button>
                </div>

                {/* Filter */}
                <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-4">
                        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3">
                            <div className="grid gap-1.5 w-full sm:w-64">
                                <Label htmlFor="item" className="text-xs">Filter Berdasarkan Bahan:</Label>
                                <SearchableSelect
                                    size="sm"
                                    value={itemId}
                                    onChange={(val) => setItemId(val ? String(val) : '')}
                                    options={itemFilterOptions}
                                    placeholder="Semua Bahan Baku"
                                    searchPlaceholder="Cari nama bunga / bahan..."
                                />
                            </div>

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

                {/* Table */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[700px]">
                            <thead className="text-xs uppercase bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Waktu</th>
                                    <th className="px-4 py-3">Bahan Baku</th>
                                    <th className="px-4 py-3 text-center">Arah</th>
                                    <th className="px-4 py-3 text-right">Jumlah</th>
                                    <th className="px-4 py-3 text-right">HPP Unit</th>
                                    <th className="px-4 py-3 text-right">Nilai Mutasi</th>
                                    <th className="px-4 py-3">Alasan / Sumber</th>
                                    <th className="px-4 py-3">Petugas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {movements.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                                            Tidak ada riwayat mutasi stok pada rentang waktu yang dipilih.
                                        </td>
                                    </tr>
                                ) : (
                                    movements.data.map((m) => (
                                        <tr key={m.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                {m.created_at}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                <Link href={`/items/${m.item?.id}`} className="hover:text-rose-500 hover:underline">
                                                    {m.item?.nama}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {m.tipe === 'in' ? (
                                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                                                        <ArrowDownRight className="h-3 w-3" />
                                                        Masuk
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                                                        <ArrowUpRight className="h-3 w-3" />
                                                        Keluar
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">
                                                <span className={m.tipe === 'in' ? 'text-emerald-600' : 'text-rose-600'}>
                                                    {m.tipe === 'in' ? '+' : '-'}{m.qty} {m.item?.satuan}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-xs">
                                                {formatRupiah(m.hpp_per_unit)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-medium text-foreground">
                                                {formatRupiah(m.nilai)}
                                            </td>
                                            <td className="px-4 py-3 capitalize text-xs">
                                                {m.alasan.replace('_', ' ')}
                                                {m.catatan && <div className="text-[10px] text-muted-foreground">{m.catatan}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {m.created_by || 'Sistem'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {movements.last_page > 1 && (
                        <div className="p-4 border-t border-border flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Menampilkan {movements.data.length} dari {movements.total} mutasi
                            </span>
                            <div className="flex items-center gap-1">
                                {movements.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        asChild={!!link.url}
                                        disabled={!link.url}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 text-xs"
                                    >
                                        {link.url ? (
                                            <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </>
    );
}

ReportStock.layout = {
    breadcrumbs,
};
