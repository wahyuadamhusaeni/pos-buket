import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit3, Flower2, Layers, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

interface TemplateItemRow {
    id: number;
    item_id: number;
    qty: number;
    item: {
        id: number;
        nama: string;
        satuan: string;
        hpp_rata_rata: number;
    };
}

interface TemplateDetail {
    id: number;
    nama: string;
    harga_default: number;
    foto_url?: string | null;
    catatan?: string | null;
    hpp_total: number;
    template_items: TemplateItemRow[];
}

interface TemplatesShowProps {
    template: TemplateDetail;
}

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export default function TemplatesShow({ template }: TemplatesShowProps) {
    const profit = template.harga_default - template.hpp_total;
    const margin = template.harga_default > 0 ? (profit / template.harga_default) * 100 : 0;

    return (
        <>
            <Head title={`Resep: ${template.nama} - KIYOMI STOCK`} />

            <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Link href="/templates">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Flower2 className="h-6 w-6 text-rose-500" />
                                {template.nama}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Formula resep buket standar untuk transaksi kasir
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/templates/${template.id}/edit`}>
                                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                Edit Resep
                            </Link>
                        </Button>
                        <Button asChild size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">
                            <Link href="/sales/create">
                                <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                                Rangkai di Kasir
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground">
                                Total Modal HPP Bahan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold font-mono text-foreground">
                                {formatRupiah(template.hpp_total)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground">
                                Harga Jual Standar
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold font-mono text-rose-600">
                                {formatRupiah(template.harga_default)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground">
                                Estimasi Margin Laba
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold font-mono text-emerald-600">
                                {margin.toFixed(1)}%
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Profit: {formatRupiah(profit)} per buket
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Components Table */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50 py-3 px-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Layers className="h-4 w-4 text-rose-500" />
                            Daftar Komposisi Bunga & Perlengkapan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/20 border-b uppercase text-muted-foreground font-semibold">
                                <tr>
                                    <th className="py-2.5 px-4">Nama Bahan</th>
                                    <th className="py-2.5 px-4 text-center">Jumlah Pemakaian</th>
                                    <th className="py-2.5 px-4 text-right">HPP Satuan</th>
                                    <th className="py-2.5 px-4 text-right">Subtotal Modal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {template.template_items.map((ti) => {
                                    const sub = Math.round(ti.qty * (ti.item?.hpp_rata_rata || 0));
                                    return (
                                        <tr key={ti.id} className="hover:bg-muted/20">
                                            <td className="py-2.5 px-4 font-medium text-foreground">
                                                <Link href={`/items/${ti.item?.id}`} className="hover:text-rose-500 hover:underline">
                                                    {ti.item?.nama}
                                                </Link>
                                            </td>
                                            <td className="py-2.5 px-4 text-center font-bold">
                                                {ti.qty} {ti.item?.satuan}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                                                {formatRupiah(ti.item?.hpp_rata_rata || 0)}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono font-semibold text-foreground">
                                                {formatRupiah(sub)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Catatan if exists */}
                {template.catatan && (
                    <Card className="border-border/60 bg-muted/20">
                        <CardContent className="p-4">
                            <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Instruksi Merangkai:</div>
                            <p className="text-xs text-foreground">{template.catatan}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

TemplatesShow.layout = {
    breadcrumbs: [
        {
            title: 'Resep Buket & Rangkaian',
            href: '/templates',
        },
        {
            title: 'Detail Resep',
            href: '#',
        },
    ],
};
