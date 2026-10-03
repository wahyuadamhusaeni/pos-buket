import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock,
    Edit3,
    ExternalLink,
    Phone,
    PlusCircle,
    Store,
    Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

interface PurchaseItem {
    id: number;
    tanggal: string;
    no_pesanan?: string | null;
    status: string;
    ongkir: number;
}

interface SupplierDetail {
    id: number;
    nama: string;
    platform: string;
    link?: string | null;
    kontak?: string | null;
    catatan?: string | null;
    purchases: PurchaseItem[];
}

interface SuppliersShowProps {
    supplier: SupplierDetail;
}

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export default function SuppliersShow({ supplier }: SuppliersShowProps) {
    return (
        <>
            <Head title={`Supplier: ${supplier.nama} - KIYOMI STOCK`} />

            <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Link href="/suppliers">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {supplier.nama}
                                </h1>
                                <Badge className="capitalize">{supplier.platform}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Kontak: {supplier.kontak || '-'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/suppliers/${supplier.id}/edit`}>
                                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                Edit Data
                            </Link>
                        </Button>
                        <Button asChild size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">
                            <Link href="/purchases/create">
                                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                                Input Pembelian
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Info Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground">
                                Informasi Kontak & Link
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{supplier.kontak || 'Tidak ada nomor telepon'}</span>
                            </div>
                            {supplier.link && (
                                <div className="flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4 text-rose-500" />
                                    <a
                                        href={supplier.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-rose-600 hover:underline break-all text-xs"
                                    >
                                        {supplier.link}
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground">
                                Total Transaksi Pembelian
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-foreground">
                                {supplier.purchases.length} <span className="text-sm font-normal text-muted-foreground">faktur</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {supplier.catatan && (
                    <Card className="border-border/60 bg-muted/20">
                        <CardContent className="p-4">
                            <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Catatan Supplier:</div>
                            <p className="text-xs text-foreground">{supplier.catatan}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Purchase History */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50 py-3 px-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Clock className="h-4 w-4 text-rose-500" />
                            Riwayat Faktur Pembelian Terbaru
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/20 border-b uppercase text-muted-foreground font-semibold">
                                <tr>
                                    <th className="py-2.5 px-4">No. Faktur</th>
                                    <th className="py-2.5 px-4">Tanggal</th>
                                    <th className="py-2.5 px-4">No. Pesanan Supplier</th>
                                    <th className="py-2.5 px-4 text-center">Status</th>
                                    <th className="py-2.5 px-4 text-right">Ongkir</th>
                                    <th className="py-2.5 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {supplier.purchases.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                            Belum ada riwayat pembelian dari supplier ini.
                                        </td>
                                    </tr>
                                ) : (
                                    supplier.purchases.map((p) => (
                                        <tr key={p.id} className="hover:bg-muted/20">
                                            <td className="py-2.5 px-4 font-bold font-mono">PO-{p.id}</td>
                                            <td className="py-2.5 px-4">{p.tanggal}</td>
                                            <td className="py-2.5 px-4">{p.no_pesanan || '-'}</td>
                                            <td className="py-2.5 px-4 text-center capitalize">
                                                <Badge variant="outline" className="text-xs">{p.status}</Badge>
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono">
                                                {p.ongkir > 0 ? formatRupiah(p.ongkir) : '-'}
                                            </td>
                                            <td className="py-2.5 px-4 text-right">
                                                <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-rose-600">
                                                    <Link href={`/purchases/${p.id}`}>Detail</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SuppliersShow.layout = {
    breadcrumbs: [
        {
            title: 'Supplier & Pemasok',
            href: '/suppliers',
        },
        {
            title: 'Detail Supplier',
            href: '#',
        },
    ],
};
