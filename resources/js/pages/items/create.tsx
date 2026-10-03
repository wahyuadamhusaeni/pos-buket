import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Layers, Save, Sparkles } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master Bahan & Stok',
        href: '/items',
    },
    {
        title: 'Tambah Bahan',
        href: '/items/create',
    },
];

export default function ItemsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        nama: '',
        tipe: 'bunga_hidup',
        kategori: '',
        satuan: 'tangkai',
        stok_min: '5',
        foto: null as File | null,
        catatan: '',
        aktif: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/items', { forceFormData: true });
    };

    return (
        <>
            <Head title="Tambah Bahan Baru - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Link href="/items">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Layers className="h-6 w-6 text-rose-500" />
                            Tambah Master Bahan Baru
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Daftarkan bahan baku atau perlengkapan baru ke dalam sistem
                        </p>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Informasi Dasar Bahan</CardTitle>
                            <CardDescription>
                                Saldo stok awal dapat diisi melalui menu Pembelian atau Penyesuaian Stok (Opname).
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            {/* Nama */}
                            <div className="grid gap-2">
                                <Label htmlFor="nama">
                                    Nama Bahan / Bunga <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="nama"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    placeholder="Contoh: Mawar Merah Holland Super, Kertas Wrapping Cellophane Lilac"
                                    className="focus-visible:ring-rose-500"
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.nama} />
                            </div>

                            {/* Tipe & Kategori */}
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
                                        placeholder="Contoh: Mawar, Lily, Wrapping, Pita Satin"
                                        className="focus-visible:ring-rose-500"
                                    />
                                    <InputError message={errors.kategori} />
                                </div>
                            </div>

                            {/* Satuan & Stok Min */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="satuan">
                                        Satuan Ukur <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="satuan"
                                        value={data.satuan}
                                        onChange={(e) => setData('satuan', e.target.value)}
                                        placeholder="Contoh: tangkai, ikat, roll, lembar, pcs, meter"
                                        className="focus-visible:ring-rose-500"
                                        required
                                    />
                                    <InputError message={errors.satuan} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="stok_min" className="flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-rose-500" />
                                        Batas Stok Minimum
                                    </Label>
                                    <Input
                                        id="stok_min"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.stok_min}
                                        onChange={(e) => setData('stok_min', e.target.value)}
                                        className="focus-visible:ring-rose-500"
                                        placeholder="5"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Peringatan stok menipis akan aktif bila stok kurang dari nilai ini.
                                    </p>
                                    <InputError message={errors.stok_min} />
                                </div>
                            </div>

                            {/* Foto Bahan Upload */}
                            <ImageUpload
                                id="foto"
                                value={data.foto}
                                onChange={(file) => setData('foto', file)}
                                label="Foto Bahan Baku / Bunga (Opsional)"
                                description="Pilih atau seret gambar bunga dari HP atau komputer (JPG, PNG, WEBP maks 5MB)"
                                error={(errors as any).foto}
                            />

                            {/* Catatan */}
                            <div className="grid gap-2">
                                <Label htmlFor="catatan">Catatan / Deskripsi Khusus</Label>
                                <textarea
                                    id="catatan"
                                    rows={3}
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    placeholder="Contoh: Simpan di ruangan berpendingin 16°C, ganti air setiap 2 hari..."
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                                />
                                <InputError message={errors.catatan} />
                            </div>

                            {/* Tombol Simpan */}
                            <div className="pt-4 border-t flex items-center justify-end gap-3">
                                <Button asChild variant="outline">
                                    <Link href="/items">Batal</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {processing ? 'Menyimpan...' : 'Simpan Bahan'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </>
    );
}

ItemsCreate.layout = {
    breadcrumbs,
};
