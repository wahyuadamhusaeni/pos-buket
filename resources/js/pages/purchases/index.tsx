import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    Eye,
    Filter,
    PackagePlus,
    PlusCircle,
    Search,
    Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

interface PurchaseRow {
    id: number;
    tanggal: string;
    supplier?: string | null;
    no_pesanan?: string | null;
    status: 'draft' | 'diterima' | 'dibatalkan';
    ongkir: number;
    diskon: number;
    biaya_lain: number;
    total_biaya_tambahan: number;
    diterima_at?: string | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface PurchasesIndexProps {
    purchases: PaginatedData<PurchaseRow>;
    filters: {
        status?: string;
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pembelian & Kulakan',
        href: '/purchases',
    },
];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export default function PurchasesIndex({ purchases, filters }: PurchasesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = () => {
        router.get(
            '/purchases',
            { search, status },
            { preserveState: true, preserveScroll: true }
        );
    };

    return (
        <>
            <Head title="Pembelian & Kulakan Stok - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Truck className="h-6 w-6 text-rose-500" />
                            Riwayat Pembelian & Kulakan Stok
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Pencatatan faktur masuk supplier, biaya ongkir cargo, dan pembaruan Moving Average HPP
                        </p>
                    </div>
                    <Button
                        asChild
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20"
                    >
                        <Link href="/purchases/create">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Tambah Pembelian Baru
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <div className="sm:col-span-6 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                    placeholder="Cari no. faktur / pesanan atau nama supplier..."
                                    className="pl-9 focus-visible:ring-rose-500"
                                />
                            </div>

                            <div className="sm:col-span-4">
                                <select
                                    value={status}
                                    onChange={(e) => {
                                        setStatus(e.target.value);
                                        router.get(
                                            '/purchases',
                                            { search, status: e.target.value },
                                            { preserveState: true, preserveScroll: true }
                                        );
                                    }}
                                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-rose-500"
                                >
                                    <option value="">Semua Status Penerimaan</option>
                                    <option value="diterima">Sudah Diterima (Masuk Stok)</option>
                                    <option value="draft">Draft (Belum Diterima)</option>
                                    <option value="dibatalkan">Dibatalkan</option>
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <Button
                                    type="button"
                                    onClick={handleFilter}
                                    className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                                    size="sm"
                                >
                                    <Filter className="h-4 w-4 mr-1.5" />
                                    Filter
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Purchases Table */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[700px]">
                            <thead className="text-xs uppercase bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-4 py-3">ID / No. Faktur</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Supplier</th>
                                    <th className="px-4 py-3 text-right">Biaya Ekspedisi (Ongkir)</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3">Waktu Penerimaan</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {purchases.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                            Belum ada faktur pembelian yang tercatat.
                                        </td>
                                    </tr>
                                ) : (
                                    purchases.data.map((p) => (
                                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3.5 font-bold font-mono text-foreground">
                                                PO-{p.id}
                                                {p.no_pesanan && (
                                                    <span className="text-xs font-normal text-muted-foreground ml-2">
                                                        ({p.no_pesanan})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                                                {p.tanggal}
                                            </td>
                                            <td className="px-4 py-3.5 font-medium text-foreground">
                                                {p.supplier || 'Supplier Umum'}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono text-xs">
                                                {p.ongkir > 0 ? formatRupiah(p.ongkir) : '-'}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {p.status === 'diterima' && (
                                                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-300">
                                                        Diterima (Stok Masuk)
                                                    </Badge>
                                                )}
                                                {p.status === 'draft' && (
                                                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                                                        Draft (Belum Masuk Stok)
                                                    </Badge>
                                                )}
                                                {p.status === 'dibatalkan' && (
                                                    <Badge variant="destructive">
                                                        Dibatalkan
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-muted-foreground">
                                                {p.diterima_at || '-'}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs text-rose-600 hover:text-rose-700"
                                                >
                                                    <Link href={`/purchases/${p.id}`}>
                                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                                        Detail
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {purchases.last_page > 1 && (
                        <div className="p-4 border-t border-border flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Menampilkan {purchases.data.length} dari {purchases.total} faktur pembelian
                            </span>
                            <div className="flex items-center gap-1">
                                {purchases.links.map((link, idx) => (
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

PurchasesIndex.layout = {
    breadcrumbs,
};
