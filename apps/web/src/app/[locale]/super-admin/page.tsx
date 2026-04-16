'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from '@/i18n/routing';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export default function SuperAdminLoginPage() {
    const t = useTranslations('login');
    const router = useRouter();
    const { loginState } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [successAnim, setSuccessAnim] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/super-login', {
                email: data.email,
                password: data.password,
            });

            if (response.data.success) {
                const { user, accessToken } = response.data.data;
                Cookies.set('accessToken', accessToken, { expires: 1 / 24, secure: window.location.protocol === 'https:', sameSite: 'lax' });
                loginState(user, accessToken);

                setSuccessAnim(true);
                setTimeout(() => {
                    toast.success(t('welcome', { name: user.email }));
                    router.push('/dashboard');
                }, 1000);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('invalidCredentials'));
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full relative overflow-hidden bg-[#0a0a0a] selection:bg-red-500/30">
            <div className="absolute inset-0 z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-red-900/20 blur-[120px]" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-orange-900/15 blur-[120px]" />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="w-full max-w-[400px]"
                >
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 shadow-[0_0_40px_rgba(220,38,38,0.4)] mb-6 ring-1 ring-white/20"
                        >
                            <Shield className="h-8 w-8 text-white" />
                        </motion.div>
                        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Super Admin</h1>
                        <p className="text-slate-500 text-sm">Accès réservé à l'équipe Harmony</p>
                    </div>

                    <div className="relative backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-8 overflow-hidden">
                        <AnimatePresence>
                            {successAnim && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="absolute inset-0 z-50 bg-[#0a0a0a] flex flex-col items-center justify-center"
                                >
                                    <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
                                        <CheckCircle2 className="h-16 w-16 text-red-500 mb-4" />
                                    </motion.div>
                                    <h2 className="text-xl font-bold text-white">{t('loginSuccess')}</h2>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Email</Label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                                    </div>
                                    <Input
                                        type="email" placeholder="admin@harmony.mr" autoComplete="email" disabled={isLoading} {...form.register('email')}
                                        className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 placeholder:italic focus-visible:ring-red-500/50 focus-visible:border-red-500 rounded-xl transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">{t('password')}</Label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                                    </div>
                                    <Input
                                        type="password" placeholder="••••••••" autoComplete="current-password" disabled={isLoading} {...form.register('password')}
                                        className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 placeholder:italic focus-visible:ring-red-500/50 focus-visible:border-red-500 rounded-xl transition-all"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit" disabled={isLoading}
                                className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl mt-4 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                    <>
                                        {t('signIn')}
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    <p className="text-center text-xs text-slate-600 mt-8">
                        © {new Date().getFullYear()} Harmony. Accès restreint.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
