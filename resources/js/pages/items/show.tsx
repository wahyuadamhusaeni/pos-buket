import { Head, Link } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowLeft,
    ArrowUpRight,
    Calendar,
    Coins,
    Edit3,
    History,
    Layers,
    Package,
    ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

interface Movement {
    id: number;
    tipe: 'in' | 'out';
    qty: number;
    hpp_per_unit: number;
    nilai: number;
    alasan: string;
    catatan?: string | null;
    created_at: string;
}

interface ItemDetail {
    id: number;
    nama: string;
    tipe: 'bunga_hidup' | 'bunga_artifisial' | 'pelengkap' | 'aset';
    kategori?: string | null;
    satuan: string;
    stok_saat_ini: number;
    hpp_rata_rata: number;
    stok_min: number;
    nilai_persediaan: number;
    is_low_stock: boolean;
    foto_url?: string | null;
    catatan?: string | null;
    aktif: boolean;
}

interface ItemShowProps {
    item: ItemDetail;
    movements: Movement[];
}

const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
};

const formatQty = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '0';
    const num = Number(value);
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 2,
    }).format(num);
};

export default function ItemShow({ item, movements }: ItemShowProps) {
    return (
        <>
            <Head title={`Kartu Stok: ${item.nama} - KIYOMI STOCK`} />

            <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Link href="/items">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {item.nama}
                                </h1>
                                {item.is_low_stock && (
                                    <Badge variant="destructive" className="flex items-center gap-1">
                                        <ShieldAlert className="h-3 w-3" />
                                        Stok Menipis
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Kategori: <span className="font-medium text-foreground">{item.kategori || 'Umum'}</span> • Satuan: <span className="font-medium text-foreground">{item.satuan}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline">
                            <Link href={`/items/${item.id}/edit`}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Bahan
                            </Link>
                        </Button>
                        <Button
                            asChild
                            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
                        >
                            <Link href="/stock/adjustments">
                                Penyesuaian / Opname
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-border/60 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground flex items-center justify-between">
                                <span>Stok Fisik Saat Ini</span>
                                <Package className="h-4 w-4 text-rose-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-foreground">
                                {formatQty(item.stok_saat_ini)} <span className="text-base font-normal text-muted-foreground">{item.satuan}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Batas minimum aman: {formatQty(item.stok_min)} {item.satuan}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-bl-full pointer-events-none" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground flex items-center justify-between">
                                <span>HPP Rata-Rata (Moving Average)</span>
                                <Coins className="h-4 w-4 text-pink-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-foreground font-mono">
                                {formatRupiah(item.hpp_rata_rata)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Dihitung otomatis dari riwayat pembelian
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground flex items-center justify-between">
                                <span>Total Nilai Persediaan</span>
                                <Layers className="h-4 w-4 text-emerald-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-foreground font-mono">
                                {formatRupiah(item.nilai_persediaan)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Stok Fisik × HPP Rata-Rata
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Info if available */}
                {item.catatan && (
                    <Card className="border-border/60 bg-muted/20">
                        <CardContent className="p-4">
                            <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Catatan Khusus:</div>
                            <p className="text-sm text-foreground">{item.catatan}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Stock Movement Audit Log (Kartu Stok) */}
                <Card className="border-border/60 shadow-sm">
                    <CardHeader className="border-b border-border/60 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-rose-500" />
                                <CardTitle className="text-base font-semibold">
                                    Buku Mutasi Stok (Kartu Stok)
                                </CardTitle>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                50 mutasi transaksi terakhir
                            </span>
                        </div>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Waktu</th>
                                    <th className="px-4 py-3">Arah</th>
                                    <th className="px-4 py-3 text-right">Jumlah (Qty)</th>
                                    <th className="px-4 py-3 text-right">HPP Unit</th>
                                    <th className="px-4 py-3 text-right">Total Nilai</th>
                                    <th className="px-4 py-3">Alasan / Sumber</th>
                                    <th className="px-4 py-3">Catatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {movements.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                            Belum ada riwayat mutasi stok untuk bahan ini.
                                        </td>
                                    </tr>
                                ) : (
                                    movements.map((m) => (
                                        <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {m.created_at}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {m.tipe === 'in' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                                                        <ArrowDownRight className="h-3 w-3" />
                                                        Masuk
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                                                        <ArrowUpRight className="h-3 w-3" />
                                                        Keluar
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">
                                                <span className={m.tipe === 'in' ? 'text-emerald-600' : 'text-rose-600'}>
                                                    {m.tipe === 'in' ? '+' : '-'}{formatQty(m.qty)} {item.satuan}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-xs">
                                                {formatRupiah(m.hpp_per_unit)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-medium text-foreground">
                                                {formatRupiah(m.nilai)}
                                            </td>
                                            <td className="px-4 py-3 capitalize font-medium text-foreground">
                                                {m.alasan.replace('_', ' ')}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                                                {m.catatan || '-'}
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

ItemShow.layout = {
    breadcrumbs: [
        {
            title: 'Master Bahan & Stok',
            href: '/items',
        },
        {
            title: 'Kartu Stok',
            href: '#',
        },
    ],
};
