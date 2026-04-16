'use client';

import * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Building2, Shield, Lock, Mail, ArrowRight, CheckCircle2, Globe, Phone } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

const loginSchema = z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(6),
    subdomain: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { loginState } = useAuthStore();
    const t = useTranslations('login');
    const tc = useTranslations('common');
    const [isLoading, setIsLoading] = useState(false);
    const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
    const [successAnim, setSuccessAnim] = useState(false);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', phone: '', password: '', subdomain: '' },
    });

    const onSubmit = async (data: LoginFormValues) => {
        if (authMethod === 'email' && (!data.email || !data.email.includes('@'))) {
            form.setError('email', { message: t('invalidEmail') });
            return;
        }
        if (authMethod === 'phone' && (!data.phone || data.phone.length < 8)) {
            form.setError('phone', { message: t('invalidPhone') });
            return;
        }

        setIsLoading(true);
        try {
            const credentials = authMethod === 'email'
                ? { email: data.email, password: data.password }
                : { phone: data.phone, password: data.password };

            if (!data.subdomain?.trim()) {
                toast.error(t('enterWorkspace'));
                setIsLoading(false);
                return;
            }
            const response = await api.post('/auth/login', credentials, {
                headers: { 'X-Tenant-Subdomain': data.subdomain.trim() },
            });

            if (response.data.success) {
                const { user, accessToken } = response.data.data;
                const enrichedUser = {
                    ...user,
                    tenantSubdomain: user.tenantSubdomain || data.subdomain?.trim(),
                };

                Cookies.set('accessToken', accessToken, { expires: 1 / 24, secure: window.location.protocol === 'https:', sameSite: 'lax' });
                loginState(enrichedUser, accessToken);

                setSuccessAnim(true);
                setTimeout(() => {
                    toast.success(t('welcome', { name: user.firstName || user.email }));
                    if (user.role === 'EMPLOYEE') {
                        router.push('/employee');
                    } else {
                        router.push('/dashboard');
                    }
                }, 1000);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('invalidCredentials'));
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full relative overflow-hidden bg-[#0F172A] selection:bg-blue-500/30">
            {/* Dynamic Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] rounded-full bg-blue-400/10 blur-[100px] mix-blend-screen" />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-[420px]"
                >
                    {/* Header */}
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_40px_rgba(59,130,246,0.4)] mb-6 ring-1 ring-white/20"
                        >
                            <span className="text-white font-black text-3xl tracking-tighter">H</span>
                        </motion.div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{t('title')}</h1>
                        <p className="text-slate-400 text-sm">{t('subtitle')}</p>
                    </div>

                    {/* Main Card */}
                    <div className="relative backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-white/10 shadow-2xl p-8 overflow-hidden">

                        {/* Success Overlay */}
                        <AnimatePresence>
                            {successAnim && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center"
                                >
                                    <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
                                        <CheckCircle2 className="h-16 w-16 text-blue-500 mb-4" />
                                    </motion.div>
                                    <h2 className="text-xl font-bold text-white">{t('loginSuccess')}</h2>
                                    <p className="text-slate-400 text-sm mt-2">{t('preparingSpace')}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            {/* Workspace / Tenant */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">{t('workspace')}</Label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Globe className="h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <div className="flex">
                                        <Input
                                            placeholder="acme"
                                            autoComplete="off" disabled={isLoading} {...form.register('subdomain')}
                                            className="pl-10 h-12 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 placeholder:italic focus-visible:ring-blue-500/50 focus-visible:border-blue-500 rounded-r-none rounded-l-xl transition-all"
                                        />
                                        <span className="h-12 px-4 flex items-center text-sm font-medium text-slate-400 bg-slate-800/80 border border-l-0 border-white/10 rounded-r-xl whitespace-nowrap">
                                            .harmony.mr
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Toggle Email / Téléphone */}
                            <div className="flex p-1 bg-slate-800/30 rounded-lg border border-white/5">
                                <button type="button" onClick={() => { setAuthMethod('email'); form.clearErrors(); }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${authMethod === 'email' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                                    <Mail className="h-3.5 w-3.5" /> {t('emailLabel')}
                                </button>
                                <button type="button" onClick={() => { setAuthMethod('phone'); form.clearErrors(); }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${authMethod === 'phone' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                                    <Phone className="h-3.5 w-3.5" /> {t('phoneLabel')}
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">
                                    {authMethod === 'email' ? t('emailLabel') : t('phoneLabel')}
                                </Label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        {authMethod === 'email'
                                            ? <Mail className="h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                            : <Phone className="h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                        }
                                    </div>
                                    {authMethod === 'email' ? (
                                        <Input
                                            type="email" placeholder="nom@entreprise.com" autoComplete="email" disabled={isLoading} {...form.register('email')}
                                            className="pl-10 h-12 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 placeholder:italic focus-visible:ring-blue-500/50 focus-visible:border-blue-500 rounded-xl transition-all"
                                        />
                                    ) : (
                                        <Input
                                            type="tel" placeholder="22 33 44 55" autoComplete="tel" disabled={isLoading} {...form.register('phone')}
                                            className="pl-10 h-12 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 placeholder:italic focus-visible:ring-blue-500/50 focus-visible:border-blue-500 rounded-xl transition-all"
                                        />
                                    )}
                                </div>
                                {authMethod === 'email' && form.formState.errors.email && <p className="text-xs font-medium text-red-400 mt-1 ml-1">{form.formState.errors.email.message}</p>}
                                {authMethod === 'phone' && form.formState.errors.phone && <p className="text-xs font-medium text-red-400 mt-1 ml-1">{form.formState.errors.phone.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between ml-1">
                                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{t('password')}</Label>
                                    <Link href="/forgot-password" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">{t('forgotPassword')}</Link>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <Input
                                        type="password" placeholder="••••••••" autoComplete="current-password" disabled={isLoading} {...form.register('password')}
                                        className="pl-10 h-12 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 placeholder:italic focus-visible:ring-blue-500/50 focus-visible:border-blue-500 rounded-xl transition-all"
                                    />
                                </div>
                                {form.formState.errors.password && <p className="text-xs font-medium text-red-400 mt-1 ml-1">{form.formState.errors.password.message}</p>}
                            </div>

                            <Button
                                type="submit" disabled={isLoading}
                                className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-xl mt-4 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
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

                    <p className="text-center text-xs text-slate-500 mt-8">
                        © {new Date().getFullYear()} Harmony. Tous droits réservés.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
