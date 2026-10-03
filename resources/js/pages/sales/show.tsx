import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Banknote,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    FileText,
    Flower2,
    Layers,
    Phone,
    Printer,
    Receipt,
    ShoppingBag,
    Sparkles,
    Store,
    Trash2,
    Truck,
    User,
    X,
    XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kasir & Penjualan',
        href: '/sales',
    },
    {
        title: 'Detail Transaksi',
        href: '#',
    },
];

interface ComponentDetail {
    id: number;
    item: {
        id: number;
        nama: string;
        satuan: string;
    };
    qty: number;
    hpp_snapshot: number;
    nilai_hpp: number;
}

interface SaleLineDetail {
    id: number;
    nama_buket: string;
    harga_jual: number;
    hpp_total: number;
    biaya_tambahan: number;
    margin_persen: number;
    laba_kotor: number;
    template_id?: number | null;
    components: ComponentDetail[];
}

interface PaymentDetail {
    id: number;
    tanggal: string;
    nominal: number;
    metode: string;
    catatan?: string | null;
}

interface SaleFeeDetail {
    id: number;
    nama: string;
    nominal: number;
    catatan?: string | null;
}

interface SaleDetail {
    id: number;
    tanggal: string;
    jenis_pesanan: 'langsung' | 'preorder';
    tanggal_ambil?: string | null;
    jam_ambil?: string | null;
    tipe_pengiriman?: 'pickup' | 'delivery';
    status_pesanan: 'antrean' | 'proses' | 'siap' | 'selesai' | 'dibatalkan';
    pelanggan?: string | null;
    telepon_pelanggan?: string | null;
    catatan?: string | null;
    total_harga: number;
    total_hpp: number;
    laba_kotor: number;
    total_biaya_jasa?: number;
    status_bayar: 'lunas' | 'dp' | 'belum';
    metode: string;
    nominal_dp: number;
    status: 'selesai' | 'dibatalkan';
    alasan_batal?: string | null;
    penanganan_stok?: 'restock' | 'ready_stock' | 'waste' | null;
    penanganan_dp?: 'hangus' | 'refund' | null;
    nominal_refund?: number;
    total_terbayar: number;
    sisa_tagihan: number;
    fees?: SaleFeeDetail[];
    lines: SaleLineDetail[];
    payments: PaymentDetail[];
}

