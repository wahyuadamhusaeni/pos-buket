import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Banknote,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Flower2,
    Layers,
    Phone,
    Printer,
    Receipt,
    User,
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

interface SaleDetail {
    id: number;
    tanggal: string;
    pelanggan?: string | null;
    telepon_pelanggan?: string | null;
    catatan?: string | null;
    total_harga: number;
    total_hpp: number;
    laba_kotor: number;
    status_bayar: 'lunas' | 'dp' | 'belum';
    metode: string;
    nominal_dp: number;
    status: 'selesai' | 'dibatalkan';
    total_terbayar: number;
    sisa_tagihan: number;
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
        catatan: 'Pelunasan sisa tagihan',
    });

    // Cancel / Void Form
    const [showCancelModal, setShowCancelModal] = useState(false);
    const cancelForm = useForm({
        alasan: '',
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

    return (
        <>
            <Head title={`Nota Penjualan #${sale.id} - KIYOMI STOCK`} />

            <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
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
                                    <Badge variant="destructive">Dibatalkan (Void)</Badge>
                                ) : (
                                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                                        Transaksi Selesai
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Dibuat pada: {sale.tanggal} • Kasir Toko
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
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                            >
                                <Banknote className="h-3.5 w-3.5 mr-1.5" />
                                Catat Pelunasan
                            </Button>
                        )}

                        {sale.status !== 'dibatalkan' && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowCancelModal(true)}
                                className="text-xs"
                            >
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Batalkan Transaksi
                            </Button>
                        )}
                    </div>
                </div>

                {/* Cancel Warning if Void */}
                {sale.status === 'dibatalkan' && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <div>
                            <span className="font-bold">Transaksi ini telah dibatalkan.</span> Semua stok bahan yang keluar telah otomatis dikembalikan ke inventaris toko.
                        </div>
                    </div>
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
                                    Sisa Tagihan: <span className="font-bold text-foreground">{formatRupiah(sale.sisa_tagihan)}</span>
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
                                        <Badge variant="outline" className="text-xs font-mono font-semibold">
                                            {formatRupiah(line.harga_jual)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span>Total HPP: <strong className="font-mono text-foreground">{formatRupiah(line.hpp_total)}</strong></span>
                                        <span>Laba: <strong className="font-mono text-emerald-600">{formatRupiah(line.laba_kotor)} ({line.margin_persen}%)</strong></span>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left min-w-[500px]">
                                        <thead className="bg-muted/20 border-b uppercase text-muted-foreground">
                                            <tr>
                                                <th className="py-2 px-4">Komponen Bahan Baku</th>
                                                <th className="py-2 px-4 text-center">Jumlah Dipakai</th>
                                                <th className="py-2 px-4 text-right">Snapshot HPP Satuan</th>
                                                <th className="py-2 px-4 text-right">Nilai HPP</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {line.components.map((comp) => (
                                                <tr key={comp.id}>
                                                    <td className="py-2 px-4 font-medium text-foreground">
                                                        {comp.item?.nama || 'Item'}
                                                    </td>
                                                    <td className="py-2 px-4 text-center">
                                                        {comp.qty} {comp.item?.satuan}
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
                                                    <td className="py-2 px-4 font-medium text-muted-foreground italic">
                                                        Biaya Jasa Rangkai / Crafting Fee
                                                    </td>
                                                    <td className="py-2 px-4 text-center">-</td>
                                                    <td className="py-2 px-4 text-right font-mono text-muted-foreground">-</td>
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

                {/* Payment History */}
                <Card className="border-border/60 shadow-sm">
                    <CardHeader className="py-3 px-4 border-b border-border/50">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Clock className="h-4 w-4 text-rose-500" />
                            Riwayat Pembayaran & Pelunasan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left min-w-[450px]">
                                <thead className="bg-muted/20 border-b uppercase text-muted-foreground">
                                    <tr>
                                        <th className="py-2 px-4">Tanggal</th>
                                        <th className="py-2 px-4 text-right">Nominal</th>
                                        <th className="py-2 px-4 text-center">Metode</th>
                                        <th className="py-2 px-4">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {sale.payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-4 text-center text-muted-foreground">
                                                Belum ada pembayaran yang tercatat.
                                            </td>
                                        </tr>
                                    ) : (
                                        sale.payments.map((p) => (
                                            <tr key={p.id}>
                                                <td className="py-2.5 px-4 font-mono">{p.tanggal}</td>
                                                <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600">
                                                    {formatRupiah(p.nominal)}
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
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <Card className="max-w-md w-full border-border shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-base font-bold">Catat Pembayaran / Pelunasan</CardTitle>
                            </CardHeader>
                            <form onSubmit={submitPayment}>
                                <CardContent className="space-y-4">
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
                                        <Label htmlFor="pay-nominal" className="text-xs">Nominal Bayar (Rp)</Label>
                                        <Input
                                            id="pay-nominal"
                                            type="number"
                                            min="1"
                                            max={sale.sisa_tagihan}
                                            value={paymentForm.data.nominal}
                                            onChange={(e) => paymentForm.setData('nominal', parseInt(e.target.value) || 0)}
                                            className="h-9 text-sm font-bold"
                                            required
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Sisa yang harus dibayar: {formatRupiah(sale.sisa_tagihan)}
                                        </p>
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="pay-method" className="text-xs">Metode Pembayaran</Label>
                                        <select
                                            id="pay-method"
                                            value={paymentForm.data.metode}
                                            onChange={(e) => paymentForm.setData('metode', e.target.value)}
                                            className="h-9 rounded-md border border-input bg-background px-3 text-xs"
                                        >
                                            <option value="tunai">Tunai / Cash</option>
                                            <option value="transfer">Transfer Bank / QRIS</option>
                                            <option value="lainnya">Lainnya / EDC</option>
                                        </select>
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="pay-note" className="text-xs">Catatan Pembayaran</Label>
                                        <Input
                                            id="pay-note"
                                            value={paymentForm.data.catatan}
                                            onChange={(e) => paymentForm.setData('catatan', e.target.value)}
                                            placeholder="cth: Pelunasan transfer BCA"
                                            className="h-9 text-xs"
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2">
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
                                            disabled={paymentForm.processing}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            {paymentForm.processing ? 'Menyimpan...' : 'Simpan Pembayaran'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </form>
                        </Card>
                    </div>
                )}

                {/* Cancel Void Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <Card className="max-w-md w-full border-border shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-base font-bold text-destructive flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Batalkan Transaksi #{sale.id}?
                                </CardTitle>
                            </CardHeader>
                            <form onSubmit={submitCancel}>
                                <CardContent className="space-y-4">
                                    <p className="text-xs text-muted-foreground">
                                        Pembatalan akan mengembalikan seluruh bunga dan bahan ke stok fisik secara otomatis. Tindakan ini tidak dapat diurungkan.
                                    </p>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="cancel-alasan" className="text-xs font-semibold">
                                            Alasan Pembatalan <span className="text-destructive">*</span>
                                        </Label>
                                        <textarea
                                            id="cancel-alasan"
                                            rows={3}
                                            value={cancelForm.data.alasan}
                                            onChange={(e) => cancelForm.setData('alasan', e.target.value)}
                                            placeholder="Contoh: Pelanggan membatalkan pesanan, salah input jumlah..."
                                            className="w-full rounded-md border border-input bg-background p-2 text-xs"
                                            required
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowCancelModal(false)}
                                        >
                                            Tutup
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            size="sm"
                                            disabled={cancelForm.processing}
                                        >
                                            {cancelForm.processing ? 'Membatalkan...' : 'Ya, Batalkan Transaksi'}
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

SalesShow.layout = {
    breadcrumbs,
};
