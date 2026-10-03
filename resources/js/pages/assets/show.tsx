import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    Edit3,
    MapPin,
    Wrench,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

interface AssetDetail {
    id: number;
    nama: string;
    jumlah: number;
    kondisi: 'baik' | 'rusak' | 'hilang';
    tanggal_beli?: string | null;
    harga_beli?: number | null;
    lokasi?: string | null;
    catatan?: string | null;
    aktif: boolean;
}

interface AssetsShowProps {
    asset: AssetDetail;
}

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export default function AssetsShow({ asset }: AssetsShowProps) {
    return (
        <>
            <Head title={`Aset: ${asset.nama} - KIYOMI STOCK`} />

            <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Link href="/assets">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {asset.nama}
                                </h1>
                                <Badge className="capitalize">Kondisi {asset.kondisi}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Lokasi: {asset.lokasi || 'Toko Utama'} • {asset.jumlah} unit
                            </p>
                        </div>
                    </div>

                    <Button asChild size="sm" variant="outline">
                        <Link href={`/assets/${asset.id}/edit`}>
                            <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                            Edit Data Aset
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground">
                                Jumlah Unit Fisik
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-foreground">
                                {asset.jumlah} <span className="text-sm font-normal text-muted-foreground">unit</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground">
                                Nilai Pembelian Awal
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold font-mono text-rose-600">
                                {asset.harga_beli ? formatRupiah(asset.harga_beli) : '-'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-medium text-muted-foreground">
                                Tanggal Beli
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-foreground">
                                {asset.tanggal_beli || 'Tidak dicatat'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {asset.catatan && (
                    <Card className="border-border/60 bg-muted/20">
                        <CardContent className="p-4">
                            <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Catatan Tambahan:</div>
                            <p className="text-xs text-foreground">{asset.catatan}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

AssetsShow.layout = {
    breadcrumbs: [
        {
            title: 'Aset & Alat Kerja',
            href: '/assets',
        },
        {
            title: 'Detail Aset',
            href: '#',
        },
    ],
};
