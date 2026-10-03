import { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    DollarSign,
    Layers,
    Minus,
    Plus,
    Receipt,
    ShoppingBag,
    Sparkles,
    Trash2,
    TrendingUp,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
}

interface TemplateOption {
    id: number;
    nama: string;
    harga_default: number;
    template_items: {
        id: number;
        item_id: number;
        qty: number;
        item: ItemOption;
    }[];
}

interface ComponentItem {
    item_id: number;
    qty: number;
}

interface BouquetLine {
    nama_buket: string;
    template_id: number | null;
    harga_jual: number;
    biaya_tambahan: number;
    components: ComponentItem[];
}

interface SalesCreateProps {
    items: ItemOption[];
    templates: TemplateOption[];
    margin_target: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kasir & Penjualan',
        href: '/sales',
    },
    {
        title: 'Transaksi Kasir Baru',
        href: '/sales/create',
    },
];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export default function SalesCreate({ items, templates, margin_target }: SalesCreateProps) {
    const today = new Date().toISOString().split('T')[0];

    // Local items map for fast lookup
    const itemsMap = useMemo(() => {
        const map = new Map<number, ItemOption>();
        items.forEach((item) => map.set(item.id, item));
        return map;
    }, [items]);

    const itemSelectOptions = useMemo(() => {
        return items.map((item) => ({
            value: item.id,
            label: item.nama,
            sublabel: `Stok: ${item.stok_saat_ini} ${item.satuan} • HPP: ${formatRupiah(item.hpp_rata_rata)}`,
            badge: item.tipe === 'bunga_segar' ? 'Segar' : item.tipe === 'bunga_artificial' ? 'Artificial' : item.tipe === 'wrapping' ? 'Kertas' : item.tipe === 'pita' ? 'Pita' : item.tipe,
        }));
    }, [items]);

    const templateOptions = useMemo(() => {
        return [
            { value: '', label: 'Pilih Resep Buket...' },
            ...templates.map((t) => ({
                value: t.id,
                label: t.nama,
                sublabel: t.harga_default ? formatRupiah(t.harga_default) : `${t.template_items?.length || 0} bahan`,
                badge: 'Resep',
            })),
        ];
    }, [templates]);

    const { data, setData, post, processing, errors } = useForm({
        tanggal: today,
        pelanggan: '',
        telepon_pelanggan: '',
        catatan: '',
        status_bayar: 'lunas' as 'lunas' | 'dp' | 'belum',
        metode: 'tunai' as 'tunai' | 'transfer' | 'lainnya',
        nominal_dp: 0,
        lines: [
            {
                nama_buket: 'Rangkaian Buket #1',
                template_id: null as number | null,
                harga_jual: 0,
                biaya_tambahan: 15000, // Ongkos rangkai default
                components: [] as ComponentItem[],
            },
        ] as BouquetLine[],
    });

    // Helper: calculate total HPP of a single bouquet line
    const calculateLineHpp = (line: BouquetLine) => {
        let total = Number(line.biaya_tambahan || 0);
        line.components.forEach((c) => {
            const item = itemsMap.get(c.item_id);
            if (item) {
                total += Math.round(Number(c.qty || 0) * item.hpp_rata_rata);
            }
        });
        return total;
    };

    // Helper: calculate suggested price based on target margin
    const calculateRecommendedPrice = (lineHpp: number) => {
        if (lineHpp <= 0) return 0;
        const marginFactor = 1 - (margin_target / 100);
        if (marginFactor <= 0) return lineHpp * 2;
        const raw = lineHpp / marginFactor;
        // Round to nearest 5,000 for retail florist friendliness
        return Math.ceil(raw / 5000) * 5000;
    };

    // Bouquet handlers
    const addBouquetLine = () => {
        setData('lines', [
            ...data.lines,
            {
                nama_buket: `Rangkaian Buket #${data.lines.length + 1}`,
                template_id: null,
                harga_jual: 0,
                biaya_tambahan: 15000,
                components: [],
            },
        ]);
    };

    const removeBouquetLine = (index: number) => {
        if (data.lines.length <= 1) return;
        const newLines = data.lines.filter((_, idx) => idx !== index);
        setData('lines', newLines);
    };

    const applyTemplateToLine = (lineIndex: number, templateId: string | number | null) => {
        if (!templateId) {
            const newLines = [...data.lines];
            newLines[lineIndex] = {
                ...newLines[lineIndex],
                template_id: null,
            };
            setData('lines', newLines);
            return;
        }

        const tId = Number(templateId);
        const template = templates.find((t) => t.id === tId);
        const newLines = [...data.lines];

        if (!template) {
            newLines[lineIndex] = {
                ...newLines[lineIndex],
                template_id: null,
            };
            setData('lines', newLines);
            return;
        }

        const newComponents: ComponentItem[] = (template.template_items || []).map((ti) => ({
            item_id: ti.item_id,
            qty: Number(ti.qty),
        }));

        newLines[lineIndex] = {
            ...newLines[lineIndex],
            nama_buket: template.nama,
            template_id: template.id,
            harga_jual: template.harga_default || 0,
            components: newComponents,
        };

        // If template doesn't have fixed default price, recommend one
        if (!template.harga_default) {
            const hpp = calculateLineHpp(newLines[lineIndex]);
            newLines[lineIndex].harga_jual = calculateRecommendedPrice(hpp);
        }

        setData('lines', newLines);
    };

    // Component handlers inside a bouquet
    const addComponentToLine = (lineIndex: number, itemId: number) => {
        if (!itemId) return;
        const newLines = [...data.lines];
        const line = newLines[lineIndex];

        // check if already added, if so increment qty
        const existingIdx = line.components.findIndex((c) => c.item_id === itemId);
        if (existingIdx >= 0) {
            line.components[existingIdx].qty += 1;
        } else {
            line.components.push({ item_id: itemId, qty: 1 });
        }

        // Auto update recommended price if price is currently 0
        const hpp = calculateLineHpp(line);
        if (line.harga_jual === 0) {
            line.harga_jual = calculateRecommendedPrice(hpp);
        }

        setData('lines', newLines);
    };

    const updateComponentQty = (lineIndex: number, compIndex: number, qty: number) => {
        const newLines = [...data.lines];
        newLines[lineIndex].components[compIndex].qty = Math.max(0.01, qty);
        setData('lines', newLines);
    };

    const removeComponentFromLine = (lineIndex: number, compIndex: number) => {
        const newLines = [...data.lines];
        newLines[lineIndex].components = newLines[lineIndex].components.filter((_, idx) => idx !== compIndex);
        setData('lines', newLines);
    };

    // Grand totals
    const grandTotals = useMemo(() => {
        let totalHarga = 0;
        let totalHpp = 0;
        let totalBiayaTambahan = 0;

        data.lines.forEach((line) => {
            totalHarga += Number(line.harga_jual || 0);
            totalHpp += calculateLineHpp(line);
            totalBiayaTambahan += Number(line.biaya_tambahan || 0);
        });

        const grossProfit = totalHarga - totalHpp;
        const grossMargin = totalHarga > 0 ? (grossProfit / totalHarga) * 100 : 0;

        return {
            totalHarga,
            totalHpp,
            totalBiayaTambahan,
            grossProfit,
            grossMargin,
        };
    }, [data.lines]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/sales');
    };

    return (
        <>
            <Head title="Kasir & Rangkaian Buket - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Link href="/sales">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <ShoppingBag className="h-6 w-6 text-rose-500" />
                                Kasir POS Florist (Penjualan & Rangkaian)
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Hitung HPP bunga secara otomatis saat merangkai, cek stok langsung, dan pantau margin laba
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1 text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200">
                            Target Margin: {margin_target}%
                        </Badge>
                    </div>
                </div>

                {(errors as any).general && (
                    <div className="p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        {(errors as any).general}
                    </div>
                )}

                <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20 border border-rose-200/70 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">Panduan Kasir Buket:</span> Tambahkan tangkai bunga atau pembungkus satu per satu atau pilih dari Resep Buket. Sistem otomatis menghitung modal HPP dari harga beli rata-rata di gudang dan merekomendasikan harga jual sesuai target margin {margin_target}%.
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT COLUMN: Bouquet Builder (8 cols) */}
                        <div className="lg:col-span-8 space-y-6">
                            {data.lines.map((line, lineIndex) => {
                                const lineHpp = calculateLineHpp(line);
                                const recommendedPrice = calculateRecommendedPrice(lineHpp);
                                const marginPercent = line.harga_jual > 0
                                    ? ((line.harga_jual - lineHpp) / line.harga_jual) * 100
                                    : 0;

                                return (
                                    <Card key={lineIndex} className="border-border/70 shadow-sm relative overflow-hidden">
                                        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500" />
                                        <CardHeader className="pb-3 border-b border-border/50">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex-1 max-w-sm">
                                                    <Input
                                                        value={line.nama_buket}
                                                        onChange={(e) => {
                                                            const newLines = [...data.lines];
                                                            newLines[lineIndex].nama_buket = e.target.value;
                                                            setData('lines', newLines);
                                                        }}
                                                        placeholder="Nama Rangkaian (cth: Buket Mawar Merah)"
                                                        className="font-bold text-base border-none focus-visible:ring-1 focus-visible:ring-rose-500 bg-muted/40 h-9"
                                                    />
                                                </div>

                                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                                                    {/* Template Picker */}
                                                    <div className="w-full sm:w-60">
                                                        <SearchableSelect
                                                            size="sm"
                                                            value={line.template_id || ''}
                                                            onChange={(val) => applyTemplateToLine(lineIndex, val)}
                                                            options={templateOptions}
                                                            placeholder="Pilih Resep Buket..."
                                                            searchPlaceholder="Cari resep buket..."
                                                        />
                                                    </div>

                                                    {data.lines.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeBouquetLine(lineIndex)}
                                                            className="text-muted-foreground hover:text-destructive h-8 w-8 p-0 shrink-0"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-4 space-y-4">
                                            {/* Quick Item Picker bar */}
                                            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 space-y-2">
                                                <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                                    <Plus className="h-3.5 w-3.5 text-rose-500" />
                                                    Pilih Bahan Baku (Bunga, Wrapping, Pita) untuk Rangkaian Ini:
                                                </div>
                                                <SearchableSelect
                                                    value={null}
                                                    options={itemSelectOptions}
                                                    onChange={(val) => {
                                                        if (val) {
                                                            addComponentToLine(lineIndex, Number(val));
                                                        }
                                                    }}
                                                    placeholder="+ Klik atau ketik untuk mencari bahan bunga / wrapping / pita..."
                                                    searchPlaceholder="Ketik nama bahan (contoh: mawar, lily, cellophane)..."
                                                />
                                            </div>

                                            {/* Components Table */}
                                            {line.components.length === 0 ? (
                                                <div className="p-6 text-center text-muted-foreground text-sm border border-dashed rounded-xl">
                                                    Belum ada bahan bunga atau pembungkus yang dipilih. Pilih dari daftar bahan di atas atau gunakan resep buket.
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs text-left">
                                                        <thead className="bg-muted/40 uppercase font-semibold text-muted-foreground border-b">
                                                            <tr>
                                                                <th className="py-2 px-3">Bahan</th>
                                                                <th className="py-2 px-3">Stok Saat Ini</th>
                                                                <th className="py-2 px-3 text-center w-32">Jumlah (Qty)</th>
                                                                <th className="py-2 px-3 text-right">HPP Satuan</th>
                                                                <th className="py-2 px-3 text-right">Subtotal HPP</th>
                                                                <th className="py-2 px-1 text-center w-8"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border/50">
                                                            {line.components.map((comp, compIndex) => {
                                                                const item = itemsMap.get(comp.item_id);
                                                                if (!item) return null;
                                                                const subtotalHpp = Math.round(comp.qty * item.hpp_rata_rata);
                                                                const isOutOfStock = item.stok_saat_ini < comp.qty;

                                                                return (
                                                                    <tr key={comp.item_id} className="hover:bg-muted/20">
                                                                        <td className="py-2 px-3 font-medium text-foreground">
                                                                            {item.nama}
                                                                            <span className="text-[10px] text-muted-foreground ml-1">({item.satuan})</span>
                                                                        </td>
                                                                        <td className="py-2 px-3">
                                                                            <span className={isOutOfStock ? 'text-destructive font-bold' : 'text-muted-foreground'}>
                                                                                {item.stok_saat_ini} {item.satuan}
                                                                                {isOutOfStock && ' ⚠️'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-2 px-3 text-center">
                                                                            <div className="flex items-center justify-center gap-1">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="h-6 w-6 p-0 rounded-md"
                                                                                    onClick={() => updateComponentQty(lineIndex, compIndex, Number(comp.qty) - 1)}
                                                                                >
                                                                                    <Minus className="h-3 w-3" />
                                                                                </Button>
                                                                                <Input
                                                                                    type="number"
                                                                                    min="0.01"
                                                                                    step="0.1"
                                                                                    value={comp.qty}
                                                                                    onChange={(e) => updateComponentQty(lineIndex, compIndex, parseFloat(e.target.value) || 0)}
                                                                                    className="h-6 w-14 text-center text-xs p-1"
                                                                                />
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="h-6 w-6 p-0 rounded-md"
                                                                                    onClick={() => updateComponentQty(lineIndex, compIndex, Number(comp.qty) + 1)}
                                                                                >
                                                                                    <Plus className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                                                                            {formatRupiah(item.hpp_rata_rata)}
                                                                        </td>
                                                                        <td className="py-2 px-3 text-right font-mono font-semibold text-foreground">
                                                                            {formatRupiah(subtotalHpp)}
                                                                        </td>
                                                                        <td className="py-2 px-1 text-center">
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                                                onClick={() => removeComponentFromLine(lineIndex, compIndex)}
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {/* Bouquet Cost & Pricing Footer */}
                                            <div className="pt-3 border-t border-border/70 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/20 p-3 rounded-xl items-center">
                                                <div>
                                                    <Label htmlFor={`craft-${lineIndex}`} className="text-xs text-muted-foreground">
                                                        Biaya Jasa Rangkai (Rp):
                                                    </Label>
                                                    <Input
                                                        id={`craft-${lineIndex}`}
                                                        type="number"
                                                        min="0"
                                                        value={line.biaya_tambahan}
                                                        onChange={(e) => {
                                                            const newLines = [...data.lines];
                                                            newLines[lineIndex].biaya_tambahan = parseInt(e.target.value) || 0;
                                                            setData('lines', newLines);
                                                        }}
                                                        className="h-8 text-xs mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <div className="text-xs text-muted-foreground">Total Modal HPP:</div>
                                                    <div className="text-sm font-bold font-mono text-foreground mt-1">
                                                        {formatRupiah(lineHpp)}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="link"
                                                        size="sm"
                                                        onClick={() => {
                                                            const newLines = [...data.lines];
                                                            newLines[lineIndex].harga_jual = recommendedPrice;
                                                            setData('lines', newLines);
                                                        }}
                                                        className="h-auto p-0 text-[11px] text-rose-500 hover:text-rose-600 mt-0.5"
                                                    >
                                                        Gunakan Rekomendasi ({formatRupiah(recommendedPrice)})
                                                    </Button>
                                                </div>

                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor={`price-${lineIndex}`} className="text-xs font-semibold text-foreground">
                                                            Harga Jual (Rp):
                                                        </Label>
                                                        <span
                                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                                marginPercent >= margin_target
                                                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                                                    : marginPercent > 0
                                                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                                                                    : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                                                            }`}
                                                        >
                                                            Margin: {marginPercent.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <Input
                                                        id={`price-${lineIndex}`}
                                                        type="number"
                                                        min="0"
                                                        value={line.harga_jual}
                                                        onChange={(e) => {
                                                            const newLines = [...data.lines];
                                                            newLines[lineIndex].harga_jual = parseInt(e.target.value) || 0;
                                                            setData('lines', newLines);
                                                        }}
                                                        className="h-8 text-sm font-bold mt-1 focus-visible:ring-rose-500 border-rose-300 dark:border-rose-800"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addBouquetLine}
                                className="w-full border-dashed border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 py-5"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Rangkaian Buket Lainnya dalam Transaksi Ini
                            </Button>
                        </div>

                        {/* RIGHT COLUMN: Order & Payment Checkout Card (4 cols) */}
                        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
                            <Card className="border-border/70 shadow-md">
                                <CardHeader className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-b border-border/50 pb-4">
                                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                                        <Receipt className="h-5 w-5 text-rose-500" />
                                        Informasi Kasir & Pembayaran
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-5 space-y-4">
                                    {/* Tanggal */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="tanggal" className="text-xs">
                                            Tanggal Transaksi
                                        </Label>
                                        <Input
                                            id="tanggal"
                                            type="date"
                                            value={data.tanggal}
                                            onChange={(e) => setData('tanggal', e.target.value)}
                                            className="h-9 text-xs focus-visible:ring-rose-500"
                                            required
                                        />
                                        <InputError message={errors.tanggal} />
                                    </div>

                                    {/* Pelanggan */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="pelanggan" className="text-xs">
                                            Nama Pelanggan (Opsional)
                                        </Label>
                                        <Input
                                            id="pelanggan"
                                            value={data.pelanggan}
                                            onChange={(e) => setData('pelanggan', e.target.value)}
                                            placeholder="Pelanggan Langsung (Walk-in)"
                                            className="h-9 text-xs focus-visible:ring-rose-500"
                                        />
                                        <InputError message={errors.pelanggan} />
                                    </div>

                                    {/* Telepon */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="telepon" className="text-xs">
                                            No. WhatsApp / Telepon
                                        </Label>
                                        <Input
                                            id="telepon"
                                            value={data.telepon_pelanggan}
                                            onChange={(e) => setData('telepon_pelanggan', e.target.value)}
                                            placeholder="08123456789"
                                            className="h-9 text-xs focus-visible:ring-rose-500"
                                        />
                                    </div>

                                    {/* Status Pembayaran */}
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs font-semibold">Status Bayar</Label>
                                        <div className="grid grid-cols-3 gap-1">
                                            {(['lunas', 'dp', 'belum'] as const).map((st) => (
                                                <Button
                                                    key={st}
                                                    type="button"
                                                    variant={data.status_bayar === st ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setData('status_bayar', st)}
                                                    className={`capitalize text-xs h-8 ${
                                                        data.status_bayar === st
                                                            ? 'bg-rose-500 hover:bg-rose-600 text-white font-bold'
                                                            : ''
                                                    }`}
                                                >
                                                    {st === 'belum' ? 'Belum Bayar' : st.toUpperCase()}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* DP Input if selected */}
                                    {data.status_bayar === 'dp' && (
                                        <div className="grid gap-1.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                                            <Label htmlFor="nominal_dp" className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                                Nominal Uang Muka (DP):
                                            </Label>
                                            <Input
                                                id="nominal_dp"
                                                type="number"
                                                min="1"
                                                value={data.nominal_dp}
                                                onChange={(e) => setData('nominal_dp', parseInt(e.target.value) || 0)}
                                                className="h-9 text-sm font-semibold"
                                                placeholder="Contoh: 100000"
                                            />
                                            <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                                                Sisa Piutang: {formatRupiah(Math.max(0, grandTotals.totalHarga - Number(data.nominal_dp)))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Metode Pembayaran */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="metode" className="text-xs">
                                            Metode Pembayaran
                                        </Label>
                                        <select
                                            id="metode"
                                            value={data.metode}
                                            onChange={(e) => setData('metode', e.target.value as any)}
                                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:ring-1 focus-visible:ring-rose-500"
                                        >
                                            <option value="tunai">Tunai / Cash</option>
                                            <option value="transfer">Transfer Bank / QRIS</option>
                                            <option value="lainnya">Lainnya / EDC</option>
                                        </select>
                                    </div>

                                    {/* Catatan */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="catatan" className="text-xs">
                                            Catatan / Ucapan Buket
                                        </Label>
                                        <textarea
                                            id="catatan"
                                            rows={2}
                                            value={data.catatan}
                                            onChange={(e) => setData('catatan', e.target.value)}
                                            placeholder="Pesan kartu ucapan atau instruksi kurir..."
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus-visible:ring-1 focus-visible:ring-rose-500"
                                        />
                                    </div>

                                    {/* Live Financial Summary */}
                                    <div className="pt-3 border-t border-border/80 space-y-2 text-xs">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Estimasi HPP Total:</span>
                                            <span className="font-mono">{formatRupiah(grandTotals.totalHpp)}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Estimasi Laba Kotor:</span>
                                            <span className="font-mono font-medium text-emerald-600">
                                                {formatRupiah(grandTotals.grossProfit)} ({grandTotals.grossMargin.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-baseline pt-2 border-t text-sm font-bold">
                                            <span className="text-foreground">Total Penjualan:</span>
                                            <span className="text-xl font-extrabold font-mono text-rose-600">
                                                {formatRupiah(grandTotals.totalHarga)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        disabled={processing || grandTotals.totalHarga <= 0}
                                        className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold py-5 shadow-lg shadow-rose-500/25 mt-2"
                                    >
                                        <CheckCircle2 className="h-5 w-5 mr-2" />
                                        {processing ? 'Memproses Transaksi...' : 'Selesaikan Transaksi & Potong Stok'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

SalesCreate.layout = {
    breadcrumbs,
};
