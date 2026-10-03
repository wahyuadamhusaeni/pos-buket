import { Head, useForm } from '@inertiajs/react';
import { Building2, Percent, ShieldCheck, Sparkles, Store } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';


interface BusinessSettingsProps {
    settings: {
        nama_usaha: string;
        margin_target: string;
        stok_min_default: string;
        mata_uang: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pengaturan Toko',
        href: '/settings/business',
    },
];

export default function BusinessSettings({ settings }: BusinessSettingsProps) {
    const { data, setData, put, errors, processing, recentlySuccessful } = useForm({
        nama_usaha: settings.nama_usaha || 'KIYOMI STOCK',
        margin_target: settings.margin_target || '30',
        stok_min_default: settings.stok_min_default || '5',
        mata_uang: settings.mata_uang || 'IDR',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/settings/business', {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Pengaturan Toko - KIYOMI STOCK" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profil & Parameter Toko"
                    description="Konfigurasi nama toko, persentase target keuntungan (margin), dan batas peringatan stok menipis."
                />

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="nama_usaha" className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-rose-500" />
                            Nama Toko / Usaha
                        </Label>
                        <Input
                            id="nama_usaha"
                            type="text"
                            className="mt-1 block w-full focus-visible:ring-rose-500"
                            value={data.nama_usaha}
                            onChange={(e) => setData('nama_usaha', e.target.value)}
                            required
                            placeholder="Contoh: KIYOMI FLORIST & GIFT"
                        />
                        <p className="text-xs text-muted-foreground">
                            Nama usaha yang akan tercantum pada struk kasir, nota pesanan, dan laporan.
                        </p>
                        <InputError message={errors.nama_usaha} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="margin_target" className="flex items-center gap-2">
                                <Percent className="h-4 w-4 text-rose-500" />
                                Target Margin Keuntungan (%)
                            </Label>
                            <Input
                                id="margin_target"
                                type="number"
                                min="0"
                                max="99"
                                step="0.1"
                                className="mt-1 block w-full focus-visible:ring-rose-500"
                                value={data.margin_target}
                                onChange={(e) => setData('margin_target', e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Digunakan saat kalkulasi harga jual rekomendasi pada resep buket/rangkaian.
                            </p>
                            <InputError message={errors.margin_target} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="stok_min_default" className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-rose-500" />
                                Default Stok Menipis (Threshold)
                            </Label>
                            <Input
                                id="stok_min_default"
                                type="number"
                                min="0"
                                className="mt-1 block w-full focus-visible:ring-rose-500"
                                value={data.stok_min_default}
                                onChange={(e) => setData('stok_min_default', e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Peringatan otomatis muncul di dashboard saat stok bahan mencapai batas ini.
                            </p>
                            <InputError message={errors.stok_min_default} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="mata_uang" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-rose-500" />
                            Simbol Mata Uang
                        </Label>
                        <Input
                            id="mata_uang"
                            type="text"
                            className="mt-1 block w-full max-w-xs focus-visible:ring-rose-500"
                            value={data.mata_uang}
                            onChange={(e) => setData('mata_uang', e.target.value)}
                            required
                        />
                        <InputError message={errors.mata_uang} />
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>

                        {recentlySuccessful && (
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 transition-all">
                                <ShieldCheck className="h-4 w-4" />
                                Pengaturan berhasil disimpan!
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </>
    );
}

BusinessSettings.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan Toko',
            href: '/settings/business',
        },
    ],
};
