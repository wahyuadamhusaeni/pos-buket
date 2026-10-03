import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Edit3, Save } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

interface EditItemProps {
    item: {
        id: number;
        nama: string;
        tipe: 'bunga_hidup' | 'bunga_artifisial' | 'pelengkap' | 'aset';
        kategori?: string | null;
        satuan: string;
        stok_min: number;
        foto_url?: string | null;
        catatan?: string | null;
        aktif: boolean;
    };
}

export default function ItemsEdit({ item }: EditItemProps) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'put',
        nama: item.nama,
        tipe: item.tipe,
        kategori: item.kategori || '',
        satuan: item.satuan,
        stok_min: String(item.stok_min ?? 5),
        foto: null as File | null,
        hapus_foto: false,
        catatan: item.catatan || '',
        aktif: item.aktif,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/items/${item.id}`, { forceFormData: true });
    };

    return (
        <>
            <Head title={`Edit ${item.nama} - KIYOMI STOCK`} />

            <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Link href={`/items/${item.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Edit3 className="h-6 w-6 text-rose-500" />
                            Edit Data Bahan
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Perbarui nama, tipe, kategori, satuan, atau batas stok minimum
                        </p>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Formulir Perubahan Data</CardTitle>
                            <CardDescription>
                                Perubahan stok fisik dan HPP hanya dapat dilakukan melalui mutasi stok resmi untuk menjaga akurasi Moving Average.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            <div className="grid gap-2">
                                <Label htmlFor="nama">
                                    Nama Bahan / Bunga <span className="text-rose-500">*</span>
                                </Label>
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
                                    <Label htmlFor="tipe">
                                        Tipe Bahan <span className="text-rose-500">*</span>
                                    </Label>
                                    <select
                                        id="tipe"
                                        value={data.tipe}
                                        onChange={(e) => setData('tipe', e.target.value as any)}
                                        className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                                    >
                                        <option value="bunga_hidup">Bunga Hidup (Fresh)</option>
                                        <option value="bunga_artifisial">Bunga Artifisial / Kering</option>
                                        <option value="pelengkap">Pelengkap (Kertas, Pita, Vas, dll)</option>
                                        <option value="aset">Aset Toko</option>
                                    </select>
                                    <InputError message={errors.tipe} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="kategori">Kategori</Label>
                                    <Input
                                        id="kategori"
                                        value={data.kategori}
                                        onChange={(e) => setData('kategori', e.target.value)}
                                        placeholder="Contoh: Mawar, Wrapping"
                                        className="focus-visible:ring-rose-500"
                                    />
                                    <InputError message={errors.kategori} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="satuan">
                                        Satuan Ukur <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="satuan"
                                        value={data.satuan}
                                        onChange={(e) => setData('satuan', e.target.value)}
                                        className="focus-visible:ring-rose-500"
                                        required
                                    />
                                    <InputError message={errors.satuan} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="stok_min">Batas Stok Minimum</Label>
                                    <Input
                                        id="stok_min"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.stok_min}
                                        onChange={(e) => setData('stok_min', e.target.value)}
                                        className="focus-visible:ring-rose-500"
                                    />
                                    <InputError message={errors.stok_min} />
                                </div>
                            </div>

                            {/* Foto Bahan Upload */}
                            <ImageUpload
                                id="foto"
                                currentImageUrl={data.hapus_foto ? null : item.foto_url}
                                value={data.foto}
                                onChange={(file) => {
                                    setData((prev) => ({
                                        ...prev,
                                        foto: file,
                                        hapus_foto: false,
                                    }));
                                }}
                                onRemoveExisting={() => {
                                    setData((prev) => ({
                                        ...prev,
                                        foto: null,
                                        hapus_foto: true,
                                    }));
                                }}
                                label="Foto Bahan Baku / Bunga"
                                description="Pilih atau seret gambar baru dari HP atau komputer untuk mengganti foto (JPG, PNG, WEBP maks 5MB)"
                                error={(errors as any).foto}
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="catatan">Catatan / Deskripsi</Label>
                                <textarea
                                    id="catatan"
                                    rows={3}
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                                />
                                <InputError message={errors.catatan} />
                            </div>

                            <div className="pt-4 border-t flex items-center justify-end gap-3">
                                <Button asChild variant="outline">
                                    <Link href={`/items/${item.id}`}>Batal</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {processing ? 'Menyimpan...' : 'Perbarui Bahan'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </>
    );
}

ItemsEdit.layout = {
    breadcrumbs: [
        {
            title: 'Master Bahan & Stok',
            href: '/items',
        },
        {
            title: 'Edit Bahan',
            href: '#',
        },
    ],
};
