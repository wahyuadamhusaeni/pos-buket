import { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    Layers,
    Minus,
    Plus,
    Receipt,
    ShoppingBag,
    Sparkles,
    Store,
    Trash2,
    TrendingUp,
    Truck,
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

interface SaleFeeItem {
    nama: string;
    nominal: number;
    catatan?: string;
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

const formatQty = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined || val === '') return '0';
    const num = Number(val);
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 2,
    }).format(num);
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
            sublabel: `Stok: ${formatQty(item.stok_saat_ini)} ${item.satuan} • HPP: ${formatRupiah(item.hpp_rata_rata)}`,
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

    const defaultAmbilDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return d.toISOString().split('T')[0];
    }, []);

    const [cashReceived, setCashReceived] = useState<number | ''>('');

    const { data, setData, post, processing, errors } = useForm({
        tanggal: today,
        jenis_pesanan: 'langsung' as 'langsung' | 'preorder',
        tanggal_ambil: defaultAmbilDate,
        jam_ambil: '14:00',
        tipe_pengiriman: 'pickup' as 'pickup' | 'delivery',
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
        fees: [] as SaleFeeItem[],
    });

    // Multi Biaya Jasa Handlers
    const addFeePreset = (nama: string, defaultNominal: number) => {
        setData('fees', [
            ...data.fees,
            { nama, nominal: defaultNominal, catatan: '' },
        ]);
    };

    const addEmptyFee = () => {
        setData('fees', [
            ...data.fees,
            { nama: '', nominal: 0, catatan: '' },
        ]);
    };

    const updateFee = (index: number, field: keyof SaleFeeItem, value: any) => {
        const newFees = [...data.fees];
        newFees[index] = { ...newFees[index], [field]: value };
        setData('fees', newFees);
    };

    const removeFee = (index: number) => {
        setData('fees', data.fees.filter((_, idx) => idx !== index));
    };

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
        let totalBouquetHarga = 0;
        let totalHpp = 0;
        let totalBiayaTambahan = 0;

        data.lines.forEach((line) => {
            totalBouquetHarga += Number(line.harga_jual || 0);
            totalHpp += calculateLineHpp(line);
            totalBiayaTambahan += Number(line.biaya_tambahan || 0);
        });

        let totalFees = 0;
        data.fees.forEach((fee) => {
            totalFees += Number(fee.nominal || 0);
        });

        const totalHarga = totalBouquetHarga + totalFees;
        const grossProfit = totalHarga - totalHpp;
        const grossMargin = totalHarga > 0 ? (grossProfit / totalHarga) * 100 : 0;

        return {
            totalBouquetHarga,
            totalFees,
            totalHarga,
            totalHpp,
            totalBiayaTambahan,
            grossProfit,
            grossMargin,
        };
    }, [data.lines, data.fees]);

    const cashChange = useMemo(() => {
        if (!cashReceived || Number(cashReceived) < grandTotals.totalHarga) return 0;
        return Number(cashReceived) - grandTotals.totalHarga;
    }, [cashReceived, grandTotals.totalHarga]);

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
                                                                                {formatQty(item.stok_saat_ini)} {item.satuan}
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

                            {/* MULTI BIAYA JASA & LAYANAN TAMBAHAN */}
                            <Card className="border-border/70 shadow-sm overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-pink-500/10 border-b border-border/50 py-3.5 px-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                                                <Sparkles className="h-4 w-4 text-amber-500" />
                                                Biaya Jasa & Layanan Tambahan (Multi-Jasa)
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Tambahkan rincian jasa seperti jasa rangkai buket, jasa penukaran uang baru, biaya bensin / kurir, dsb.
                                            </p>
                                        </div>
                                        {grandTotals.totalFees > 0 && (
                                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono font-bold text-xs self-start sm:self-auto">
                                                Total Jasa: {formatRupiah(grandTotals.totalFees)}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    {/* Preset Quick Chips */}
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground mb-2">
                                            Pilih Cepat Layanan Populer:
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => addFeePreset('Jasa Rangkai Buket', 35000)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 text-xs font-medium text-foreground transition-all"
                                            >
                                                🌸 + Jasa Rangkai (Rp 35rb)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addFeePreset('Jasa Penukaran Uang Baru Buket', 25000)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 text-xs font-medium text-foreground transition-all"
                                            >
                                                💵 + Jasa Tukar Uang (Rp 25rb)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addFeePreset('Biaya Bensin / Antar Kurir', 15000)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 text-xs font-medium text-foreground transition-all"
                                            >
                                                🛵 + Biaya Bensin/Antar (Rp 15rb)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addFeePreset('Jasa Pasang Lampu LED / Akrilik', 10000)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-300 text-xs font-medium text-foreground transition-all"
                                            >
                                                💡 + Lampu LED/Akrilik (Rp 10rb)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addFeePreset('Jasa Kartu Ucapan & Topper Custom', 5000)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-300 text-xs font-medium text-foreground transition-all"
                                            >
                                                ✍️ + Kartu Ucapan (Rp 5rb)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Fee rows list */}
                                    {data.fees.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground bg-muted/10">
                                            Belum ada biaya jasa tambahan. Klik tombol layanan populer di atas atau klik tombol tambah di bawah untuk memasukkan jasa manual.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {data.fees.map((fee, fIdx) => (
                                                <div key={fIdx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-xl border border-border/60 bg-muted/20">
                                                    <div className="flex-1">
                                                        <Label className="text-[11px] text-muted-foreground">Nama Jasa / Biaya</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="Misal: Jasa Rangkai / Biaya Bensin"
                                                            value={fee.nama}
                                                            onChange={(e) => updateFee(fIdx, 'nama', e.target.value)}
                                                            className="h-8 text-xs font-medium mt-1"
                                                        />
                                                    </div>
                                                    <div className="w-full sm:w-44">
                                                        <Label className="text-[11px] text-muted-foreground">Nominal Tarif (Rp)</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={fee.nominal || ''}
                                                            onChange={(e) => updateFee(fIdx, 'nominal', parseInt(e.target.value) || 0)}
                                                            className="h-8 text-xs font-mono font-bold mt-1 text-right"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <Label className="text-[11px] text-muted-foreground">Keterangan / Catatan (Opsional)</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="Keterangan rincian..."
                                                            value={fee.catatan || ''}
                                                            onChange={(e) => updateFee(fIdx, 'catatan', e.target.value)}
                                                            className="h-8 text-xs mt-1"
                                                        />
                                                    </div>
                                                    <div className="self-end sm:self-center sm:pt-4">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeFee(fIdx)}
                                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addEmptyFee}
                                        className="text-xs border-dashed border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                                        + Tambah Baris Jasa Manual
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: Order & Payment Checkout Card (4 cols) */}
                        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
                            <Card className="border-border/70 shadow-md">
                                <CardHeader className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-b border-border/50 pb-4">
                                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                                        <Receipt className="h-5 w-5 text-rose-500" />
                                        Informasi Pesanan & Pembayaran
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-5 space-y-4">
                                    {/* Jenis Pesanan Toggle */}
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs font-semibold">Jenis Pesanan</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setData('jenis_pesanan', 'langsung')}
                                                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                                                    data.jenis_pesanan === 'langsung'
                                                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold shadow-sm'
                                                        : 'border-border/70 hover:border-rose-300 text-muted-foreground'
                                                }`}
                                            >
                                                <ShoppingBag className="h-4 w-4 shrink-0 text-rose-500" />
                                                <div>
                                                    <div className="text-xs font-semibold">Langsung Jadi</div>
                                                    <div className="text-[10px] text-muted-foreground">Buket diambil hari ini</div>
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setData('jenis_pesanan', 'preorder')}
                                                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                                                    data.jenis_pesanan === 'preorder'
                                                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold shadow-sm'
                                                        : 'border-border/70 hover:border-rose-300 text-muted-foreground'
                                                }`}
                                            >
                                                <Calendar className="h-4 w-4 shrink-0 text-rose-500" />
                                                <div>
                                                    <div className="text-xs font-semibold">Pre-Order (PO)</div>
                                                    <div className="text-[10px] text-muted-foreground">Jadwal tanggal nanti</div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tanggal Order Masuk */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="tanggal" className="text-xs">
                                            Tanggal Transaksi / Order Masuk
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

                                    {/* Pre-Order Schedule Box */}
                                    {data.jenis_pesanan === 'preorder' && (
                                        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/60 space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                                                <Calendar className="h-4 w-4 text-amber-600" />
                                                Jadwal Jadi & Pengambilan Buket:
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="grid gap-1">
                                                    <Label htmlFor="tanggal_ambil" className="text-[11px] text-muted-foreground">
                                                        Tanggal Ambil / Kirim <span className="text-rose-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="tanggal_ambil"
                                                        type="date"
                                                        value={data.tanggal_ambil}
                                                        onChange={(e) => setData('tanggal_ambil', e.target.value)}
                                                        className="h-8 text-xs bg-background"
                                                        required={data.jenis_pesanan === 'preorder'}
                                                    />
                                                </div>
                                                <div className="grid gap-1">
                                                    <Label htmlFor="jam_ambil" className="text-[11px] text-muted-foreground">
                                                        Jam / Waktu Ambil
                                                    </Label>
                                                    <Input
                                                        id="jam_ambil"
                                                        value={data.jam_ambil}
                                                        onChange={(e) => setData('jam_ambil', e.target.value)}
                                                        placeholder="cth: 14:00"
                                                        className="h-8 text-xs bg-background"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid gap-1">
                                                <Label className="text-[11px] text-muted-foreground">Metode Penyerahan Buket:</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setData('tipe_pengiriman', 'pickup')}
                                                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-medium ${
                                                            data.tipe_pengiriman === 'pickup'
                                                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                                                : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                                        }`}
                                                    >
                                                        <Store className="h-3.5 w-3.5" />
                                                        Ambil di Toko
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setData('tipe_pengiriman', 'delivery')}
                                                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-medium ${
                                                            data.tipe_pengiriman === 'delivery'
                                                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                                                : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                                        }`}
                                                    >
                                                        <Truck className="h-3.5 w-3.5" />
                                                        Kirim Kurir
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Pelanggan */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="pelanggan" className="text-xs">
                                            Nama Pelanggan {data.jenis_pesanan === 'preorder' && <span className="text-rose-500">*</span>}
                                        </Label>
                                        <Input
                                            id="pelanggan"
                                            value={data.pelanggan}
                                            onChange={(e) => setData('pelanggan', e.target.value)}
                                            placeholder={data.jenis_pesanan === 'preorder' ? 'Wajib untuk Pre-Order (cth: Kak Amanda)' : 'Pelanggan Langsung (Walk-in)'}
                                            className="h-9 text-xs focus-visible:ring-rose-500"
                                            required={data.jenis_pesanan === 'preorder'}
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
                                            placeholder="08123456789 (untuk konfirmasi buket siap)"
                                            className="h-9 text-xs focus-visible:ring-rose-500"
                                        />
                                    </div>

                                    {/* Status Pembayaran */}
                                    <div className="grid gap-1.5 pt-1">
                                        <Label className="text-xs font-semibold">Status Pembayaran Saat Ini</Label>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setData('status_bayar', 'lunas')}
                                                className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition-all ${
                                                    data.status_bayar === 'lunas'
                                                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                                                        : 'border-border/70 hover:border-emerald-300 text-muted-foreground'
                                                }`}
                                            >
                                                Lunas Penuh
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData('status_bayar', 'dp');
                                                    if (!data.nominal_dp || data.nominal_dp <= 0) {
                                                        setData('nominal_dp', Math.round(grandTotals.totalHarga * 0.5));
                                                    }
                                                }}
                                                className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition-all ${
                                                    data.status_bayar === 'dp'
                                                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                                        : 'border-border/70 hover:border-amber-300 text-muted-foreground'
                                                }`}
                                            >
                                                Uang Muka (DP)
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData('status_bayar', 'belum');
                                                    setData('nominal_dp', 0);
                                                }}
                                                className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition-all ${
                                                    data.status_bayar === 'belum'
                                                        ? 'bg-slate-700 text-white border-slate-800 shadow-sm'
                                                        : 'border-border/70 hover:border-slate-400 text-muted-foreground'
                                                }`}
                                            >
                                                Belum Bayar
                                            </button>
                                        </div>
                                    </div>

                                    {/* KONDISI 1: LUNAS */}
                                    {data.status_bayar === 'lunas' && (
                                        <div className="space-y-3 p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="metode" className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
                                                    Metode Pembayaran Lunas:
                                                </Label>
                                                <select
                                                    id="metode"
                                                    value={data.metode}
                                                    onChange={(e) => setData('metode', e.target.value as any)}
                                                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:ring-1 focus-visible:ring-emerald-500"
                                                >
                                                    <option value="tunai">Tunai / Cash</option>
                                                    <option value="transfer">Transfer Bank / QRIS</option>
                                                    <option value="lainnya">Lainnya / EDC / Debit</option>
                                                </select>
                                            </div>

                                            {data.metode === 'tunai' && (
                                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/50">
                                                    <div className="grid gap-1">
                                                        <Label className="text-[11px] text-muted-foreground">Uang Diterima:</Label>
                                                        <Input
                                                            type="number"
                                                            value={cashReceived}
                                                            onChange={(e) => setCashReceived(e.target.value ? parseInt(e.target.value) : '')}
                                                            placeholder={String(grandTotals.totalHarga)}
                                                            className="h-8 text-xs font-mono"
                                                        />
                                                    </div>
                                                    <div className="grid gap-1">
                                                        <Label className="text-[11px] text-muted-foreground">Kembalian:</Label>
                                                        <div className="h-8 px-2 flex items-center font-mono font-bold text-xs rounded bg-muted/60 text-foreground">
                                                            {formatRupiah(cashChange)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* KONDISI 2: DP */}
                                    {data.status_bayar === 'dp' && (
                                        <div className="space-y-3 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800">
                                            <div className="grid gap-1.5">
                                                <div className="flex justify-between items-center">
                                                    <Label htmlFor="nominal_dp" className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                                        Nominal Uang Muka (DP):
                                                    </Label>
                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setData('nominal_dp', Math.round(grandTotals.totalHarga * 0.3))}
                                                            className="text-[10px] bg-background border px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground"
                                                        >
                                                            30%
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setData('nominal_dp', Math.round(grandTotals.totalHarga * 0.5))}
                                                            className="text-[10px] bg-background border px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground"
                                                        >
                                                            50%
                                                        </button>
                                                    </div>
                                                </div>
                                                <Input
                                                    id="nominal_dp"
                                                    type="number"
                                                    min="1"
                                                    max={grandTotals.totalHarga}
                                                    value={data.nominal_dp}
                                                    onChange={(e) => setData('nominal_dp', parseInt(e.target.value) || 0)}
                                                    className="h-9 text-sm font-bold font-mono bg-background"
                                                    placeholder="Masukkan nominal DP..."
                                                    required
                                                />
                                            </div>

                                            <div className="grid gap-1.5">
                                                <Label htmlFor="metode_dp" className="text-xs font-medium text-amber-900 dark:text-amber-200">
                                                    Metode Pembayaran DP:
                                                </Label>
                                                <select
                                                    id="metode_dp"
                                                    value={data.metode}
                                                    onChange={(e) => setData('metode', e.target.value as any)}
                                                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:ring-1 focus-visible:ring-amber-500"
                                                >
                                                    <option value="transfer">Transfer Bank / QRIS</option>
                                                    <option value="tunai">Tunai / Cash</option>
                                                    <option value="lainnya">Lainnya / EDC</option>
                                                </select>
                                            </div>

                                            <div className="p-2.5 rounded-lg bg-background border border-amber-200 dark:border-amber-900 text-xs space-y-1">
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>DP Masuk Hari Ini:</span>
                                                    <span className="font-mono font-semibold text-emerald-600">
                                                        {formatRupiah(Number(data.nominal_dp || 0))}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between font-bold text-amber-700 dark:text-amber-300 pt-1 border-t">
                                                    <span>Sisa Piutang (Dilunasi Nanti):</span>
                                                    <span className="font-mono">
                                                        {formatRupiah(Math.max(0, grandTotals.totalHarga - Number(data.nominal_dp || 0)))}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
                                                💡 Pelunasan sisa tagihan dapat dicatat saat buket diambil/diantar melalui tombol <strong>"💳 Lunasi"</strong> di menu Kasir.
                                            </div>
                                        </div>
                                    )}

                                    {/* KONDISI 3: BELUM BAYAR (PIUTANG PENUH) */}
                                    {data.status_bayar === 'belum' && (
                                        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                                            <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                                                <Clock className="h-4 w-4 text-slate-500" />
                                                Pesanan Belum Bayar (Piutang Penuh)
                                            </div>
                                            <p className="text-[11px] leading-relaxed">
                                                Belum ada uang yang diterima hari ini. Total tagihan sebesar <strong className="font-mono text-rose-600 dark:text-rose-400">{formatRupiah(grandTotals.totalHarga)}</strong> akan dicatat sebagai piutang.
                                            </p>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                Metode pembayaran tidak perlu diisi sekarang dan dapat dipilih saat pelanggan melunasi tagihan saat buket diambil.
                                            </p>
                                        </div>
                                    )}

                                    {/* Catatan / Pesan Ucapan */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="catatan" className="text-xs">
                                            Catatan / Pesan Kartu Ucapan Buket
                                        </Label>
                                        <textarea
                                            id="catatan"
                                            rows={2}
                                            value={data.catatan}
                                            onChange={(e) => setData('catatan', e.target.value)}
                                            placeholder="Contoh: Happy Graduation Amanda, instruksi warna pita..."
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus-visible:ring-1 focus-visible:ring-rose-500"
                                        />
                                    </div>

                                    {/* Live Financial Summary */}
                                    <div className="pt-3 border-t border-border/80 space-y-1.5 text-xs">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Subtotal Rangkaian ({data.lines.length} buket):</span>
                                            <span className="font-mono font-medium text-foreground">{formatRupiah(grandTotals.totalBouquetHarga)}</span>
                                        </div>
                                        {grandTotals.totalFees > 0 && (
                                            <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                                                <span>Total Biaya Jasa ({data.fees.length} layanan):</span>
                                                <span className="font-mono font-bold">+{formatRupiah(grandTotals.totalFees)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-muted-foreground pt-1">
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
                                            <span className="text-foreground">Total Tagihan:</span>
                                            <span className="text-xl font-extrabold font-mono text-rose-600">
                                                {formatRupiah(grandTotals.totalHarga)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Context-Aware Submit Buttons */}
                                    {data.status_bayar === 'lunas' && (
                                        <Button
                                            type="submit"
                                            disabled={processing || grandTotals.totalHarga <= 0}
                                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-5 shadow-lg shadow-emerald-600/25 mt-2"
                                        >
                                            <CheckCircle2 className="h-5 w-5 mr-2" />
                                            {processing ? 'Memproses Transaksi...' : `Bayar Lunas ${formatRupiah(grandTotals.totalHarga)}`}
                                        </Button>
                                    )}

                                    {data.status_bayar === 'dp' && (
                                        <Button
                                            type="submit"
                                            disabled={processing || grandTotals.totalHarga <= 0 || !data.nominal_dp}
                                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-5 shadow-lg shadow-amber-500/25 mt-2"
                                        >
                                            <Receipt className="h-5 w-5 mr-2" />
                                            {processing
                                                ? 'Menyimpan Pesanan...'
                                                : `Simpan Pesanan & Catat DP ${formatRupiah(Number(data.nominal_dp || 0))}`}
                                        </Button>
                                    )}

                                    {data.status_bayar === 'belum' && (
                                        <Button
                                            type="submit"
                                            disabled={processing || grandTotals.totalHarga <= 0}
                                            className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white font-bold py-5 shadow-lg shadow-slate-900/25 mt-2"
                                        >
                                            <Clock className="h-5 w-5 mr-2" />
                                            {processing ? 'Menyimpan Pesanan...' : 'Simpan Pesanan (Belum Bayar / Piutang)'}
                                        </Button>
                                    )}
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
