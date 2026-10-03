import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Eye,
    Filter,
    PlusCircle,
    Receipt,
    Search,
    ShoppingBag,
    Store,
    Truck,
    X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

interface SaleRow {
    id: number;
    tanggal: string;
    jenis_pesanan: 'langsung' | 'preorder';
    tanggal_ambil?: string | null;
    jam_ambil?: string | null;
    tipe_pengiriman?: 'pickup' | 'delivery';
    status_pesanan: 'antrean' | 'proses' | 'siap' | 'selesai' | 'dibatalkan';
    pelanggan: string;
    telepon_pelanggan?: string | null;
    total_harga: number;
    total_hpp: number;
    laba_kotor: number;
    status_bayar: 'lunas' | 'dp' | 'belum';
    metode: string;
    total_terbayar: number;
    sisa_tagihan: number;
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
    stats: {
        total_belum_lunas: number;
        po_hari_ini: number;
    };
    filters: {
        status_bayar?: string;
        search?: string;
        tanggal_dari?: string;
        tanggal_sampai?: string;
        status?: string;
        jadwal?: string;
        status_pesanan?: string;
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

export default function SalesIndex({ sales, stats, filters }: SalesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusBayar, setStatusBayar] = useState(filters.status_bayar || '');
    const [status, setStatus] = useState(filters.status || 'selesai');
    const [jadwal, setJadwal] = useState(filters.jadwal || '');
    const [statusPesanan, setStatusPesanan] = useState(filters.status_pesanan || '');
    const [dari, setDari] = useState(filters.tanggal_dari || '');
    const [sampai, setSampai] = useState(filters.tanggal_sampai || '');

    // Quick Pelunasan Modal
    const [settleSale, setSettleSale] = useState<SaleRow | null>(null);
    const { data: settleData, setData: setSettleData, post: postSettle, processing: settling, reset: resetSettle } = useForm({
        tanggal: new Date().toISOString().split('T')[0],
        nominal: 0,
        metode: 'tunai' as 'tunai' | 'transfer' | 'lainnya',
        catatan: 'Pelunasan pesanan saat buket diserahkan',
        mark_as_completed: true,
    });

    const openQuickSettle = (sale: SaleRow) => {
        setSettleSale(sale);
        setSettleData({
            tanggal: new Date().toISOString().split('T')[0],
            nominal: sale.sisa_tagihan,
            metode: 'tunai',
            catatan: 'Pelunasan sisa tagihan buket',
            mark_as_completed: true,
        });
    };

    const submitQuickSettle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!settleSale) return;

