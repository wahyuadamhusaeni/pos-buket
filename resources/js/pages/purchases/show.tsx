import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    FileText,
    PackageCheck,
    Printer,
    Truck,
    XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

interface PurchaseItemRow {
    id: number;
    item: {
        id: number;
        nama: string;
        satuan: string;
    };
    qty: number;
    harga_satuan: number;
    nilai: number;
    alokasi_biaya: number;
    harga_efektif: number;
}

interface PurchaseDetail {
    id: number;
    tanggal: string;
    supplier?: {
        id: number;
        nama: string;
        platform?: string | null;
    } | null;
    no_pesanan?: string | null;
    ongkir: number;
    diskon: number;
    biaya_lain: number;
    total_biaya_tambahan: number;
    status: 'draft' | 'diterima' | 'dibatalkan';
    catatan?: string | null;
    diterima_at?: string | null;
    items: PurchaseItemRow[];
}

interface PurchasesShowProps {
    purchase: PurchaseDetail;
}

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export default function PurchasesShow({ purchase }: PurchasesShowProps) {
    const [showCancelModal, setShowCancelModal] = useState(false);
    const cancelForm = useForm({
        alasan: '',
    });

    const handleApprove = () => {
        if (confirm('Konfirmasi penerimaan barang? Stok fisik bahan akan bertambah dan HPP Rata-Rata (Moving Average) akan otomatis dihitung ulang.')) {
            router.post(`/purchases/${purchase.id}/approve`);
        }
    };

    const submitCancel = (e: React.FormEvent) => {
        e.preventDefault();
        cancelForm.post(`/purchases/${purchase.id}/cancel`, {
            onSuccess: () => setShowCancelModal(false),
        });
    };

    const totalNilaiBarang = purchase.items.reduce((s, it) => s + Number(it.nilai || 0), 0);
    const grandTotal = Math.max(0, totalNilaiBarang + Number(purchase.total_biaya_tambahan || 0));

    return (
        <>
            <Head title={`Faktur Pembelian PO-${purchase.id} - KIYOMI STOCK`} />

            <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Link href="/purchases">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Faktur Pembelian PO-{purchase.id}
                                </h1>
                                {purchase.status === 'diterima' && (
                                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                                        Sudah Diterima (Stok Masuk)
                                    </Badge>
                                )}
                                {purchase.status === 'draft' && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                                        Draft (Menunggu Penerimaan)
                                    </Badge>
                                )}
                                {purchase.status === 'dibatalkan' && (
                                    <Badge variant="destructive">
                                        Dibatalkan
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Tanggal: {purchase.tanggal} • Supplier: <strong className="text-foreground">{purchase.supplier?.nama || 'Umum'}</strong>
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
                            Cetak Faktur
                        </Button>

                        {purchase.status === 'draft' && (
                            <Button
                                size="sm"
                                onClick={handleApprove}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                            >
                                <PackageCheck className="h-3.5 w-3.5 mr-1.5" />
                                Terima Barang & Masukkan ke Stok
                            </Button>
                        )}

                        {purchase.status !== 'dibatalkan' && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowCancelModal(true)}
                                className="text-xs"
                            >
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Batalkan Faktur
                            </Button>
                        )}
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-border/60 shadow-sm">
                        <CardContent className="p-4">
                            <div className="text-xs text-muted-foreground">Supplier & No. Pesanan</div>
                            <div className="text-sm font-bold text-foreground mt-0.5">
                                {purchase.supplier?.nama || 'Umum'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                                No. Faktur: {purchase.no_pesanan || '-'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardContent className="p-4">
                            <div className="text-xs text-muted-foreground">Biaya Ekspedisi / Cargo Bersih</div>
                            <div className="text-sm font-bold font-mono text-foreground mt-0.5">
                                {formatRupiah(purchase.total_biaya_tambahan)}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                Ongkir: {formatRupiah(purchase.ongkir)} • Diskon: {formatRupiah(purchase.diskon)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardContent className="p-4">
                            <div className="text-xs text-muted-foreground">Total Tagihan Pembelian</div>
                            <div className="text-base font-extrabold font-mono text-rose-600 mt-0.5">
                                {formatRupiah(grandTotal)}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                Status: <span className="capitalize font-semibold">{purchase.status}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Items Breakdown with Moving Average HPP Impact */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50 py-3 px-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Truck className="h-4 w-4 text-rose-500" />
                                Rincian Bahan Masuk & Alokasi HPP
                            </CardTitle>
                            <span className="text-xs text-muted-foreground">
                                {purchase.items.length} item bahan
                            </span>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left min-w-[650px]">
                                <thead className="bg-muted/20 border-b uppercase text-muted-foreground font-semibold">
                                    <tr>
                                        <th className="py-2.5 px-4">Bahan Baku</th>
                                        <th className="py-2.5 px-4 text-center">Jumlah Masuk</th>
                                        <th className="py-2.5 px-4 text-right">Harga Beli Satuan</th>
                                        <th className="py-2.5 px-4 text-right">Alokasi Ongkir Unit</th>
                                        <th className="py-2.5 px-4 text-right">HPP Efektif Unit</th>
                                        <th className="py-2.5 px-4 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {purchase.items.map((pi) => {
                                        const unitOngkir = pi.qty > 0 ? Math.round(pi.alokasi_biaya / pi.qty) : 0;
                                        return (
                                            <tr key={pi.id} className="hover:bg-muted/20">
                                                <td className="py-2.5 px-4 font-medium text-foreground">
                                                    <Link href={`/items/${pi.item?.id}`} className="hover:text-rose-500 hover:underline">
                                                        {pi.item?.nama}
                                                    </Link>
                                                </td>
                                                <td className="py-2.5 px-4 text-center font-bold">
                                                    {pi.qty} {pi.item?.satuan}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                                                    {formatRupiah(pi.harga_satuan)}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono text-xs text-amber-600 dark:text-amber-400">
                                                    +{formatRupiah(unitOngkir)}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                                                    {formatRupiah(pi.harga_efektif)}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono font-semibold text-foreground">
                                                    {formatRupiah(pi.nilai + pi.alokasi_biaya)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Catatan if available */}
                {purchase.catatan && (
                    <Card className="border-border/60 bg-muted/20">
                        <CardContent className="p-4">
                            <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Catatan Tambahan:</div>
                            <p className="text-xs text-foreground">{purchase.catatan}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Cancel Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <Card className="max-w-md w-full border-border shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-base font-bold text-destructive flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Batalkan Faktur Pembelian PO-{purchase.id}?
                                </CardTitle>
                            </CardHeader>
                            <form onSubmit={submitCancel}>
                                <CardContent className="space-y-4">
                                    <p className="text-xs text-muted-foreground">
                                        Jika faktur ini sudah diterima sebelumnya, pembatalan akan menarik kembali kuantitas stok yang telah ditambahkan.
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
                                            placeholder="Contoh: Barang retur karena rusak, salah input supplier..."
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
                                            {cancelForm.processing ? 'Membatalkan...' : 'Ya, Batalkan Pembelian'}
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

PurchasesShow.layout = {
    breadcrumbs: [
        {
            title: 'Pembelian & Kulakan',
            href: '/purchases',
        },
        {
            title: 'Faktur Pembelian',
            href: '#',
        },
    ],
};
