import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    Eye,
    Filter,
    PlusCircle,
    Receipt,
    Search,
    ShoppingBag,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

interface SaleRow {
    id: number;
    tanggal: string;
    pelanggan: string;
    total_harga: number;
    total_hpp: number;
    laba_kotor: number;
    status_bayar: 'lunas' | 'dp' | 'belum';
    metode: string;
    status: 'selesai' | 'dibatalkan';
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface SalesIndexProps {
    sales: PaginatedData<SaleRow>;
    filters: {
        status_bayar?: string;
        search?: string;
        tanggal_dari?: string;
        tanggal_sampai?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kasir & Penjualan',
        href: '/sales',
    },
];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export default function SalesIndex({ sales, filters }: SalesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusBayar, setStatusBayar] = useState(filters.status_bayar || '');
    const [status, setStatus] = useState(filters.status || 'selesai');
    const [dari, setDari] = useState(filters.tanggal_dari || '');
    const [sampai, setSampai] = useState(filters.tanggal_sampai || '');

    const handleFilter = (custom?: Record<string, string>) => {
        router.get(
            '/sales',
            {
                search,
                status_bayar: statusBayar,
                status,
                tanggal_dari: dari,
                tanggal_sampai: sampai,
                ...custom,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    return (
        <>
            <Head title="Riwayat Penjualan & Kasir - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Receipt className="h-6 w-6 text-rose-500" />
                            Riwayat Transaksi Penjualan
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Daftar nota penjualan, status pelunasan pelanggan, dan realisasi laba kotor
                        </p>
                    </div>
                    <Button
                        asChild
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20"
                    >
                        <Link href="/sales/create">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Transaksi Baru (POS)
                        </Link>
                    </Button>
                </div>

                {/* Filter Card */}
                <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <div className="sm:col-span-4 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                    placeholder="Cari nama pelanggan..."
                                    className="pl-9 focus-visible:ring-rose-500"
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <select
                                    value={statusBayar}
                                    onChange={(e) => {
                                        setStatusBayar(e.target.value);
                                        handleFilter({ status_bayar: e.target.value });
                                    }}
                                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-rose-500"
                                >
                                    <option value="">Semua Status Bayar</option>
                                    <option value="lunas">Lunas</option>
                                    <option value="dp">Uang Muka (DP)</option>
                                    <option value="belum">Belum Bayar</option>
                                </select>
                            </div>

                            <div className="sm:col-span-3">
                                <select
                                    value={status}
                                    onChange={(e) => {
                                        setStatus(e.target.value);
                                        handleFilter({ status: e.target.value });
                                    }}
                                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-rose-500"
                                >
                                    <option value="selesai">Transaksi Selesai</option>
                                    <option value="dibatalkan">Dibatalkan (Void)</option>
                                    <option value="semua">Semua Status</option>
                                </select>
                            </div>

                            <div className="sm:col-span-2 flex items-center gap-2">
                                <Button
                                    type="button"
                                    onClick={() => handleFilter()}
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

                {/* Sales Table */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[800px]">
                            <thead className="text-xs uppercase bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-4 py-3">No. Nota</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Pelanggan</th>
                                    <th className="px-4 py-3 text-right">Total Transaksi</th>
                                    <th className="px-4 py-3 text-right">Total HPP</th>
                                    <th className="px-4 py-3 text-right">Laba Kotor</th>
                                    <th className="px-4 py-3 text-center">Status Bayar</th>
                                    <th className="px-4 py-3 text-center">Metode</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {sales.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                                            Tidak ada transaksi ditemukan. Silakan buat transaksi pertama Anda.
                                        </td>
                                    </tr>
                                ) : (
                                    sales.data.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3.5 font-bold font-mono text-foreground">
                                                #{sale.id}
                                                {sale.status === 'dibatalkan' && (
                                                    <span className="ml-2 text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                                        BATAL
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                                                {sale.tanggal}
                                            </td>
                                            <td className="px-4 py-3.5 font-medium text-foreground">
                                                {sale.pelanggan}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground">
                                                {formatRupiah(sale.total_harga)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono text-muted-foreground text-xs">
                                                {formatRupiah(sale.total_hpp)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                                {formatRupiah(sale.laba_kotor)}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {sale.status_bayar === 'lunas' && (
                                                    <Badge className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300">
                                                        Lunas
                                                    </Badge>
                                                )}
                                                {sale.status_bayar === 'dp' && (
                                                    <Badge className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300">
                                                        DP (Cicil)
                                                    </Badge>
                                                )}
                                                {sale.status_bayar === 'belum' && (
                                                    <Badge variant="destructive">
                                                        Belum Bayar
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-center capitalize text-xs text-muted-foreground">
                                                {sale.metode}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs text-rose-600 hover:text-rose-700"
                                                >
                                                    <Link href={`/sales/${sale.id}`}>
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

                    {/* Pagination */}
                    {sales.last_page > 1 && (
                        <div className="p-4 border-t border-border flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Menampilkan {sales.data.length} dari {sales.total} penjualan
                            </span>
                            <div className="flex items-center gap-1">
                                {sales.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        asChild={!!link.url}
                                        disabled={!link.url}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 text-xs"
                                    >
                                        {link.url ? (
                                            <Link
                                                href={link.url}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
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

SalesIndex.layout = {
    breadcrumbs,
};