        postSettle(`/sales/${settleSale.id}/payments`, {
            onSuccess: () => {
                setSettleSale(null);
                resetSettle();
            },
        });
    };

    const handleFilter = (custom?: Record<string, string>) => {
        router.get(
            '/sales',
            {
                search,
                status_bayar: statusBayar,
                status,
                jadwal,
                status_pesanan: statusPesanan,
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

    const applyQuickTab = (tab: 'semua' | 'belum_lunas' | 'hari_ini') => {
        if (tab === 'semua') {
            setStatusBayar('');
            setJadwal('');
            handleFilter({ status_bayar: '', jadwal: '' });
        } else if (tab === 'belum_lunas') {
            setStatusBayar('belum_lunas');
            setJadwal('');
            handleFilter({ status_bayar: 'belum_lunas', jadwal: '' });
        } else if (tab === 'hari_ini') {
            setJadwal('hari_ini');
            handleFilter({ jadwal: 'hari_ini' });
        }
    };

    const isTabActive = (tab: 'semua' | 'belum_lunas' | 'hari_ini') => {
        if (tab === 'semua') return !statusBayar && !jadwal;
        if (tab === 'belum_lunas') return statusBayar === 'belum_lunas';
        if (tab === 'hari_ini') return jadwal === 'hari_ini';
        return false;
    };

    return (
        <>
            <Head title="Riwayat Penjualan & Pesanan - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Receipt className="h-6 w-6 text-rose-500" />
                            Riwayat Penjualan & Pesanan Buket
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola pesanan langsung, pre-order terjadwal, pelunasan sisa uang muka, dan status pengerjaan buket.
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

                {/* Quick Workflow Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => applyQuickTab('semua')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            isTabActive('semua')
                                ? 'bg-rose-500 text-white shadow-sm'
                                : 'bg-muted/70 hover:bg-muted text-muted-foreground'
                        }`}
                    >
                        Semua Transaksi
                    </button>

                    <button
                        type="button"
                        onClick={() => applyQuickTab('belum_lunas')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            isTabActive('belum_lunas')
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                        }`}
                    >
                        <Clock className="h-3.5 w-3.5" />
                        Perlu Pelunasan / DP ({stats?.total_belum_lunas || 0})
                    </button>

                    <button
                        type="button"
                        onClick={() => applyQuickTab('hari_ini')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            isTabActive('hari_ini')
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 hover:bg-blue-200'
                        }`}
                    >
                        <Calendar className="h-3.5 w-3.5" />
                        Jadwal Ambil Hari Ini ({stats?.po_hari_ini || 0})
                    </button>
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
                                    placeholder="Cari pelanggan / telepon..."
                                    className="pl-9 focus-visible:ring-rose-500 text-xs"
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <select
                                    value={statusBayar}
                                    onChange={(e) => {
                                        setStatusBayar(e.target.value);
                                        handleFilter({ status_bayar: e.target.value });
                                    }}
                                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:ring-1 focus-visible:ring-rose-500"
                                >
                                    <option value="">Semua Status Bayar</option>
                                    <option value="belum_lunas">⚠️ Belum Lunas (DP + Belum)</option>
                                    <option value="lunas">Lunas Penuh</option>
                                    <option value="dp">Uang Muka (DP)</option>
                                    <option value="belum">Belum Bayar</option>
                                </select>
                            </div>

                            <div className="sm:col-span-3">
                                <select
                                    value={statusPesanan}
                                    onChange={(e) => {
                                        setStatusPesanan(e.target.value);
                                        handleFilter({ status_pesanan: e.target.value });
                                    }}
                                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:ring-1 focus-visible:ring-rose-500"
                                >
                                    <option value="">Semua Status Pengerjaan</option>
                                    <option value="antrean">Antrean (Belum Dibuat)</option>
                                    <option value="proses">Sedang Dirangkai</option>
                                    <option value="siap">Siap Diambil / Kirim</option>
                                    <option value="selesai">Selesai (Sudah Diambil)</option>
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
                        <table className="w-full text-xs text-left min-w-[850px]">
                            <thead className="text-[11px] uppercase bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-4 py-3">No. Nota</th>
                                    <th className="px-4 py-3">Jadwal Ambil / Kirim</th>
                                    <th className="px-4 py-3">Pelanggan</th>
                                    <th className="px-4 py-3 text-right">Total Tagihan</th>
                                    <th className="px-4 py-3 text-center">Status Bayar</th>
                                    <th className="px-4 py-3 text-center">Status Pengerjaan</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {sales.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                            Tidak ada transaksi ditemukan dengan filter yang dipilih.
                                        </td>
                                    </tr>
                                ) : (
                                    sales.data.map((sale) => {
                                        const hasPendingAmount = sale.sisa_tagihan > 0 && sale.status !== 'dibatalkan';

                                        return (
                                            <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                                                {/* No. Nota & Jenis */}
                                                <td className="px-4 py-3 font-mono">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-foreground">#{sale.id}</span>
                                                        {sale.jenis_pesanan === 'preorder' ? (
                                                            <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.2 rounded font-sans font-semibold">
                                                                PO
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.2 rounded font-sans">
                                                                Langsung
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5 font-sans">
                                                        Order: {sale.tanggal}
                                                    </div>
                                                </td>

                                                {/* Jadwal Ambil / Pengiriman */}
                                                <td className="px-4 py-3">
                                                    {sale.jenis_pesanan === 'preorder' && sale.tanggal_ambil ? (
                                                        <div>
                                                            <div className="font-bold text-foreground flex items-center gap-1">
                                                                <Calendar className="h-3 w-3 text-rose-500" />
                                                                {sale.tanggal_ambil} {sale.jam_ambil && <span className="font-normal text-muted-foreground">• {sale.jam_ambil}</span>}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                                                {sale.tipe_pengiriman === 'delivery' ? (
                                                                    <>
                                                                        <Truck className="h-3 w-3 text-amber-500" /> Kirim Kurir
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Store className="h-3 w-3 text-emerald-500" /> Ambil Sendiri
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-muted-foreground">
                                                            <span>Buket Langsung Jadi</span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Pelanggan */}
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-foreground truncate max-w-[160px]">
                                                        {sale.pelanggan}
                                                    </div>
                                                    {sale.telepon_pelanggan && (
                                                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                                            {sale.telepon_pelanggan}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Total & Sisa Tagihan */}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="font-mono font-bold text-foreground">
                                                        {formatRupiah(sale.total_harga)}
                                                    </div>
                                                    {hasPendingAmount ? (
                                                        <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                                                            Sisa: {formatRupiah(sale.sisa_tagihan)}
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-emerald-600 font-sans mt-0.5">
                                                            Terbayar Penuh
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Status Bayar */}
                                                <td className="px-4 py-3 text-center">
                                                    {sale.status_bayar === 'lunas' && (
                                                        <Badge className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 text-[10px] py-0.5">
                                                            Lunas
                                                        </Badge>
                                                    )}
                                                    {sale.status_bayar === 'dp' && (
                                                        <Badge className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 text-[10px] py-0.5">
                                                            DP (Uang Muka)
                                                        </Badge>
                                                    )}
                                                    {sale.status_bayar === 'belum' && (
                                                        <Badge variant="outline" className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300 border-slate-300 text-[10px] py-0.5">
                                                            Belum Bayar
                                                        </Badge>
                                                    )}
                                                </td>

                                                {/* Status Pengerjaan */}
                                                <td className="px-4 py-3 text-center">
                                                    {sale.status === 'dibatalkan' ? (
                                                        <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded font-bold">
                                                            DIBATALKAN
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                                                sale.status_pesanan === 'selesai'
                                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                                    : sale.status_pesanan === 'siap'
                                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold animate-pulse'
                                                                    : sale.status_pesanan === 'proses'
                                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                            }`}
                                                        >
                                                            {sale.status_pesanan === 'selesai'
                                                                ? 'Selesai'
                                                                : sale.status_pesanan === 'siap'
                                                                ? 'Siap Diambil'
                                                                : sale.status_pesanan === 'proses'
                                                                ? 'Sedang Dirangkai'
                                                                : 'Antrean PO'}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Aksi */}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {hasPendingAmount && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() => openQuickSettle(sale)}
                                                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 shadow-sm"
                                                            >
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Lunasi
                                                            </Button>
                                                        )}

                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
                                                        >
                                                            <Link href={`/sales/${sale.id}`}>
                                                                <Eye className="h-3.5 w-3.5 mr-1" />
                                                                Detail
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {sales.links && sales.links.length > 3 && (
                        <div className="p-3 border-t flex justify-end gap-1">
                            {sales.links.map((link, idx) => (
                                <Button
                                    key={idx}
                                    asChild={Boolean(link.url)}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    className={`h-8 text-xs ${link.active ? 'bg-rose-500' : ''}`}
                                >
                                    {link.url ? (
                                        <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                    ) : (
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    )}
                                </Button>
                            ))}
                        </div>
                    )}
                </Card>

                {/* MODAL PELUNASAN CEPAT */}
                {settleSale && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <Card className="max-w-md w-full border-border/80 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150">
                            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Receipt className="h-4 w-4 text-emerald-600" />
                                        Pelunasan Pesanan #{settleSale.id}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Pelanggan: <strong className="text-foreground">{settleSale.pelanggan}</strong>
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSettleSale(null)}
                                    className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </CardHeader>

                            <form onSubmit={submitQuickSettle}>
                                <CardContent className="p-4 space-y-4">
                                    {/* Breakdown */}
                                    <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Total Tagihan Transaksi:</span>
                                            <span className="font-mono">{formatRupiah(settleSale.total_harga)}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Sudah Terbayar (DP):</span>
                                            <span className="font-mono text-emerald-600 font-semibold">{formatRupiah(settleSale.total_terbayar)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-foreground pt-1 border-t text-sm">
                                            <span>Sisa yang Harus Dilunasi:</span>
                                            <span className="font-mono text-rose-600">{formatRupiah(settleSale.sisa_tagihan)}</span>
                                        </div>
                                    </div>

                                    {/* Tanggal Pelunasan */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="settle-date" className="text-xs">Tanggal Pelunasan</Label>
                                        <Input
                                            id="settle-date"
                                            type="date"
                                            value={settleData.tanggal}
                                            onChange={(e) => setSettleData('tanggal', e.target.value)}
                                            className="h-9 text-xs"
                                            required
                                        />
                                    </div>

                                    {/* Nominal Bayar */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="settle-nominal" className="text-xs font-semibold">
                                            Nominal Pelunasan (Rp)
                                        </Label>
                                        <Input
                                            id="settle-nominal"
                                            type="number"
                                            min="1"
                                            max={settleSale.sisa_tagihan}
                                            value={settleData.nominal}
                                            onChange={(e) => setSettleData('nominal', parseInt(e.target.value) || 0)}
                                            className="h-9 text-sm font-bold font-mono"
                                            required
                                        />
                                    </div>

                                    {/* Metode Pembayaran */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="settle-metode" className="text-xs">Metode Pembayaran</Label>
                                        <select
                                            id="settle-metode"
                                            value={settleData.metode}
                                            onChange={(e) => setSettleData('metode', e.target.value as any)}
                                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:ring-1 focus-visible:ring-emerald-500"
                                        >
                                            <option value="tunai">Tunai / Cash</option>
                                            <option value="transfer">Transfer Bank / QRIS</option>
                                            <option value="lainnya">Lainnya / EDC / Debit</option>
                                        </select>
                                    </div>

                                    {/* Checkbox: Mark as completed */}
                                    <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settleData.mark_as_completed}
                                            onChange={(e) => setSettleData('mark_as_completed', e.target.checked)}
                                            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                        />
                                        <span className="text-xs text-foreground font-medium">
                                            Tandai pesanan buket langsung <strong>Selesai (Sudah Diambil)</strong>
                                        </span>
                                    </label>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-2 border-t">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-1/2 text-xs"
                                            onClick={() => setSettleSale(null)}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={settling || settleData.nominal <= 0}
                                            className="w-1/2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                        >
                                            {settling ? 'Menyimpan...' : 'Simpan Pelunasan'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </>
    );
}

SalesIndex.layout = {
    breadcrumbs,
};
