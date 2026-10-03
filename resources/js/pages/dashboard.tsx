import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    BarChart2,
    Package,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { dashboard } from '@/routes';

interface Metric {
    omzet_hari_ini: number;
    omzet_minggu_ini: number;
    omzet_bulan_ini: number;
    laba_kotor_bulan_ini: number;
    nilai_persediaan: number;
    kerugian_bulan_ini: number;
    total_piutang: number;
}

interface StokMenipisItem {
    id: number;
    nama: string;
    tipe: string;
    satuan: string;
    stok_saat_ini: number;
    stok_min: number;
}

interface PiutangItem {
    id: number;
    tanggal: string;
    pelanggan: string;
    total_harga: number;
    sisa: number;
    status_bayar: string;
}

interface TransaksiItem {
    id: number;
    tanggal: string;
    pelanggan: string;
    total_harga: number;
    total_hpp: number;
    laba_kotor: number;
    status_bayar: string;
    jumlah_buket: number;
}

interface ChartPoint {
    bulan: string;
    omzet: number;
    laba: number;
}

interface Props {
    metrics: Metric;
    stok_menipis: StokMenipisItem[];
    piutang: PiutangItem[];
    transaksi_terakhir: TransaksiItem[];
    chart_data: ChartPoint[];
    business_name: string;
}

function formatRp(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatQty(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '0';
    const num = Number(value);
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 2,
    }).format(num);
}

