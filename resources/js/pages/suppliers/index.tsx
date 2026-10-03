import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Edit3,
    ExternalLink,
    Eye,
    PlusCircle,
    Search,
    Store,
    Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

interface SupplierRow {
    id: number;
    nama: string;
    platform: 'shopee' | 'tokopedia' | 'offline' | 'lainnya';
    kontak?: string | null;
    link?: string | null;
    purchases_count: number;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface SuppliersIndexProps {
    suppliers: PaginatedData<SupplierRow>;
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Supplier & Pemasok',
        href: '/suppliers',
    },
];

const getPlatformBadge = (platform: string) => {
    switch (platform) {
        case 'shopee':
            return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30">Shopee</Badge>;
        case 'tokopedia':
            return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">Tokopedia</Badge>;
        case 'offline':
            return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30">Toko Fisik / Kebun</Badge>;
        default:
            return <Badge variant="outline">{platform}</Badge>;
    }
};

export default function SuppliersIndex({ suppliers, filters }: SuppliersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = () => {
        router.get('/suppliers', { search }, { preserveState: true, preserveScroll: true });
    };

    const handleDelete = (id: number, nama: string) => {
        if (confirm(`Hapus atau nonaktifkan supplier "${nama}"?`)) {
            router.delete(`/suppliers/${id}`);
        }
    };

    return (
        <>
            <Head title="Supplier & Pemasok - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Store className="h-6 w-6 text-rose-500" />
                            Daftar Supplier & Pemasok Bunga
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola kontak kebun bunga, distributor wrapping, dan toko online langganan
                        </p>
                    </div>
                    <Button
                        asChild
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20"
                    >
                        <Link href="/suppliers/create">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Tambah Supplier Baru
                        </Link>
                    </Button>
                </div>

                {/* Search */}
                <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-4">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Cari nama supplier atau platform..."
                                className="pl-9 focus-visible:ring-rose-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[650px]">
                            <thead className="text-xs uppercase bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Nama Supplier</th>
                                    <th className="px-4 py-3">Platform</th>
                                    <th className="px-4 py-3">Kontak / WhatsApp</th>
                                    <th className="px-4 py-3">Link Toko Online</th>
                                    <th className="px-4 py-3 text-center">Faktur Pembelian</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {suppliers.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                            Belum ada data supplier. Klik "Tambah Supplier Baru" untuk mendaftar.
                                        </td>
                                    </tr>
                                ) : (
                                    suppliers.data.map((s) => (
                                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3.5 font-bold text-foreground">
                                                {s.nama}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {getPlatformBadge(s.platform)}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-muted-foreground">
                                                {s.kontak || '-'}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs">
                                                {s.link ? (
                                                    <a
                                                        href={s.link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-rose-600 hover:underline max-w-[200px] truncate"
                                                    >
                                                        Buka Toko
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-semibold text-xs">
                                                {s.purchases_count} transaksi
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                        <Link href={`/suppliers/${s.id}`}>
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                        <Link href={`/suppliers/${s.id}/edit`}>
                                                            <Edit3 className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(s.id, s.nama)}
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

                    {suppliers.last_page > 1 && (
                        <div className="p-4 border-t border-border flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Menampilkan {suppliers.data.length} dari {suppliers.total} supplier
                            </span>
                            <div className="flex items-center gap-1">
                                {suppliers.links.map((link, idx) => (
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

SuppliersIndex.layout = {
    breadcrumbs,
};
