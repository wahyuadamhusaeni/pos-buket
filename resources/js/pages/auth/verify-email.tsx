import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

export default function VerifyEmail() {
    return (
        <>
            <Head title="Verifikasi Email - KIYOMI STOCK" />

            <div className="text-center space-y-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-500 shadow-sm mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                        Verifikasi Tidak Diperlukan
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Akun toko internal aktif tanpa perlu konfirmasi email. Anda dapat langsung menggunakan sistem.
                    </p>
                </div>

                <div className="pt-2">
                    <Button
                        asChild
                        className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20"
                    >
                        <Link href={dashboard()}>
                            Lanjut ke Dashboard
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </div>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Status Akun',
    description: 'Akun Anda sudah siap digunakan',
};