function MetricCard({
    label,
    value,
    icon: Icon,
    color,
    sub,
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    color: string;
    sub?: string;
}) {
    return (
        <div className="rounded-2xl border border-sidebar-border/50 bg-card p-4 sm:p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</p>
                    <p className="mt-1 text-lg sm:text-2xl font-bold text-foreground leading-tight truncate">{value}</p>
                    {sub && <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground line-clamp-1">{sub}</p>}
                </div>
                <div className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({
    metrics,
    stok_menipis,
    piutang,
    transaksi_terakhir,
    chart_data,
    business_name,
}: Props) {
    const maxOmzet = Math.max(...chart_data.map((d) => d.omzet), 1);

    return (
        <>
            <Head title={`Dashboard – ${business_name}`} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{business_name}</h1>
                        <p className="text-sm text-muted-foreground">Ringkasan performa penjualan dan inventaris toko bunga hari ini</p>
                    </div>
                    <Link
                        href="/sales/create"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95 self-start sm:self-auto"
                    >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Transaksi Baru (POS)</span>
                    </Link>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <MetricCard
                        label="Omzet Hari Ini"
                        value={formatRp(metrics.omzet_hari_ini)}
                        icon={TrendingUp}
                        color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        sub="Penjualan kasir hari ini"
                    />
                    <MetricCard
                        label="Omzet Bulan Ini"
                        value={formatRp(metrics.omzet_bulan_ini)}
                        icon={BarChart2}
                        color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        sub={`Minggu ini: ${formatRp(metrics.omzet_minggu_ini)}`}
                    />
                    <MetricCard
                        label="Laba Kotor Bulan Ini"
                        value={formatRp(metrics.laba_kotor_bulan_ini)}
                        icon={Wallet}
                        color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                        sub="Omzet dikurangi HPP bunga"
                    />
                    <MetricCard
                        label="Nilai Persediaan"
                        value={formatRp(metrics.nilai_persediaan)}
                        icon={Package}
                        color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                        sub="Total modal stok bunga & bahan"
                    />
                </div>

                {/* Secondary KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <MetricCard
                        label="Kerugian Bunga Layu & Rusak (Waste)"
                        value={formatRp(metrics.kerugian_bulan_ini)}
                        icon={TrendingDown}
                        color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        sub="Bunga busuk / koreksi opname fisik"
                    />
                    <MetricCard
                        label="Total Piutang Pelanggan"
                        value={formatRp(metrics.total_piutang)}
                        icon={AlertTriangle}
                        color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                        sub="Pesanan buket yang belum lunas"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Chart */}
                    <div className="md:col-span-2 rounded-2xl border border-sidebar-border/50 bg-card p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground mb-4">Omzet & Laba 6 Bulan Terakhir</h2>
                        <div className="flex items-end gap-2 h-32">
                            {chart_data.map((point) => {
                                const omzetH = Math.max((point.omzet / maxOmzet) * 100, 2);
                                const labaH = Math.max((point.laba / maxOmzet) * 100, 0);
                                return (
                                    <div key={point.bulan} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full flex items-end gap-0.5 h-24">
                                            <div
                                                className="flex-1 rounded-t-sm bg-blue-400/70 dark:bg-blue-500/60 transition-all"
                                                style={{ height: `${omzetH}%` }}
                                                title={`Omzet: ${formatRp(point.omzet)}`}
                                            />
                                            <div
                                                className="flex-1 rounded-t-sm bg-emerald-400/80 dark:bg-emerald-500/60 transition-all"
                                                style={{ height: `${labaH}%` }}
                                                title={`Laba: ${formatRp(point.laba)}`}
                                            />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground text-center leading-tight">{point.bulan}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-400/70 dark:bg-blue-500/60 inline-block" />Omzet</span>
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400/80 dark:bg-emerald-500/60 inline-block" />Laba Kotor</span>
                        </div>
                    </div>

                    {/* Stok Menipis */}
                    <div className="rounded-2xl border border-sidebar-border/50 bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-foreground">⚠️ Stok Menipis</h2>
                            <Link href="/items?stok_menipis=1" className="text-xs text-primary hover:underline flex items-center gap-1">
                                Lihat semua <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                        {stok_menipis.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Semua stok aman ✓</p>
                        ) : (
                            <ul className="space-y-2">
                                {stok_menipis.map((item) => (
                                    <li key={item.id} className="flex items-center justify-between text-xs">
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/items/${item.id}`} className="font-medium text-foreground hover:text-primary truncate block">
                                                {item.nama}
                                            </Link>
                                            <span className="text-muted-foreground">Min: {formatQty(item.stok_min)} {item.satuan}</span>
                                        </div>
                                        <span className={`ml-2 font-semibold shrink-0 ${Number(item.stok_saat_ini) <= 0 ? 'text-red-500' : 'text-amber-500'}`}>
                                            {formatQty(item.stok_saat_ini)} {item.satuan}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Bottom Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Transaksi Terakhir */}
                    <div className="rounded-2xl border border-sidebar-border/50 bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-foreground">Transaksi Terakhir</h2>
                            <Link href="/sales" className="text-xs text-primary hover:underline flex items-center gap-1">
                                Lihat semua <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                        {transaksi_terakhir.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Belum ada transaksi</p>
                        ) : (
                            <div className="space-y-2">
                                {transaksi_terakhir.map((t) => (
                                    <Link
                                        key={t.id}
                                        href={`/sales/${t.id}`}
                                        className="flex items-center justify-between rounded-xl p-2.5 hover:bg-muted/50 transition-colors group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-foreground truncate">{t.pelanggan}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                                    t.status_bayar === 'lunas' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    t.status_bayar === 'dp' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                    {t.status_bayar.toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">{t.tanggal} · {t.jumlah_buket} buket</span>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <div className="text-xs font-semibold text-foreground">{formatRp(t.total_harga)}</div>
                                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400">+{formatRp(t.laba_kotor)}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Piutang */}
                    <div className="rounded-2xl border border-sidebar-border/50 bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-foreground">Piutang Belum Lunas</h2>
                            <Link href="/sales?status_bayar=belum" className="text-xs text-primary hover:underline flex items-center gap-1">
                                Lihat semua <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                        {piutang.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Tidak ada piutang 🎉</p>
                        ) : (
                            <div className="space-y-2">
                                {piutang.map((p) => (
                                    <Link
                                        key={p.id}
                                        href={`/sales/${p.id}`}
                                        className="flex items-center justify-between rounded-xl p-2.5 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-medium text-foreground truncate block">{p.pelanggan}</span>
                                            <span className="text-[10px] text-muted-foreground">{p.tanggal}</span>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <div className="text-xs font-semibold text-orange-600 dark:text-orange-400">{formatRp(p.sisa)}</div>
                                            <div className="text-[10px] text-muted-foreground">dari {formatRp(p.total_harga)}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
