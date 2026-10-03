import { useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    CheckCircle2,
    ClipboardCheck,
    Flower2,
    Layers,
    PackageMinus,
    PackagePlus,
    Save,
    Sparkles,
    Trash2,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { BreadcrumbItem } from '@/types';

interface ItemOption {
    id: number;
    nama: string;
    tipe: string;
    satuan: string;
    stok_saat_ini: number;
    hpp_rata_rata: number;
    stok_min: number;
}

interface StockAdjustmentsProps {
    items: ItemOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Penyesuaian Stok & Opname',
        href: '/stock/adjustments',
    },
];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

const formatQty = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '0';
    const num = Number(value);
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 2,
    }).format(num);
};

export default function StockAdjustments({ items }: StockAdjustmentsProps) {
    const [mode, setMode] = useState<'waste' | 'opname_minus' | 'opname_plus'>('waste');

    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
        tipe: 'waste' as 'adjust' | 'waste',
        arah: 'minus' as 'plus' | 'minus',
        item_id: items[0]?.id || 0,
        qty: 1,
        alasan: 'Bunga layu / busuk terkena suhu ruangan',
        catatan: '',
    });

    const itemSelectOptions = useMemo(() => {
        return items.map((it) => ({
            value: it.id,
            label: it.nama,
            sublabel: `Stok: ${formatQty(it.stok_saat_ini)} ${it.satuan} • HPP: ${formatRupiah(it.hpp_rata_rata)}`,
            badge: it.tipe === 'bunga_segar' ? 'Segar' : it.tipe === 'bunga_artificial' ? 'Artificial' : it.tipe === 'wrapping' ? 'Kertas' : it.tipe === 'pita' ? 'Pita' : it.tipe,
        }));
    }, [items]);

    const selectedItem = useMemo(() => {
        return items.find((it) => it.id === Number(data.item_id)) || items[0];
    }, [items, data.item_id]);

    const projectedStock = useMemo(() => {
        if (!selectedItem) return 0;
        const current = selectedItem.stok_saat_ini;
        const change = Number(data.qty || 0);
        return data.arah === 'plus' ? current + change : current - change;
    }, [selectedItem, data.qty, data.arah]);

    const financialImpact = useMemo(() => {
        if (!selectedItem) return 0;
        return Math.round(Number(data.qty || 0) * selectedItem.hpp_rata_rata);
    }, [selectedItem, data.qty]);

    const handleModeChange = (newMode: 'waste' | 'opname_minus' | 'opname_plus') => {
        setMode(newMode);
        if (newMode === 'waste') {
            setData((prev) => ({
                ...prev,
                tipe: 'waste',
                arah: 'minus',
                alasan: 'Bunga layu / busuk terkena suhu ruangan',
            }));
        } else if (newMode === 'opname_minus') {
            setData((prev) => ({
                ...prev,
                tipe: 'adjust',
                arah: 'minus',
                alasan: 'Selisih opname fisik (stok fisik lebih sedikit)',
            }));
        } else {
            setData((prev) => ({
                ...prev,
                tipe: 'adjust',
                arah: 'plus',
                alasan: 'Selisih opname fisik (stok fisik ditemukan lebih banyak)',
            }));
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/stock/adjustments', {
            onSuccess: () => {
                reset('qty', 'catatan');
            },
        });
    };

    return (
        <>
            <Head title="Penyesuaian Stok & Opname - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <ClipboardCheck className="h-6 w-6 text-rose-500" />
                        Penyesuaian Stok Fisik & Bunga Rusak (Waste)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Catat bunga layu/busuk atau sesuaikan perbedaan jumlah fisik saat stok opname toko
                    </p>
                </div>

                {(errors as any).general && (
                    <div className="p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        {(errors as any).general}
                    </div>
                )}

                {recentlySuccessful && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        Penyesuaian stok berhasil disimpan dan mutasi tercatat di kartu stok!
                    </div>
                )}

                {/* Mode Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card
                        onClick={() => handleModeChange('waste')}
                        className={`cursor-pointer transition-all border-2 ${
                            mode === 'waste'
                                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 shadow-md'
                                : 'border-border/60 hover:border-rose-200'
                        }`}
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center flex-shrink-0">
                                <Flower2 className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-foreground">Bunga Layu / Rusak (Waste)</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    Catat kerugian bunga patah / busuk
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        onClick={() => handleModeChange('opname_minus')}
                        className={`cursor-pointer transition-all border-2 ${
                            mode === 'opname_minus'
                                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-md'
                                : 'border-border/60 hover:border-amber-200'
                        }`}
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center flex-shrink-0">
                                <PackageMinus className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-foreground">Koreksi Opname (-)</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    Stok fisik riil lebih sedikit dari sistem
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        onClick={() => handleModeChange('opname_plus')}
                        className={`cursor-pointer transition-all border-2 ${
                            mode === 'opname_plus'
                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md'
                                : 'border-border/60 hover:border-emerald-200'
                        }`}
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <PackagePlus className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-foreground">Koreksi Opname (+)</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    Stok fisik riil ditemukan lebih banyak
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Form */}
                <form onSubmit={submit}>
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">
                                Formulir Penyesuaian Stok
                            </CardTitle>
                            <CardDescription>
                                Nilai HPP bahan saat ini digunakan untuk menghitung kerugian finansial atau nilai aset masuk.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            {/* Item Selector */}
                            <div className="grid gap-2">
                                <Label htmlFor="item_id" className="text-xs font-semibold">
                                    Pilih Bahan Baku <span className="text-rose-500">*</span>
                                </Label>
                                <SearchableSelect
                                    id="item_id"
                                    value={data.item_id}
                                    onChange={(val) => setData('item_id', Number(val))}
                                    options={itemSelectOptions}
                                    placeholder="Pilih Bahan Baku..."
                                    searchPlaceholder="Cari bunga / wrapping / pita..."
                                />
                                <InputError message={errors.item_id} />
                            </div>

                            {/* Qty & Projected Stock Preview */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="qty" className="text-xs font-semibold">
                                        Jumlah Fisik yang Disesuaikan ({selectedItem?.satuan}) <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="qty"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={data.qty}
                                        onChange={(e) => setData('qty', parseFloat(e.target.value) || 0)}
                                        className="h-10 text-base font-bold focus-visible:ring-rose-500"
                                        required
                                    />
                                    <InputError message={errors.qty} />
                                </div>

                                {/* Projection Card */}
                                <div className="p-3 rounded-lg bg-muted/40 border border-border/50 flex flex-col justify-center">
                                    <div className="text-xs text-muted-foreground">Proyeksi Saldo Stok:</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="font-mono text-sm">{formatQty(selectedItem?.stok_saat_ini)}</span>
                                        <span className="text-muted-foreground">→</span>
                                        <span className={`font-mono text-lg font-bold ${data.arah === 'plus' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatQty(projectedStock)} {selectedItem?.satuan}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                        Nilai Finansial: <strong className="font-mono text-foreground">{formatRupiah(financialImpact)}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Alasan */}
                            <div className="grid gap-2">
                                <Label htmlFor="alasan" className="text-xs font-semibold">
                                    Alasan Penyesuaian <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="alasan"
                                    value={data.alasan}
                                    onChange={(e) => setData('alasan', e.target.value)}
                                    placeholder="Alasan penyesuaian..."
                                    className="focus-visible:ring-rose-500"
                                    required
                                />
                                <InputError message={errors.alasan} />
                            </div>

                            {/* Catatan */}
                            <div className="grid gap-2">
                                <Label htmlFor="catatan" className="text-xs">Catatan Tambahan (Opsional)</Label>
                                <textarea
                                    id="catatan"
                                    rows={2}
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    placeholder="Contoh: Kejadian saat merangkai buket wisuda, disimpan oleh kasir..."
                                    className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus-visible:ring-1 focus-visible:ring-rose-500"
                                />
                                <InputError message={errors.catatan} />
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 border-t flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={processing || data.qty <= 0}
                                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold shadow-md shadow-rose-500/20 px-6"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {processing ? 'Menyimpan...' : 'Simpan Penyesuaian Stok'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </>
    );
}

StockAdjustments.layout = {
    breadcrumbs,
};