interface SalesShowProps {
    sale: SaleDetail;
}

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export default function SalesShow({ sale }: SalesShowProps) {
    // Payment Form
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const paymentForm = useForm({
        tanggal: new Date().toISOString().split('T')[0],
        nominal: sale.sisa_tagihan,
        metode: 'tunai',
        catatan: 'Pelunasan sisa tagihan buket',
        mark_as_completed: true,
    });

    // Cancel / Abandoned Form
    const [showCancelModal, setShowCancelModal] = useState(false);
    const cancelForm = useForm({
        alasan: '',
        penanganan_stok: 'ready_stock' as 'ready_stock' | 'restock' | 'waste',
        penanganan_dp: 'hangus' as 'hangus' | 'refund',
        nominal_refund: sale.total_terbayar > 0 ? sale.total_terbayar : 0,
        metode_refund: 'tunai' as 'tunai' | 'transfer' | 'lainnya',
    });

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        paymentForm.post(`/sales/${sale.id}/payments`, {
            onSuccess: () => {
                setShowPaymentForm(false);
                paymentForm.reset();
            },
        });
    };

    const submitCancel = (e: React.FormEvent) => {
        e.preventDefault();
        cancelForm.post(`/sales/${sale.id}/cancel`, {
            onSuccess: () => setShowCancelModal(false),
        });
    };

    const updateOrderStatus = (newStatus: 'antrean' | 'proses' | 'siap' | 'selesai') => {
        router.patch(
            `/sales/${sale.id}/status-pesanan`,
            { status_pesanan: newStatus },
            { preserveScroll: true }
        );
    };

    return (
        <>
            <Head title={`Nota Penjualan #${sale.id} - KIYOMI STOCK`} />

            <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto print:hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Link href="/sales">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Nota Penjualan #{sale.id}
                                </h1>
                                {sale.status === 'dibatalkan' ? (
                                    <Badge variant="destructive">Dibatalkan / Tidak Diambil</Badge>
                                ) : sale.jenis_pesanan === 'preorder' ? (
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                        Pre-Order (PO)
                                    </Badge>
                                ) : (
                                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        Langsung Jadi
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Tanggal Order: {sale.tanggal} • Kasir Toko
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="text-xs"
                        >
                            <Printer className="h-3.5 w-3.5 mr-1.5" />
                            Cetak Struk / Nota
                        </Button>

                        {sale.status !== 'dibatalkan' && sale.sisa_tagihan > 0 && (
                            <Button
                                size="sm"
                                onClick={() => setShowPaymentForm(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                            >
                                <Banknote className="h-3.5 w-3.5 mr-1.5" />
                                Catat Pelunasan
                            </Button>
                        )}

                        {sale.status !== 'dibatalkan' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCancelModal(true)}
                                className="text-destructive hover:bg-destructive/10 text-xs border-destructive/30"
                            >
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Batalkan / Tidak Diambil
                            </Button>
                        )}
                    </div>
                </div>

                {/* Detailed Cancellation / Abandonment Resolution Card */}
                {sale.status === 'dibatalkan' && (
                    <Card className="border-destructive/30 bg-destructive/5 overflow-hidden shadow-sm">
                        <CardHeader className="bg-destructive/10 py-3 px-4 flex flex-row items-center justify-between border-b border-destructive/20">
                            <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                Transaksi Ini Telah Dibatalkan / Buket Tidak Diambil
                            </div>
                            <Badge variant="destructive">Status: Dibatalkan</Badge>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3 bg-background rounded-lg border">
                                    <span className="text-muted-foreground block text-[11px]">Alasan Pembatalan:</span>
                                    <strong className="text-foreground text-xs">{sale.alasan_batal || 'Tidak diambil / Dibatalkan'}</strong>
                                </div>

                                <div className="p-3 bg-background rounded-lg border">
                                    <span className="text-muted-foreground block text-[11px]">Perlakuan Buket Fisik & Stok:</span>
                                    <strong className="text-foreground text-xs">
                                        {sale.penanganan_stok === 'ready_stock'
                                            ? '💐 Dijadikan Buket Pajangan (Ready Stock Toko)'
                                            : sale.penanganan_stok === 'waste'
                                            ? '🥀 Dicatat Kerugian Bunga Rusak (Waste)'
                                            : '📦 Bahan Dibongkar & Dikembalikan ke Stok'}
                                    </strong>
                                </div>

                                <div className="p-3 bg-background rounded-lg border">
                                    <span className="text-muted-foreground block text-[11px]">Perlakuan Uang DP / Pembayaran:</span>
                                    <strong className="text-foreground text-xs">
                                        {sale.penanganan_dp === 'refund'
                                            ? `💸 DP Dikembalikan ke Pelanggan (${formatRupiah(sale.nominal_refund || 0)})`
                                            : sale.total_terbayar > 0
                                            ? `🔒 DP ${formatRupiah(sale.total_terbayar)} Ditahan Toko (Hangus)`
                                            : 'Tidak Ada Pembayaran (Piutang Penuh)'}
                                    </strong>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* PROMINENT ALERT BANNER IF PENDING PAYMENT */}
                {sale.status !== 'dibatalkan' && sale.sisa_tagihan > 0 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold text-sm">
                                    {sale.status_bayar === 'dp'
                                        ? '⚠️ Tagihan Belum Lunas (Masih Ada Sisa Pembayaran DP)'
                                        : '⚠️ Tagihan Belum Dibayar Sama Sekali (Piutang Penuh)'}
                                </div>
                                <div className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1 space-x-2">
                                    <span>Total: <strong>{formatRupiah(sale.total_harga)}</strong></span>
                                    <span>•</span>
                                    <span>Sudah Masuk (DP): <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{formatRupiah(sale.total_terbayar)}</strong></span>
                                    <span>•</span>
                                    <span>Sisa yang Harus Dilunasi: <strong className="text-sm font-mono font-extrabold text-rose-600 dark:text-rose-400">{formatRupiah(sale.sisa_tagihan)}</strong></span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Klik tombol di samping saat pelanggan datang mengambil buket dan melunasi sisa tagihan.
                                </p>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            onClick={() => setShowPaymentForm(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0 py-2.5 px-4 shadow-md"
                        >
                            <Banknote className="h-4 w-4 mr-1.5" />
                            Catat Pelunasan ({formatRupiah(sale.sisa_tagihan)})
                        </Button>
                    </div>
                )}

                {/* Pre-Order Schedule & Stage Progress Card */}
                {sale.jenis_pesanan === 'preorder' && sale.status !== 'dibatalkan' && (
                    <Card className="border-border/70 shadow-sm overflow-hidden bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10">
                        <CardHeader className="py-3 px-4 border-b border-border/50 bg-background/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    Jadwal Jadi & Status Pengerjaan Buket
                                </CardTitle>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span>Jadwal Ambil / Kirim:</span>
                                    <strong className="text-foreground font-mono">
                                        {sale.tanggal_ambil || '-'} {sale.jam_ambil && `(${sale.jam_ambil})`}
                                    </strong>
                                    <Badge variant="outline" className="text-[10px]">
                                        {sale.tipe_pengiriman === 'delivery' ? 'Kirim Kurir' : 'Ambil Sendiri'}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-4">
                            <div className="text-xs text-muted-foreground mb-2">
                                Tahapan pengerjaan buket (klik tombol untuk memperbarui status pengerjaan):
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <button
                                    type="button"
                                    onClick={() => updateOrderStatus('antrean')}
                                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                        sale.status_pesanan === 'antrean'
                                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                            : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                    }`}
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                    1. Antrean PO
                                </button>

                                <button
                                    type="button"
                                    onClick={() => updateOrderStatus('proses')}
                                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                        sale.status_pesanan === 'proses'
                                            ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                                            : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                    }`}
                                >
                                    <Flower2 className="h-3.5 w-3.5" />
                                    2. Sedang Dirangkai
                                </button>

                                <button
                                    type="button"
                                    onClick={() => updateOrderStatus('siap')}
                                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                        sale.status_pesanan === 'siap'
                                            ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                                            : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                    }`}
                                >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    3. Siap Diambil / Kirim
                                </button>

                                <button
                                    type="button"
                                    onClick={() => updateOrderStatus('selesai')}
                                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                        sale.status_pesanan === 'selesai'
                                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                                            : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                    }`}
                                >
                                    <Check className="h-3.5 w-3.5" />
                                    4. Selesai (Sudah Diambil)
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Customer & Status Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-border/60 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500 flex-shrink-0">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Pelanggan</div>
                                <div className="text-sm font-bold text-foreground">
                                    {sale.pelanggan || 'Pelanggan Langsung (Walk-in)'}
                                </div>
                                {sale.telepon_pelanggan && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <Phone className="h-3 w-3" />
                                        {sale.telepon_pelanggan}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 flex-shrink-0">
                                <Receipt className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Status Pembayaran</div>
                                <div className="text-sm font-bold capitalize text-foreground">
                                    {sale.status_bayar === 'lunas' ? 'Lunas Penuh' : sale.status_bayar === 'dp' ? 'Uang Muka (DP)' : 'Belum Bayar'}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    Metode: <span className="capitalize">{sale.metode}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500 flex-shrink-0">
                                <Banknote className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Total Penjualan</div>
                                <div className="text-base font-extrabold font-mono text-rose-600">
                                    {formatRupiah(sale.total_harga)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    Sisa Tagihan: <span className={`font-bold ${sale.sisa_tagihan > 0 ? 'text-rose-600 font-mono' : 'text-foreground'}`}>{formatRupiah(sale.sisa_tagihan)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bouquet Lines & Breakdown */}
                <div className="space-y-4">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                        <Flower2 className="h-5 w-5 text-rose-500" />
                        Rincian Rangkaian & Pemakaian Bahan Baku
                    </h2>

                    {sale.lines.map((line) => (
                        <Card key={line.id} className="border-border/60 shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b border-border/50 py-3 px-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                                        <span>{line.nama_buket}</span>
                                        {line.template_id && (
                                            <Badge variant="outline" className="text-[10px]">
                                                Resep #{line.template_id}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-muted-foreground">
                                            HPP: <strong className="font-mono text-foreground">{formatRupiah(line.hpp_total)}</strong>
                                        </span>
                                        <span className="text-muted-foreground">
                                            Harga Jual: <strong className="font-mono text-base font-bold text-rose-600">{formatRupiah(line.harga_jual)}</strong>
                                        </span>
                                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            Margin {line.margin_persen}%
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left min-w-[500px]">
                                        <thead className="bg-muted/10 border-b uppercase text-muted-foreground">
                                            <tr>
                                                <th className="py-2 px-4">Bahan Baku yang Dipotong</th>
                                                <th className="py-2 px-4 text-center">Jumlah Keluar</th>
                                                <th className="py-2 px-4 text-right">Snapshot HPP Satuan</th>
                                                <th className="py-2 px-4 text-right">Subtotal HPP</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {line.components.map((comp) => (
                                                <tr key={comp.id}>
                                                    <td className="py-2 px-4 font-medium">{comp.item.nama}</td>
                                                    <td className="py-2 px-4 text-center font-mono">
                                                        {comp.qty} {comp.item.satuan}
                                                    </td>
                                                    <td className="py-2 px-4 text-right font-mono text-muted-foreground">
                                                        {formatRupiah(comp.hpp_snapshot)}
                                                    </td>
                                                    <td className="py-2 px-4 text-right font-mono font-semibold text-foreground">
                                                        {formatRupiah(comp.nilai_hpp)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {line.biaya_tambahan > 0 && (
                                                <tr className="bg-muted/10">
                                                    <td className="py-2 px-4 text-muted-foreground italic">
                                                        Ongkos Jasa Rangkai / Aksesoris
                                                    </td>
                                                    <td className="py-2 px-4 text-center font-mono text-muted-foreground">1 paket</td>
                                                    <td className="py-2 px-4 text-right font-mono text-muted-foreground">
                                                        {formatRupiah(line.biaya_tambahan)}
                                                    </td>
                                                    <td className="py-2 px-4 text-right font-mono font-semibold text-foreground">
                                                        {formatRupiah(line.biaya_tambahan)}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Rincian Biaya Jasa & Layanan Tambahan */}
                {sale.fees && sale.fees.length > 0 && (
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <CardHeader className="bg-amber-500/10 border-b border-border/50 py-3 px-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                Rincian Biaya Jasa & Layanan Tambahan (Multi-Jasa)
                            </CardTitle>
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono font-bold text-xs">
                                Total Biaya Jasa: {formatRupiah(sale.total_biaya_jasa || sale.fees.reduce((acc, f) => acc + f.nominal, 0))}
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left min-w-[500px]">
                                    <thead className="bg-muted/10 border-b uppercase text-muted-foreground">
                                        <tr>
                                            <th className="py-2.5 px-4">Nama Layanan / Jasa</th>
                                            <th className="py-2.5 px-4">Keterangan / Catatan</th>
                                            <th className="py-2.5 px-4 text-right">Tarif Biaya (Rp)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {sale.fees.map((fee) => (
                                            <tr key={fee.id} className="hover:bg-muted/10">
                                                <td className="py-2.5 px-4 font-semibold text-foreground flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                                    {fee.nama}
                                                </td>
                                                <td className="py-2.5 px-4 text-muted-foreground">
                                                    {fee.catatan || '-'}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                                                    {formatRupiah(fee.nominal)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Catatan Buket */}
                {sale.catatan && (
                    <Card className="border-border/60 shadow-sm bg-muted/20">
                        <CardHeader className="py-2 px-4 border-b border-border/40">
                            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                                <FileText className="h-3.5 w-3.5" />
                                Catatatan / Pesan Kartu Ucapan Buket:
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 text-xs text-foreground whitespace-pre-wrap">
                            {sale.catatan}
                        </CardContent>
                    </Card>
                )}

                {/* Payment History */}
                <Card className="border-border/60 shadow-sm">
                    <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Clock className="h-4 w-4 text-rose-500" />
                            Riwayat Pembayaran & Pelunasan
                        </CardTitle>

                        {sale.status !== 'dibatalkan' && sale.sisa_tagihan > 0 && (
                            <Button
                                size="sm"
                                onClick={() => setShowPaymentForm(true)}
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                + Catat Pelunasan
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left min-w-[450px]">
                                <thead className="bg-muted/20 border-b uppercase text-muted-foreground">
                                    <tr>
                                        <th className="py-2 px-4">Tanggal Bayar</th>
                                        <th className="py-2 px-4 text-right">Nominal Masuk</th>
                                        <th className="py-2 px-4 text-center">Metode</th>
                                        <th className="py-2 px-4">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {sale.payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-4 text-center text-muted-foreground">
                                                Belum ada pembayaran yang tercatat (piutang penuh).
                                            </td>
                                        </tr>
                                    ) : (
                                        sale.payments.map((p) => (
                                            <tr key={p.id}>
                                                <td className="py-2.5 px-4 font-mono">{p.tanggal}</td>
                                                <td className={`py-2.5 px-4 text-right font-mono font-bold ${p.nominal < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                                                    {p.nominal < 0 ? `- ${formatRupiah(Math.abs(p.nominal))}` : formatRupiah(p.nominal)}
                                                </td>
                                                <td className="py-2.5 px-4 text-center capitalize">{p.metode}</td>
                                                <td className="py-2.5 px-4 text-muted-foreground">{p.catatan || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Modal */}
                {showPaymentForm && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <Card className="max-w-md w-full border-border shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150">
                            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-emerald-600" />
                                    Catat Pembayaran / Pelunasan
                                </CardTitle>
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentForm(false)}
                                    className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </CardHeader>
                            <form onSubmit={submitPayment}>
                                <CardContent className="space-y-4 p-4">
                                    {/* Breakdown */}
                                    <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Total Nilai Pesanan:</span>
                                            <span className="font-mono">{formatRupiah(sale.total_harga)}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Sudah Masuk Sebelumnya:</span>
                                            <span className="font-mono text-emerald-600 font-semibold">{formatRupiah(sale.total_terbayar)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-foreground pt-1 border-t">
                                            <span>Sisa yang Harus Dilunasi:</span>
                                            <span className="font-mono text-rose-600">{formatRupiah(sale.sisa_tagihan)}</span>
                                        </div>
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="pay-date" className="text-xs">Tanggal Pembayaran</Label>
                                        <Input
                                            id="pay-date"
                                            type="date"
                                            value={paymentForm.data.tanggal}
                                            onChange={(e) => paymentForm.setData('tanggal', e.target.value)}
                                            className="h-9 text-xs"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="pay-nominal" className="text-xs font-semibold">Nominal Pelunasan (Rp)</Label>
                                        <Input
                                            id="pay-nominal"
                                            type="number"
                                            min="1"
                                            max={sale.sisa_tagihan}
                                            value={paymentForm.data.nominal}
                                            onChange={(e) => paymentForm.setData('nominal', parseInt(e.target.value) || 0)}
                                            className="h-9 text-sm font-bold font-mono"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="pay-method" className="text-xs">Metode Pembayaran</Label>
                                        <select
                                            id="pay-method"
                                            value={paymentForm.data.metode}
                                            onChange={(e) => paymentForm.setData('metode', e.target.value)}
                                            className="h-9 rounded-md border border-input bg-background px-3 text-xs shadow-sm focus-visible:ring-1 focus-visible:ring-emerald-500"
                                        >
                                            <option value="tunai">Tunai / Cash</option>
                                            <option value="transfer">Transfer Bank / QRIS</option>
                                            <option value="lainnya">Lainnya / EDC / Debit</option>
                                        </select>
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="pay-note" className="text-xs">Catatan Pembayaran</Label>
                                        <Input
                                            id="pay-note"
                                            value={paymentForm.data.catatan}
                                            onChange={(e) => paymentForm.setData('catatan', e.target.value)}
                                            placeholder="cth: Pelunasan saat buket diambil di toko"
                                            className="h-9 text-xs"
                                        />
                                    </div>

                                    <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={paymentForm.data.mark_as_completed}
                                            onChange={(e) => paymentForm.setData('mark_as_completed', e.target.checked)}
                                            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                        />
                                        <span className="text-xs text-foreground font-medium">
                                            Tandai pesanan langsung <strong>Selesai (Sudah Diserahkan ke Pelanggan)</strong>
                                        </span>
                                    </label>

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowPaymentForm(false)}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={paymentForm.processing || paymentForm.data.nominal <= 0}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                        >
                                            {paymentForm.processing ? 'Menyimpan...' : 'Simpan Pelunasan'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </form>
                        </Card>
                    </div>
                )}

                {/* Cancel / Abandonment Resolution Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <Card className="max-w-lg w-full border-border shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150">
                            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-bold text-destructive flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Batalkan Pesanan / Buket Tidak Diambil (#{sale.id})
                                </CardTitle>
                                <button
                                    type="button"
                                    onClick={() => setShowCancelModal(false)}
                                    className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </CardHeader>
                            <form onSubmit={submitCancel}>
                                <CardContent className="space-y-4 p-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="cancel-alasan" className="text-xs font-semibold">
                                            Alasan Pembatalan / Keterangan <span className="text-destructive">*</span>
                                        </Label>
                                        <textarea
                                            id="cancel-alasan"
                                            rows={2}
                                            value={cancelForm.data.alasan}
                                            onChange={(e) => cancelForm.setData('alasan', e.target.value)}
                                            placeholder="cth: Pelanggan membatalkan pesanan lewat WA, tidak datang mengambil buket..."
                                            className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus-visible:ring-1 focus-visible:ring-destructive"
                                            required
                                        />
                                    </div>

                                    {/* 1. PENANGANAN STOK / BUKET */}
                                    <div className="space-y-2 p-3 rounded-xl bg-muted/40 border border-border/60">
                                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            <Flower2 className="h-4 w-4 text-rose-500" />
                                            1. Perlakuan Fisik Buket & Bahan Baku:
                                        </Label>
                                        <div className="space-y-2 text-xs">
                                            <label className="flex items-start gap-2.5 p-2 rounded-lg border bg-background cursor-pointer hover:border-rose-300">
                                                <input
                                                    type="radio"
                                                    name="penanganan_stok"
                                                    value="ready_stock"
                                                    checked={cancelForm.data.penanganan_stok === 'ready_stock'}
                                                    onChange={() => cancelForm.setData('penanganan_stok', 'ready_stock')}
                                                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                                                />
                                                <div>
                                                    <div className="font-semibold text-foreground">
                                                        Jadikan Buket Pajangan (Ready Stock Toko) <span className="text-[10px] text-rose-600 font-normal">(Direkomendasikan)</span>
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                                        Buket sudah jadi dirangkai. Bunga tetap terpotong dan buket dipajang di showcase toko untuk dijual ke pembeli walk-in lain.
                                                    </div>
                                                </div>
                                            </label>

                                            <label className="flex items-start gap-2.5 p-2 rounded-lg border bg-background cursor-pointer hover:border-rose-300">
                                                <input
                                                    type="radio"
                                                    name="penanganan_stok"
                                                    value="restock"
                                                    checked={cancelForm.data.penanganan_stok === 'restock'}
                                                    onChange={() => cancelForm.setData('penanganan_stok', 'restock')}
                                                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                                                />
                                                <div>
                                                    <div className="font-semibold text-foreground">
                                                        Bongkar & Kembalikan Bahan ke Stok (Restock)
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                                        Rangkaian dibongkar. Bahan bunga/kertas yang masih utuh dimasukkan kembali ke inventaris master stok toko.
                                                    </div>
                                                </div>
                                            </label>

                                            <label className="flex items-start gap-2.5 p-2 rounded-lg border bg-background cursor-pointer hover:border-rose-300">
                                                <input
                                                    type="radio"
                                                    name="penanganan_stok"
                                                    value="waste"
                                                    checked={cancelForm.data.penanganan_stok === 'waste'}
                                                    onChange={() => cancelForm.setData('penanganan_stok', 'waste')}
                                                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                                                />
                                                <div>
                                                    <div className="font-semibold text-foreground">
                                                        Catat sebagai Kerugian / Bunga Rusak (Waste)
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                                        Bunga segar sudah terlanjur layu/busuk. Bahan tetap keluar dan otomatis dicatat sebagai kerugian Waste toko.
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* 2. PENANGANAN UANG DP */}
                                    {sale.total_terbayar > 0 ? (
                                        <div className="space-y-2 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800">
                                            <div className="flex justify-between items-center text-xs">
                                                <Label className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                                    <Banknote className="h-4 w-4 text-amber-600" />
                                                    2. Perlakuan Uang DP Masuk ({formatRupiah(sale.total_terbayar)}):
                                                </Label>
                                            </div>

                                            <div className="space-y-2 text-xs">
                                                <label className="flex items-start gap-2.5 p-2 rounded-lg border bg-background cursor-pointer hover:border-amber-400">
                                                    <input
                                                        type="radio"
                                                        name="penanganan_dp"
                                                        value="hangus"
                                                        checked={cancelForm.data.penanganan_dp === 'hangus'}
                                                        onChange={() => cancelForm.setData('penanganan_dp', 'hangus')}
                                                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                                                    />
                                                    <div>
                                                        <div className="font-semibold text-foreground">
                                                            DP Hangus / Ditahan Toko (Non-Refundable) <span className="text-[10px] text-amber-600 font-normal">(Direkomendasikan)</span>
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground mt-0.5">
                                                            Uang DP tetap di kas toko sebagai kompensasi biaya bahan & jasa pengerjaan buket yang sudah dibuat.
                                                        </div>
                                                    </div>
                                                </label>

                                                <label className="flex items-start gap-2.5 p-2 rounded-lg border bg-background cursor-pointer hover:border-amber-400">
                                                    <input
                                                        type="radio"
                                                        name="penanganan_dp"
                                                        value="refund"
                                                        checked={cancelForm.data.penanganan_dp === 'refund'}
                                                        onChange={() => cancelForm.setData('penanganan_dp', 'refund')}
                                                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-foreground">
                                                            DP Dikembalikan ke Pelanggan (Refund)
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground mt-0.5">
                                                            Toko mengembalikan dana DP (penuh atau sebagian) kepada pelanggan.
                                                        </div>

                                                        {cancelForm.data.penanganan_dp === 'refund' && (
                                                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                                                                <div className="grid gap-1">
                                                                    <Label className="text-[10px]">Nominal Refund (Rp):</Label>
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        max={sale.total_terbayar}
                                                                        value={cancelForm.data.nominal_refund}
                                                                        onChange={(e) => cancelForm.setData('nominal_refund', parseInt(e.target.value) || 0)}
                                                                        className="h-8 text-xs font-mono font-bold"
                                                                    />
                                                                </div>
                                                                <div className="grid gap-1">
                                                                    <Label className="text-[10px]">Metode Pengembalian:</Label>
                                                                    <select
                                                                        value={cancelForm.data.metode_refund}
                                                                        onChange={(e) => cancelForm.setData('metode_refund', e.target.value as any)}
                                                                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                                                    >
                                                                        <option value="tunai">Tunai / Cash</option>
                                                                        <option value="transfer">Transfer Bank</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-2.5 rounded-lg bg-muted/30 border text-xs text-muted-foreground">
                                            Pesanan ini belum memiliki pembayaran masuk (piutang penuh), sehingga tidak ada uang DP yang perlu diproses.
                                        </div>
                                    )}

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowCancelModal(false)}
                                        >
                                            Kembali
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            size="sm"
                                            disabled={cancelForm.processing || !cancelForm.data.alasan}
                                            className="font-bold"
                                        >
                                            {cancelForm.processing ? 'Memproses...' : 'Konfirmasi Pembatalan'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </form>
                        </Card>
                    </div>
                )}
            </div>

            {/* Thermal Struk / Nota Printable View (Hanya Muncul saat Cetak / Print) */}
            <div className="hidden print:block print:w-[76mm] print:mx-auto print:text-black font-mono text-[11px] leading-tight space-y-2 pt-2">
                <div className="text-center space-y-0.5 border-b border-black pb-2">
                    <div className="font-bold text-sm uppercase tracking-wider">KIYOMI FLORIST & STOCK</div>
                    <div className="text-[10px]">Fresh Flowers & Money Bouquet</div>
                    <div className="text-[10px]">Telp: 0812-3456-7890</div>
                </div>

                <div className="space-y-0.5 text-[10px] border-b border-dashed border-black pb-2">
                    <div className="flex justify-between">
                        <span>No. Nota:</span>
                        <span className="font-bold">#{sale.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tanggal:</span>
                        <span>{sale.tanggal}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Pelanggan:</span>
                        <span>{sale.pelanggan || 'Walk-in'}</span>
                    </div>
                    {sale.jenis_pesanan === 'preorder' && (
                        <div className="flex justify-between font-bold">
                            <span>Jadwal Ambil:</span>
                            <span>{sale.tanggal_ambil} {sale.jam_ambil || ''}</span>
                        </div>
                    )}
                </div>

                {/* Rangkaian Buket */}
                <div className="border-b border-dashed border-black pb-2 space-y-1">
                    <div className="font-bold text-[10px] uppercase">Rangkaian Buket:</div>
                    {sale.lines.map((l, idx) => (
                        <div key={idx} className="flex justify-between">
                            <span>{l.nama_buket}</span>
                            <span className="font-bold">{formatRupiah(l.harga_jual)}</span>
                        </div>
                    ))}
                </div>

                {/* Biaya Jasa & Layanan */}
                {sale.fees && sale.fees.length > 0 && (
                    <div className="border-b border-dashed border-black pb-2 space-y-1">
                        <div className="font-bold text-[10px] uppercase">Biaya Jasa & Layanan:</div>
                        {sale.fees.map((fee, idx) => (
                            <div key={idx} className="flex justify-between">
                                <span>• {fee.nama}</span>
                                <span>{formatRupiah(fee.nominal)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Grand Total & Payment */}
                <div className="space-y-0.5 text-[10px] border-b border-black pb-2">
                    <div className="flex justify-between font-bold text-xs pt-1">
                        <span>TOTAL:</span>
                        <span>{formatRupiah(sale.total_harga)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Total Bayar:</span>
                        <span>{formatRupiah(sale.total_terbayar)} ({sale.status_bayar.toUpperCase()})</span>
                    </div>
                    {sale.sisa_tagihan > 0 && (
                        <div className="flex justify-between font-bold text-black">
                            <span>SISA TAGIHAN:</span>
                            <span>{formatRupiah(sale.sisa_tagihan)}</span>
                        </div>
                    )}
                </div>

                <div className="text-center text-[10px] pt-2 space-y-0.5">
                    <div>Terima kasih atas pesanan Anda!</div>
                    <div>Follow IG: @kiyomi.florist</div>
                </div>
            </div>
        </>
    );
}

SalesShow.layout = {
    breadcrumbs,
};
