import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Edit3,
    Eye,
    Filter,
    Layers,
    PackagePlus,
    Search,
    Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

interface ItemRow {
    id: number;
    nama: string;
    tipe: 'bunga_hidup' | 'bunga_artifisial' | 'pelengkap' | 'aset';
    kategori?: string | null;
    satuan: string;
    stok_saat_ini: number;
    hpp_rata_rata: number;
    stok_min: number;
    nilai_persediaan: number;
    is_low_stock: boolean;
    foto_url?: string | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface ItemsIndexProps {
    items: PaginatedData<ItemRow>;
    filters: {
        search?: string;
        tipe?: string;
        stok_menipis?: boolean;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master Bahan & Stok',
        href: '/items',
    },
];

const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
};

const getTipeBadge = (tipe: string) => {
    switch (tipe) {
        case 'bunga_hidup':
            return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">Bunga Hidup</Badge>;
        case 'bunga_artifisial':
            return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30">Artifisial</Badge>;
        case 'pelengkap':
            return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">Pelengkap</Badge>;
        case 'aset':
            return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30">Aset</Badge>;
        default:
            return <Badge variant="outline">{tipe}</Badge>;
    }
};

export default function ItemsIndex({ items, filters }: ItemsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [tipe, setTipe] = useState(filters.tipe || '');
    const [stokMenipis, setStokMenipis] = useState(filters.stok_menipis || false);

    const handleFilter = (newFilters: { search?: string; tipe?: string; stok_menipis?: boolean }) => {
        router.get(
            '/items',
            {
                search: newFilters.search !== undefined ? newFilters.search : search,
                tipe: newFilters.tipe !== undefined ? newFilters.tipe : tipe,
                stok_menipis: newFilters.stok_menipis !== undefined ? (newFilters.stok_menipis ? '1' : '') : (stokMenipis ? '1' : ''),
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleDelete = (id: number, nama: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus atau menonaktifkan item "${nama}"?`)) {
            router.delete(`/items/${id}`);
        }
    };

    return (
        <>
            <Head title="Master Bahan & Stok - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Layers className="h-6 w-6 text-rose-500" />
                            Katalog Bahan Baku & Stok
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola data bunga, kain pembungkus, pita, vas, dan pantau Moving Average HPP
                        </p>
                    </div>
                    <Button
                        asChild
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20"
                    >
                        <Link href="/items/create">
                            <PackagePlus className="w-4 h-4 mr-2" />
                            Tambah Bahan Baru
                        </Link>
                    </Button>
                </div>

                {/* Filter and Search Bar */}
                <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <div className="sm:col-span-6 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleFilter({ search });
                                        }
                                    }}
                                    placeholder="Cari nama bahan, kategori, atau satuan..."
                                    className="pl-9 focus-visible:ring-rose-500"
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <select
                                    value={tipe}
                                    onChange={(e) => {
                                        setTipe(e.target.value);
                                        handleFilter({ tipe: e.target.value });
                                    }}
                                    aria-label="Filter berdasarkan tipe bahan"
                                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                                >
                                    <option value="">Semua Tipe Bahan</option>
                                    <option value="bunga_hidup">Bunga Hidup</option>
                                    <option value="bunga_artifisial">Bunga Artifisial</option>
                                    <option value="pelengkap">Pelengkap (Kertas, Pita, dll)</option>
                                    <option value="aset">Aset / Perlengkapan</option>
                                </select>
                            </div>

                            <div className="sm:col-span-3 flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant={stokMenipis ? 'destructive' : 'outline'}
                                    onClick={() => {
                                        const next = !stokMenipis;
                                        setStokMenipis(next);
                                        handleFilter({ stok_menipis: next });
                                    }}
                                    className="w-full text-xs font-medium"
                                >
                                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                                    {stokMenipis ? 'Tampilkan Semua' : 'Stok Menipis'}
                                </Button>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => handleFilter({ search })}
                                    className="px-3"
                                >
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Table */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[750px]">
                            <thead className="text-xs uppercase bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Nama Bahan</th>
                                    <th className="px-4 py-3">Tipe</th>
                                    <th className="px-4 py-3 text-right">Stok Fisik</th>
                                    <th className="px-4 py-3 text-right">Min. Stok</th>
                                    <th className="px-4 py-3 text-right">HPP Rata-Rata</th>
                                    <th className="px-4 py-3 text-right">Total Nilai</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {items.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                            Tidak ada bahan ditemukan. Klik tombol "Tambah Bahan Baru" untuk memulai.
                                        </td>
                                    </tr>
                                ) : (
                                    items.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3.5 font-medium text-foreground">
                                                <div className="flex items-center gap-3">
                                                    {item.foto_url ? (
                                                        <img
                                                            src={item.foto_url}
                                                            alt={item.nama}
                                                            className="w-9 h-9 rounded-lg object-cover border"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-800/50 flex items-center justify-center text-rose-500 font-bold text-xs">
                                                            {item.nama.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-foreground">{item.nama}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {item.kategori || 'Tanpa Kategori'} • {item.satuan}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">{getTipeBadge(item.tipe)}</td>
                                            <td className="px-4 py-3.5 text-right font-semibold">
                                                <span className={item.is_low_stock ? 'text-rose-600 font-bold' : ''}>
                                                    {item.stok_saat_ini} {item.satuan}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-muted-foreground">
                                                {item.stok_min} {item.satuan}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono">
                                                {formatRupiah(item.hpp_rata_rata)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-medium text-foreground">
                                                {formatRupiah(item.nilai_persediaan)}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {item.is_low_stock ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                                                        Menipis
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                                                        Aman
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                                        title="Kartu Stok & Riwayat"
                                                    >
                                                        <Link href={`/items/${item.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                                        title="Edit Data Bahan"
                                                    >
                                                        <Link href={`/items/${item.id}/edit`}>
                                                            <Edit3 className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(item.id, item.nama)}
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                        title="Hapus / Nonaktifkan"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {items.last_page > 1 && (
                        <div className="p-4 border-t border-border flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Menampilkan {items.data.length} dari {items.total} bahan
                            </span>
                            <div className="flex items-center gap-1">
                                {items.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        asChild={!!link.url}
                                        disabled={!link.url}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 text-xs"
                                    >
                                        {link.url ? (
                                            <Link
                                                href={link.url}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </>
    );
}

ItemsIndex.layout = {
    breadcrumbs,
};
