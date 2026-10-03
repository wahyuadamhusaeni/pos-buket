import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 p-6 dark:from-neutral-950 dark:via-rose-950/20 dark:to-neutral-950 md:p-10">
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl dark:bg-rose-900/20" />
                <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-pink-200/40 blur-3xl dark:bg-pink-900/20" />
                <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-100/30 blur-3xl dark:bg-fuchsia-900/10" />
            </div>

            <div className="relative z-10 w-full max-w-sm">
                {/* Card */}
                <div className="rounded-3xl border border-rose-100/80 bg-white/80 p-8 shadow-xl shadow-rose-900/10 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/80">
                    {/* Brand */}
                    <div className="mb-8 flex flex-col items-center gap-3">
                        <Link href={home()} className="group flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/30 transition-transform group-hover:scale-105">
                                <AppLogoIcon className="size-8 fill-current text-white" />
                            </div>
                        </Link>
                        <div className="text-center">
                            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                                KIYOMI <span className="text-rose-500">STOCK</span>
                            </h1>
                            <p className="mt-0.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                Manajemen Stok Buket
                            </p>
                        </div>
                    </div>

                    {/* Page title */}
                    {title && (
                        <div className="mb-6 text-center">
                            <p className="text-base font-semibold text-neutral-800 dark:text-neutral-200">{title}</p>
                            {description && (
                                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                            )}
                        </div>
                    )}

                    {children}
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Aplikasi internal — hanya untuk tim{' '}
                    <span className="font-semibold text-rose-500">Kiyomi</span>
                </p>
            </div>
        </div>
    );
}
