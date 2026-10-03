import { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Flower2, Plus, Save, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { BreadcrumbItem } from '@/types';

interface ItemOption {
    id: number;
    nama: string;
    tipe: string;
    satuan: string;
    hpp_rata_rata: number;
}

interface TemplateItemInput {
    item_id: number;
    qty: number;
}

interface TemplatesCreateProps {
    items: ItemOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Resep Buket & Rangkaian',
        href: '/templates',
    },
    {
        title: 'Buat Resep Baru',
        href: '/templates/create',
    },
];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export default function TemplatesCreate({ items }: TemplatesCreateProps) {
    const itemsMap = useMemo(() => {
        const map = new Map<number, ItemOption>();
        items.forEach((it) => map.set(it.id, it));
        return map;
    }, [items]);

    const itemOptions = useMemo(() => {
        return items.map((it) => ({
            value: it.id,
            label: it.nama,
            sublabel: `HPP: ${formatRupiah(it.hpp_rata_rata)} / ${it.satuan}`,
            badge: it.tipe === 'bunga_hidup' ? 'Bunga Segar' : it.tipe === 'bunga_artifisial' ? 'Artifisial' : 'Pelengkap',
        }));
    }, [items]);

    const { data, setData, post, processing, errors } = useForm({
        nama: '',
        harga_default: 0,
        foto: null as File | null,
        catatan: '',
        items: [
            {
                item_id: items[0]?.id || 0,
                qty: 1,
            },
        ] as TemplateItemInput[],
    });

    const totalHpp = useMemo(() => {
        return data.items.reduce((sum, row) => {
            const it = itemsMap.get(row.item_id);
            return sum + (it ? Math.round(Number(row.qty || 0) * it.hpp_rata_rata) : 0);
        }, 0);
    }, [data.items, itemsMap]);

    const addItemRow = () => {
        setData('items', [
            ...data.items,
            {
                item_id: items[0]?.id || 0,
                qty: 1,
            },
        ]);
    };

    const removeItemRow = (idx: number) => {
        if (data.items.length <= 1) return;
        setData('items', data.items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx: number, field: keyof TemplateItemInput, val: any) => {
        const next = [...data.items];
        next[idx] = { ...next[idx], [field]: val };
        setData('items', next);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/templates', { forceFormData: true });
    };

    return (
        <>
            <Head title="Buat Resep Buket Baru - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Link href="/templates">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Flower2 className="h-6 w-6 text-rose-500" />
                            Buat Resep Buket Standar (Bill of Materials)
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Tetapkan komposisi bunga baku dan pembungkus untuk rangkaian buket populer toko
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Informasi Buket</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nama">Nama Resep Buket <span className="text-rose-500">*</span></Label>
                                <Input
                                    id="nama"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    placeholder="Contoh: Buket Mawar Merah 10 Tangkai Elegan"
                                    className="focus-visible:ring-rose-500"
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.nama} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="harga_default">Harga Jual Rekomendasi (Rp)</Label>
                                    <Input
                                        id="harga_default"
                                        type="number"
                                        min="0"
                                        value={data.harga_default}
                                        onChange={(e) => setData('harga_default', parseInt(e.target.value) || 0)}
                                        className="focus-visible:ring-rose-500 font-mono"
                                    />
                                    <InputError message={errors.harga_default} />
                                </div>

                            </div>

                            <ImageUpload
                                id="foto"
                                value={data.foto}
                                onChange={(file) => setData('foto', file)}
                                label="Foto Contoh Hasil Rangkaian (Opsional)"
                                description="Pilih atau seret gambar contoh buket dari HP atau laptop (JPG, PNG, WEBP maks 5MB)"
                                error={(errors as any).foto}
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="catatan">Instruksi Merangkai / Catatan Khusus</Label>
                                <textarea
                                    id="catatan"
                                    rows={2}
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    placeholder="Contoh: Potong tangkai sudut 45 derajat, wrapping gaya spiral..."
                                    className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus-visible:ring-1 focus-visible:ring-rose-500"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Components Table */}
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base font-semibold">Komposisi Bahan Baku</CardTitle>
                                    <CardDescription>Bahan yang otomatis ditarik keluar dari stok saat kasir memilih buket ini.</CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItemRow}
                                    className="text-xs text-rose-600 border-rose-200 self-start sm:self-auto"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Tambah Komponen
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px] text-xs text-left">
                                    <thead className="bg-muted/40 uppercase font-semibold text-muted-foreground border-b">
                                        <tr>
                                            <th className="py-2.5 px-4">Bahan Baku</th>
                                            <th className="py-2.5 px-4 w-32 text-center">Jumlah (Qty)</th>
                                            <th className="py-2.5 px-4 text-right">HPP Satuan Saat Ini</th>
                                            <th className="py-2.5 px-4 text-right">Subtotal HPP</th>
                                            <th className="py-2.5 px-2 text-center w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {data.items.map((row, idx) => {
                                            const it = itemsMap.get(row.item_id);
                                            const sub = it ? Math.round(Number(row.qty || 0) * it.hpp_rata_rata) : 0;

                                            return (
                                                <tr key={idx} className="hover:bg-muted/20">
                                                    <td className="py-2.5 px-4 min-w-[240px]">
                                                        <SearchableSelect
                                                            options={itemOptions}
                                                            value={row.item_id}
                                                            onChange={(val) => updateItem(idx, 'item_id', Number(val))}
                                                            placeholder="Pilih bunga / bahan..."
                                                            searchPlaceholder="Ketik nama bunga..."
                                                        />
                                                    </td>
                                                <td className="py-2.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Input
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={row.qty}
                                                            onChange={(e) => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                                                            className="h-8 text-center text-xs"
                                                            required
                                                        />
                                                        <span className="text-[10px] text-muted-foreground w-12 text-left truncate">
                                                            {it?.satuan}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                                                    {formatRupiah(it?.hpp_rata_rata || 0)}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono font-semibold text-foreground">
                                                    {formatRupiah(sub)}
                                                </td>
                                                <td className="py-2.5 px-2 text-center">
                                                    {data.items.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                            onClick={() => removeItemRow(idx)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            </div>

                            {/* Total HPP Footer */}
                            <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Estimasi Total HPP Bahan Baku:</span>
                                <span className="font-mono font-bold text-base text-rose-600">{formatRupiah(totalHpp)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button asChild variant="outline">
                            <Link href="/templates">Batal</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || data.items.length === 0}
                            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold shadow-md shadow-rose-500/20"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? 'Menyimpan...' : 'Simpan Resep Buket'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

TemplatesCreate.layout = {
    breadcrumbs,
};
