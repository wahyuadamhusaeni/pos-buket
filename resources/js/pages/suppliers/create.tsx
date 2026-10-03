import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Store } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Supplier & Pemasok',
        href: '/suppliers',
    },
    {
        title: 'Tambah Supplier',
        href: '/suppliers/create',
    },
];

export default function SuppliersCreate() {
    const { data, setData, post, processing, errors } = useForm({
        nama: '',
        platform: 'offline',
        link: '',
        kontak: '',
        catatan: '',
        aktif: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/suppliers');
    };

    return (
        <>
            <Head title="Tambah Supplier Baru - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Link href="/suppliers">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Store className="h-6 w-6 text-rose-500" />
                            Tambah Data Supplier / Pemasok
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Daftarkan kebun bunga atau toko tempat kulakan perlengkapan buket
                        </p>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Profil Supplier</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nama">Nama Supplier / Toko <span className="text-rose-500">*</span></Label>
                                <Input
                                    id="nama"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    placeholder="Contoh: Kebun Mawar Lembang Asri, Toko Pita Harco"
                                    className="focus-visible:ring-rose-500"
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.nama} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="platform">Platform Pembelian <span className="text-rose-500">*</span></Label>
                                    <select
                                        id="platform"
                                        value={data.platform}
                                        onChange={(e) => setData('platform', e.target.value as any)}
                                        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:ring-1 focus-visible:ring-rose-500"
                                    >
                                        <option value="offline">Toko Fisik / Kebun Langsung</option>
                                        <option value="shopee">Shopee</option>
                                        <option value="tokopedia">Tokopedia</option>
                                        <option value="lainnya">Lainnya / Ekspedisi Luar Kota</option>
                                    </select>
                                    <InputError message={errors.platform} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="kontak">No. WhatsApp / Telepon</Label>
                                    <Input
                                        id="kontak"
                                        value={data.kontak}
                                        onChange={(e) => setData('kontak', e.target.value)}
                                        placeholder="081234567890"
                                        className="focus-visible:ring-rose-500"
                                    />
                                    <InputError message={errors.kontak} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="link">Link Toko Online / Website</Label>
                                <Input
                                    id="link"
                                    value={data.link}
                                    onChange={(e) => setData('link', e.target.value)}
                                    placeholder="https://shopee.co.id/..."
                                    className="focus-visible:ring-rose-500"
                                />
                                <InputError message={errors.link} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="catatan">Catatan Supplier / Alamat Lengkap</Label>
                                <textarea
                                    id="catatan"
                                    rows={3}
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    placeholder="Contoh: Jadwal kirim tiap Selasa & Jumat via Baraya Travel..."
                                    className="w-full rounded-md border border-input bg-transparent p-2.5 text-xs focus-visible:ring-1 focus-visible:ring-rose-500"
                                />
                                <InputError message={errors.catatan} />
                            </div>

                            <div className="pt-4 border-t flex justify-end gap-3">
                                <Button asChild variant="outline">
                                    <Link href="/suppliers">Batal</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold shadow-md shadow-rose-500/20"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {processing ? 'Menyimpan...' : 'Simpan Supplier'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </>
    );
}

SuppliersCreate.layout = {
    breadcrumbs,
};
