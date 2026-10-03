import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Armchair,
    Edit3,
    Eye,
    PlusCircle,
    Search,
    Trash2,
    Wrench,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

interface AssetRow {
    id: number;
    nama: string;
    jumlah: number;
    kondisi: 'baik' | 'rusak' | 'hilang';
    tanggal_beli?: string | null;
    harga_beli?: number | null;
    lokasi?: string | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface AssetsIndexProps {
    assets: PaginatedData<AssetRow>;
    filters: {
        search?: string;
        kondisi?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Aset & Alat Kerja',
        href: '/assets',
    },
];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

const getKondisiBadge = (kondisi: string) => {
    switch (kondisi) {
        case 'baik':
            return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">Kondisi Baik</Badge>;
        case 'rusak':
            return <Badge variant="destructive">Perlu Perbaikan / Rusak</Badge>;
        case 'hilang':
            return <Badge className="bg-neutral-500/15 text-neutral-600 border-neutral-400">Hilang</Badge>;
        default:
            return <Badge variant="outline">{kondisi}</Badge>;
    }
};

export default function AssetsIndex({ assets, filters }: AssetsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [kondisi, setKondisi] = useState(filters.kondisi || '');

    const handleFilter = () => {
        router.get('/assets', { search, kondisi }, { preserveState: true, preserveScroll: true });
    };

    const handleDelete = (id: number, nama: string) => {
        if (confirm(`Hapus data aset "${nama}"?`)) {
            router.delete(`/assets/${id}`);
        }
    };

    return (
        <>
            <Head title="Aset & Alat Kerja Toko - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Wrench className="h-6 w-6 text-rose-500" />
                            Inventaris Aset & Alat Kerja Toko
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Pencatatan gunting florist, lem tembak, rak pajang buket, dan peralatan operasional
                        </p>
                    </div>
                    <Button
                        asChild
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20"
                    >
                        <Link href="/assets/create">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Tambah Aset Baru
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <div className="sm:col-span-6 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                    placeholder="Cari nama alat / aset atau lokasi..."
                                    className="pl-9 focus-visible:ring-rose-500"
                                />
                            </div>

                            <div className="sm:col-span-4">
                                <select
                                    value={kondisi}
                                    onChange={(e) => {
                                        setKondisi(e.target.value);
                                        router.get(
                                            '/assets',
                                            { search, kondisi: e.target.value },
                                            { preserveState: true, preserveScroll: true }
                                        );
                                    }}
                                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-rose-500"
                                >
                                    <option value="">Semua Kondisi Fisik</option>
                                    <option value="baik">Kondisi Baik</option>
                                    <option value="rusak">Rusak / Servis</option>
                                    <option value="hilang">Hilang</option>
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <Button
                                    type="button"
                                    onClick={handleFilter}
                                    className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                                    size="sm"
                                >
                                    Filter
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[650px]">
                            <thead className="text-xs uppercase bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Nama Alat / Aset</th>
                                    <th className="px-4 py-3 text-center">Jumlah Unit</th>
                                    <th className="px-4 py-3">Kondisi</th>
                                    <th className="px-4 py-3">Lokasi Penyimpanan</th>
                                    <th className="px-4 py-3 text-right">Harga Beli Awal</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {assets.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                            Belum ada data aset kerja. Klik "Tambah Aset Baru" untuk mendaftar.
                                        </td>
                                    </tr>
                                ) : (
                                    assets.data.map((asset) => (
                                        <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3.5 font-bold text-foreground">
                                                {asset.nama}
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-bold">
                                                {asset.jumlah} unit
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {getKondisiBadge(asset.kondisi)}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-muted-foreground">
                                                {asset.lokasi || 'Toko Utama'}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono text-xs">
                                                {asset.harga_beli ? formatRupiah(asset.harga_beli) : '-'}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                        <Link href={`/assets/${asset.id}`}>
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                        <Link href={`/assets/${asset.id}/edit`}>
                                                            <Edit3 className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(asset.id, asset.nama)}
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {assets.last_page > 1 && (
                        <div className="p-4 border-t border-border flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Menampilkan {assets.data.length} dari {assets.total} aset
                            </span>
                            <div className="flex items-center gap-1">
                                {assets.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        asChild={!!link.url}
                                        disabled={!link.url}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 text-xs"
                                    >
                                        {link.url ? (
                                            <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
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

AssetsIndex.layout = {
    breadcrumbs,
};
