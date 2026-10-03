import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Edit3,
    Eye,
    Flower2,
    Layers,
    PlusCircle,
    Search,
    Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

interface TemplateRow {
    id: number;
    nama: string;
    harga_default: number;
    foto_url?: string | null;
    template_items_count: number;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface TemplatesIndexProps {
    templates: PaginatedData<TemplateRow>;
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Resep Buket & Rangkaian',
        href: '/templates',
    },
];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export default function TemplatesIndex({ templates, filters }: TemplatesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = () => {
        router.get('/templates', { search }, { preserveState: true, preserveScroll: true });
    };

    const handleDelete = (id: number, nama: string) => {
        if (confirm(`Nonaktifkan resep template buket "${nama}"?`)) {
            router.delete(`/templates/${id}`);
        }
    };

    return (
        <>
            <Head title="Resep Buket & Rangkaian - KIYOMI STOCK" />

            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Flower2 className="h-6 w-6 text-rose-500" />
                            Katalog Resep Buket & Rangkaian (BOM)
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Formula komposisi bunga, kertas wrapping, dan pita standar untuk mempercepat kasir kasir
                        </p>
                    </div>
                    <Button
                        asChild
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20"
                    >
                        <Link href="/templates/create">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Buat Resep Baru
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
                                placeholder="Cari nama buket (cth: Buket Wisuda, Buket Mawar 10)..."
                                className="pl-9 focus-visible:ring-rose-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {templates.data.length === 0 ? (
                        <div className="col-span-full p-12 text-center text-muted-foreground bg-card border rounded-2xl">
                            Belum ada resep buket yang tersimpan. Klik tombol "Buat Resep Baru" di atas.
                        </div>
                    ) : (
                        templates.data.map((template) => (
                            <Card key={template.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
                                <div>
                                    <div className="h-40 bg-gradient-to-br from-rose-100/60 to-pink-100/40 dark:from-rose-950/40 dark:to-pink-950/20 flex items-center justify-center border-b border-border/50 relative">
                                        {template.foto_url ? (
                                            <img
                                                src={template.foto_url}
                                                alt={template.nama}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1.5 text-rose-500">
                                                <Flower2 className="h-10 w-10 opacity-70" />
                                                <span className="text-xs font-semibold">Resep Komposisi Florist</span>
                                            </div>
                                        )}
                                        <Badge className="absolute bottom-2.5 right-2.5 bg-background/90 text-foreground font-semibold backdrop-blur shadow-sm">
                                            {template.template_items_count} Komponen
                                        </Badge>
                                    </div>

                                    <CardContent className="p-4 space-y-2">
                                        <h3 className="font-bold text-base text-foreground line-clamp-1">
                                            {template.nama}
                                        </h3>
                                        <div className="flex items-baseline justify-between pt-1">
                                            <span className="text-xs text-muted-foreground">Harga Jual Standar:</span>
                                            <span className="font-mono font-bold text-base text-rose-600">
                                                {template.harga_default > 0 ? formatRupiah(template.harga_default) : 'Dinamis (Ikut HPP)'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </div>

                                <div className="p-4 pt-0 border-t border-border/50 mt-2 flex items-center justify-between">
                                    <Button asChild variant="ghost" size="sm" className="text-xs">
                                        <Link href={`/templates/${template.id}`}>
                                            <Eye className="h-3.5 w-3.5 mr-1" />
                                            Lihat Resep
                                        </Link>
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                            <Link href={`/templates/${template.id}/edit`}>
                                                <Edit3 className="h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(template.id, template.nama)}
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

TemplatesIndex.layout = {
    breadcrumbs,
};
