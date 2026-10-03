import { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Edit3,
    Package,
    Plus,
    Save,
    Trash2,
    Truck,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { BreadcrumbItem } from '@/types';

interface SupplierOption {
    id: number;
    nama: string;
    platform?: string | null;
}

interface ItemOption {
    id: number;
    nama: string;
    tipe: string;
    satuan: string;
    stok_saat_ini: number;
    hpp_rata_rata: number;
}

interface PurchaseItemInput {
    id?: number;
    item_id: number;
    qty: number;
    harga_satuan: number;
    satuan_input?: string;
    qty_per_satuan?: number;
}

interface PurchaseData {
    id: number;
    tanggal: string;
    supplier_id?: number | null;
    no_pesanan?: string | null;
    ongkir: number;
    diskon: number;
    biaya_lain: number;
    catatan?: string | null;
    items: {
        id: number;
        item_id: number;
        qty: number;
        harga_satuan: number;
        item: ItemOption;
    }[];
}

interface PurchasesEditProps {
    purchase: PurchaseData;
    suppliers: SupplierOption[];
    items: ItemOption[];
}

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

export default function PurchasesEdit({ purchase, suppliers, items }: PurchasesEditProps) {
    const itemsMap = useMemo(() => {
        const map = new Map<number, ItemOption>();
        items.forEach((item) => map.set(item.id, item));
        return map;
    }, [items]);

    const itemSelectOptions = useMemo(() => {
        return items.map((it) => ({
            value: it.id,
            label: it.nama,
            sublabel: `Stok: ${formatQty(it.stok_saat_ini)} ${it.satuan} • HPP: ${formatRupiah(it.hpp_rata_rata)}`,
            badge: it.tipe === 'bunga_segar' ? 'Segar' : it.tipe === 'bunga_artificial' ? 'Artificial' : it.tipe === 'wrapping' ? 'Kertas' : it.tipe === 'pita' ? 'Pita' : it.tipe,
        }));
    }, [items]);

    const supplierSelectOptions = useMemo(() => {
        return [
            { value: '', label: 'Pilih Supplier...' },
            ...suppliers.map((s) => ({
                value: s.id,
                label: s.nama,
                sublabel: s.platform ? `Platform: ${s.platform}` : undefined,
            })),
        ];
    }, [suppliers]);

    const { data, setData, put, processing, errors } = useForm({
        tanggal: purchase.tanggal.substring(0, 10),
        supplier_id: purchase.supplier_id || '',
        no_pesanan: purchase.no_pesanan || '',
        ongkir: purchase.ongkir || 0,
        diskon: purchase.diskon || 0,
        biaya_lain: purchase.biaya_lain || 0,
        catatan: purchase.catatan || '',
        items: purchase.items.map((it) => ({
            item_id: it.item_id,
            qty: Number(it.qty),
            harga_satuan: it.harga_satuan,
            satuan_input: '',
            qty_per_satuan: 1,
        })) as PurchaseItemInput[],
    });

    const totalBarang = useMemo(() => {
        return data.items.reduce((sum, it) => sum + (Number(it.qty || 0) * Number(it.harga_satuan || 0)), 0);
    }, [data.items]);

    const netBiayaTambahan = useMemo(() => {
        return Number(data.ongkir || 0) + Number(data.biaya_lain || 0) - Number(data.diskon || 0);
    }, [data.ongkir, data.biaya_lain, data.diskon]);

    const totalFaktur = useMemo(() => {
        return Math.max(0, totalBarang + netBiayaTambahan);
    }, [totalBarang, netBiayaTambahan]);

    const addItemRow = () => {
        setData('items', [
            ...data.items,
            {
                item_id: items[0]?.id || 0,
                qty: 1,
                harga_satuan: 0,
                satuan_input: '',
                qty_per_satuan: 1,
            },
        ]);
    };

    const removeItemRow = (index: number) => {
        if (data.items.length <= 1) return;
        setData('items', data.items.filter((_, idx) => idx !== index));
    };

    const updateItem = (index: number, field: keyof PurchaseItemInput, value: any) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData('items', newItems);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/purchases/${purchase.id}`);
    };

    return (
        <>
            <Head title={`Edit Faktur PO-${purchase.id} - KIYOMI STOCK`} />

            <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Link href={`/purchases/${purchase.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Edit3 className="h-6 w-6 text-rose-500" />
                            Edit Draft Faktur Pembelian PO-{purchase.id}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Perubahan pada draf faktur sebelum barang diterima secara fisik di toko
                        </p>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT: Items Table (8 cols) */}
                        <div className="lg:col-span-8 space-y-6">
                            <Card className="border-border/60 shadow-sm">
                                <CardHeader className="pb-3 border-b border-border/50">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                            <Package className="h-4 w-4 text-rose-500" />
                                            Daftar Bahan Baku
                                        </CardTitle>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addItemRow}
                                            className="h-8 text-xs text-rose-600 border-rose-200"
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                            Tambah Baris
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left min-w-[620px]">
                                            <thead className="bg-muted/40 uppercase font-semibold text-muted-foreground border-b">
                                                <tr>
                                                    <th className="py-2.5 px-3">Bahan</th>
                                                    <th className="py-2.5 px-3 w-28 text-center">Jumlah (Qty)</th>
                                                    <th className="py-2.5 px-3 w-36 text-right">Harga Beli Satuan (Rp)</th>
                                                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                                                    <th className="py-2.5 px-2 text-center w-8"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {data.items.map((row, idx) => {
                                                    const currentItem = itemsMap.get(row.item_id);
                                                    const subtotal = Number(row.qty || 0) * Number(row.harga_satuan || 0);

                                                    return (
                                                        <tr key={idx} className="hover:bg-muted/20">
                                                            <td className="py-2.5 px-3 min-w-[240px]">
                                                                <SearchableSelect
                                                                    size="sm"
                                                                    value={row.item_id}
                                                                    onChange={(val) => updateItem(idx, 'item_id', Number(val))}
                                                                    options={itemSelectOptions}
                                                                    placeholder="Pilih Bahan..."
                                                                    searchPlaceholder="Cari bahan..."
                                                                />
                                                            </td>
                                                            <td className="py-2.5 px-3 text-center">
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
                                                                        {currentItem?.satuan}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right">
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    value={row.harga_satuan}
                                                                    onChange={(e) => updateItem(idx, 'harga_satuan', parseInt(e.target.value) || 0)}
                                                                    className="h-8 text-right font-mono text-xs"
                                                                    required
                                                                />
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                                                                {formatRupiah(subtotal)}
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

                                    <div className="p-3 border-t bg-muted/20 flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Total Nilai Barang ({data.items.length} item):</span>
                                        <span className="font-mono font-bold text-sm text-foreground">{formatRupiah(totalBarang)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid gap-2">
                                <Label htmlFor="catatan" className="text-xs">Catatan Pembelian</Label>
                                <textarea
                                    id="catatan"
                                    rows={2}
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus-visible:ring-1 focus-visible:ring-rose-500"
                                />
                            </div>
                        </div>

                        {/* RIGHT: Supplier & Expenses (4 cols) */}
                        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
                            <Card className="border-border/70 shadow-sm">
                                <CardHeader className="bg-muted/30 border-b border-border/50 pb-3">
                                    <CardTitle className="text-sm font-semibold">Informasi Faktur & Supplier</CardTitle>
                                </CardHeader>

                                <CardContent className="p-4 space-y-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="tanggal" className="text-xs">Tanggal Pembelian</Label>
                                        <Input
                                            id="tanggal"
                                            type="date"
                                            value={data.tanggal}
                                            onChange={(e) => setData('tanggal', e.target.value)}
                                            className="h-8 text-xs focus-visible:ring-rose-500"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="supplier" className="text-xs">Supplier</Label>
                                        <SearchableSelect
                                            size="sm"
                                            value={data.supplier_id}
                                            onChange={(val) => setData('supplier_id', val ? Number(val) : '')}
                                            options={supplierSelectOptions}
                                            placeholder="Pilih Supplier..."
                                            searchPlaceholder="Cari nama supplier..."
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="no_pesanan" className="text-xs">No. Faktur / Resi</Label>
                                        <Input
                                            id="no_pesanan"
                                            value={data.no_pesanan}
                                            onChange={(e) => setData('no_pesanan', e.target.value)}
                                            className="h-8 text-xs focus-visible:ring-rose-500"
                                        />
                                    </div>

                                    <div className="pt-2 border-t space-y-3">
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">
                                            Penyesuaian Biaya Ekspedisi (Cargo):
                                        </div>

                                        <div className="grid gap-1">
                                            <Label htmlFor="ongkir" className="text-xs text-muted-foreground">Ongkos Kirim (Rp):</Label>
                                            <Input
                                                id="ongkir"
                                                type="number"
                                                min="0"
                                                value={data.ongkir}
                                                onChange={(e) => setData('ongkir', parseInt(e.target.value) || 0)}
                                                className="h-8 text-xs font-mono"
                                            />
                                        </div>

                                        <div className="grid gap-1">
                                            <Label htmlFor="diskon" className="text-xs text-muted-foreground">Diskon Supplier (Rp):</Label>
                                            <Input
                                                id="diskon"
                                                type="number"
                                                min="0"
                                                value={data.diskon}
                                                onChange={(e) => setData('diskon', parseInt(e.target.value) || 0)}
                                                className="h-8 text-xs font-mono text-emerald-600"
                                            />
                                        </div>

                                        <div className="grid gap-1">
                                            <Label htmlFor="biaya_lain" className="text-xs text-muted-foreground">Biaya Lain (Rp):</Label>
                                            <Input
                                                id="biaya_lain"
                                                type="number"
                                                min="0"
                                                value={data.biaya_lain}
                                                onChange={(e) => setData('biaya_lain', parseInt(e.target.value) || 0)}
                                                className="h-8 text-xs font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t space-y-1.5 text-xs">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Total Barang:</span>
                                            <span className="font-mono">{formatRupiah(totalBarang)}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Ongkir Bersih:</span>
                                            <span className="font-mono">{formatRupiah(netBiayaTambahan)}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline pt-2 border-t text-sm font-bold">
                                            <span className="text-foreground">Total Tagihan Faktur:</span>
                                            <span className="text-lg font-extrabold font-mono text-rose-600">
                                                {formatRupiah(totalFaktur)}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing || totalBarang <= 0}
                                        className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold py-5 shadow-md shadow-rose-500/20"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {processing ? 'Menyimpan...' : 'Perbarui Faktur Pembelian'}
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

PurchasesEdit.layout = {
    breadcrumbs: [
        {
            title: 'Pembelian & Kulakan',
            href: '/purchases',
        },
        {
            title: 'Edit Faktur',
            href: '#',
        },
    ],
};
