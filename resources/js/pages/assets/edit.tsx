import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Edit3, Save } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface AssetsEditProps {
    asset: AssetDetail;
}

export default function AssetsEdit({ asset }: AssetsEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        nama: asset.nama,
        jumlah: asset.jumlah,
        kondisi: asset.kondisi,
        tanggal_beli: asset.tanggal_beli || '',
        harga_beli: asset.harga_beli || 0,
        lokasi: asset.lokasi || '',
        catatan: asset.catatan || '',
        aktif: asset.aktif,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/assets/${asset.id}`);
    };

    return (
        <>
            <Head title={`Edit Aset: ${asset.nama} - KIYOMI STOCK`} />

            <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Link href={`/assets/${asset.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Edit3 className="h-6 w-6 text-rose-500" />
                            Edit Data Aset & Kondisi
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Perbarui jumlah unit fisik, lokasi simpan, atau status kerusakan
                        </p>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Formulir Perubahan Data</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nama">Nama Alat / Aset <span className="text-rose-500">*</span></Label>
                                <Input
                                    id="nama"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    className="focus-visible:ring-rose-500"
                                    required
                                />
                                <InputError message={errors.nama} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="jumlah">Jumlah Unit <span className="text-rose-500">*</span></Label>
                                    <Input
                                        id="jumlah"
                                        type="number"
                                        min="0"
                                        value={data.jumlah}
                                        onChange={(e) => setData('jumlah', parseInt(e.target.value) || 0)}
                                        className="focus-visible:ring-rose-500"
                                        required
                                    />
                                    <InputError message={errors.jumlah} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="kondisi">Kondisi Fisik <span className="text-rose-500">*</span></Label>
                                    <select
                                        id="kondisi"
                                        value={data.kondisi}
                                        onChange={(e) => setData('kondisi', e.target.value as any)}
                                        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:ring-1 focus-visible:ring-rose-500"
                                    >
                                        <option value="baik">Kondisi Baik (Siap Pakai)</option>
                                        <option value="rusak">Rusak / Perlu Servis</option>
                                        <option value="hilang">Hilang</option>
                                    </select>
                                    <InputError message={errors.kondisi} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="tanggal_beli">Tanggal Pembelian</Label>
                                    <Input
                                        id="tanggal_beli"
                                        type="date"
                                        value={data.tanggal_beli}
                                        onChange={(e) => setData('tanggal_beli', e.target.value)}
                                        className="focus-visible:ring-rose-500"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="harga_beli">Harga Pembelian (Rp)</Label>
                                    <Input
                                        id="harga_beli"
                                        type="number"
                                        min="0"
                                        value={data.harga_beli}
                                        onChange={(e) => setData('harga_beli', parseInt(e.target.value) || 0)}
                                        className="focus-visible:ring-rose-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="lokasi">Lokasi Penyimpanan di Toko</Label>
                                <Input
                                    id="lokasi"
                                    value={data.lokasi}
                                    onChange={(e) => setData('lokasi', e.target.value)}
                                    className="focus-visible:ring-rose-500"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="catatan">Catatan / Keterangan</Label>
                                <textarea
                                    id="catatan"
                                    rows={2}
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    className="w-full rounded-md border border-input bg-transparent p-2.5 text-xs focus-visible:ring-1 focus-visible:ring-rose-500"
                                />
                            </div>

                            <div className="pt-4 border-t flex justify-end gap-3">
                                <Button asChild variant="outline">
                                    <Link href={`/assets/${asset.id}`}>Batal</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold shadow-md shadow-rose-500/20"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {processing ? 'Menyimpan...' : 'Perbarui Aset'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </>
    );
}

AssetsEdit.layout = {
    breadcrumbs: [
        {
            title: 'Aset & Alat Kerja',
            href: '/assets',
        },
        {
            title: 'Edit Aset',
            href: '#',
        },
    ],
};
