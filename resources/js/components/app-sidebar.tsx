import { Link } from '@inertiajs/react';
import {
    Archive,
    BarChart3,
    Box,
    LayoutGrid,
    Package,
    Settings,
    ShoppingCart,
    Store,
    Tag,
    Truck,
    Wrench,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { useCurrentUrl } from '@/hooks/use-current-url';

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
}

const transactionItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard.url(), icon: LayoutGrid },
    { title: 'POS / Transaksi Baru', href: '/sales/create', icon: ShoppingCart },
    { title: 'Riwayat Penjualan', href: '/sales', icon: Box },
    { title: 'Pembelian Stok', href: '/purchases', icon: Truck },
];

const stockItems: NavItem[] = [
    { title: 'Master Item', href: '/items', icon: Package },
    { title: 'Waste & Adjustment', href: '/stock/adjustments', icon: Archive },
    { title: 'Template Buket', href: '/templates', icon: Tag },
    { title: 'Supplier', href: '/suppliers', icon: Store },
    { title: 'Aset', href: '/assets', icon: Wrench },
];

const reportItems: NavItem[] = [
    { title: 'Laporan Penjualan', href: '/reports/sales', icon: BarChart3 },
    { title: 'Kartu Stok', href: '/reports/stock', icon: Package },
    { title: 'Nilai Persediaan', href: '/reports/inventory', icon: Box },
    { title: 'Waste & Loss', href: '/reports/waste', icon: Archive },
];

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {label}
            </SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="data-[active=true]:bg-rose-50 data-[active=true]:text-rose-600 dark:data-[active=true]:bg-rose-900/20 dark:data-[active=true]:text-rose-400"
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-rose-50/50 dark:hover:bg-rose-900/10">
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-0">
                <NavGroup label="Operasional" items={transactionItems} />
                <NavGroup label="Stok & Master" items={stockItems} />
                <NavGroup label="Laporan" items={reportItems} />

                {/* Settings link */}
                <SidebarGroup className="px-2 py-0 mt-auto">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                tooltip={{ children: 'Pengaturan' }}
                            >
                                <Link href="/settings/business" prefetch>
                                    <Settings />
                                    <span>Pengaturan</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
