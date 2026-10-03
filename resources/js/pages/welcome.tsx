import { Head, Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { login } from '@/routes';

interface Props {
    auth?: { user?: { name: string; role: string } };
}

export default function Welcome({ auth }: Props) {
    const isLoggedIn = !!auth?.user;

    return (
        <>
            <Head>
                <title>KIYOMI STOCK — Manajemen Stok Buket</title>
                <meta name="description" content="Kelola stok bunga, HPP otomatis, dan penjualan buket dengan mudah dan akurat." />
            </Head>

            <div className="relative flex min-h-svh flex-col overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-rose-950/20">

                {/* Decorative background */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-64 right-0 h-[600px] w-[600px] rounded-full bg-rose-200/30 blur-3xl dark:bg-rose-900/20" />
                    <div className="absolute bottom-0 -left-32 h-96 w-96 rounded-full bg-pink-200/30 blur-3xl dark:bg-pink-900/10" />
                    <div className="absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-fuchsia-100/20 blur-2xl dark:bg-fuchsia-900/10" />
                </div>

                {/* Navbar */}
                <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/30">
                            <AppLogoIcon className="size-6 fill-current text-white" />
                        </div>
                        <div>
                            <span className="text-lg font-black tracking-tight text-neutral-900 dark:text-white">
                                KIYOMI <span className="text-rose-500">STOCK</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isLoggedIn ? (
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition-all hover:shadow-rose-500/40"
                            >
                                Ke Dashboard →
                            </Link>
                        ) : (
                            <Link
                                href={login()}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition-all hover:shadow-rose-500/40"
                            >
                                Masuk
                            </Link>
                        )}
                    </div>
                </header>

                {/* Hero */}
                <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center md:px-12">
                    {/* Badge */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-200/60 bg-rose-50/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-rose-600 backdrop-blur-sm dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        Sistem Manajemen Stok Buket
                    </div>

                    {/* Heading */}
                    <h1 className="mx-auto max-w-3xl text-5xl font-black leading-tight tracking-tight text-neutral-900 dark:text-white md:text-6xl lg:text-7xl">
                        Kelola Stok Buket{' '}
                        <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
                            Lebih Cerdas
                        </span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
                        HPP otomatis metode <strong>Moving Average</strong>, pencatatan pembelian & penjualan real-time,
                        laporan laba yang akurat — semua dalam satu aplikasi untuk usaha buket rumahan.
                    </p>

                    {/* CTA */}
                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link
                            href={isLoggedIn ? '/dashboard' : login()}
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-rose-500/30 transition-all hover:scale-105 hover:shadow-rose-500/50"
                        >
                            {isLoggedIn ? 'Buka Dashboard' : 'Mulai Sekarang'}
                            <span>→</span>
                        </Link>
                    </div>

                    {/* Feature cards */}
                    <div className="mt-20 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                emoji: '📦',
                                title: 'Stok Real-time',
                                desc: 'Pantau stok bunga hidup, artifisial, dan pelengkap secara real-time. Alert otomatis saat stok menipis.',
                                color: 'from-rose-500/10 to-pink-500/10 border-rose-200/50 dark:border-rose-800/30',
                            },
                            {
                                emoji: '🧮',
                                title: 'HPP Moving Average',
                                desc: 'Hitung HPP per tangkai secara otomatis dengan metode moving average. Tahu persis biaya tiap buket.',
                                color: 'from-pink-500/10 to-fuchsia-500/10 border-pink-200/50 dark:border-pink-800/30',
                            },
                            {
                                emoji: '🛒',
                                title: 'POS Cepat',
                                desc: 'Catat penjualan dalam <30 detik. Template buket, komponen custom, dan kalkulasi margin instan.',
                                color: 'from-fuchsia-500/10 to-purple-500/10 border-fuchsia-200/50 dark:border-fuchsia-800/30',
                            },
                            {
                                emoji: '🚚',
                                title: 'Pencatatan Pembelian',
                                desc: 'Alokasi ongkir proporsional ke setiap item. Riwayat harga per supplier untuk perbandingan.',
                                color: 'from-rose-500/10 to-orange-500/10 border-rose-200/50 dark:border-rose-800/30',
                            },
                            {
                                emoji: '📊',
                                title: 'Dashboard & Laporan',
                                desc: 'Omzet, laba kotor, nilai persediaan, waste — semua terlihat jelas di satu layar.',
                                color: 'from-pink-500/10 to-rose-500/10 border-pink-200/50 dark:border-pink-800/30',
                            },
                            {
                                emoji: '🌺',
                                title: 'Template Buket',
                                desc: 'Simpan resep buket favorit sebagai template. Edit fleksibel sesuai request pelanggan.',
                                color: 'from-fuchsia-500/10 to-pink-500/10 border-fuchsia-200/50 dark:border-fuchsia-800/30',
                            },
                        ].map((f) => (
                            <div
                                key={f.title}
                                className={`rounded-2xl border bg-gradient-to-br p-6 text-left backdrop-blur-sm transition-shadow hover:shadow-md ${f.color}`}
                            >
                                <div className="mb-3 text-3xl">{f.emoji}</div>
                                <h3 className="mb-2 font-bold text-neutral-900 dark:text-white">{f.title}</h3>
                                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 border-t border-rose-100/50 py-6 text-center text-xs text-muted-foreground dark:border-white/5">
                    © {new Date().getFullYear()} KIYOMI STOCK — Aplikasi internal untuk usaha buket rumahan
                </footer>
            </div>
        </>
    );
}
