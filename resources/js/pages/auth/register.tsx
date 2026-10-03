import { Head, Link } from '@inertiajs/react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { login } from '@/routes';

export default function Register() {
    return (
        <>
            <Head title="Registrasi Ditutup - KIYOMI STOCK" />

            <div className="text-center space-y-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-500 shadow-sm mx-auto">
                    <ShieldAlert className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                        Pendaftaran Publik Ditutup
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        KIYOMI STOCK adalah sistem kasir & inventaris internal khusus toko.
                        Akun kasir dan pengelola hanya dapat dibuat oleh Owner.
                    </p>
                </div>

                <div className="pt-2">
                    <Button
                        asChild
                        className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20"
                    >
                        <Link href={login()}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Kembali ke Halaman Masuk
                        </Link>
                    </Button>
                </div>
            </div>
        </>
    );
}

Register.layout = {
    title: 'Akses Terbatas',
    description: 'Sistem internal toko - tidak menerima registrasi umum',
};
