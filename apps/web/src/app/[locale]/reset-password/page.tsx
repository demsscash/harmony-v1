'use client';

import * as React from 'react';
import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const resetSchema = z.object({
    password: z.string().min(8),
    confirm: z.string(),
}).refine(data => data.password === data.confirm, {
    path: ['confirm'],
});

type ResetFormValues = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
    const t = useTranslations('resetPassword');
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const form = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: { password: '', confirm: '' },
    });

    const onSubmit = async (data: ResetFormValues) => {
        if (!token || !email) {
            toast.error(t('error'));
            return;
        }
        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', {
                token,
                email,
                password: data.password,
            });
            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('error'));
        } finally {
            setIsLoading(false);
        }
    };

    const isInvalidLink = !token || !email;

    return (
        <div className="flex min-h-screen w-full relative overflow-hidden bg-[#0F172A] selection:bg-blue-500/30">
            <div className="absolute inset-0 z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-[420px]"
                >
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

                    <div className="relative backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-white/10 shadow-2xl p-8 overflow-hidden">
                        {success ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-4 gap-4 text-center">
                                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
                                    <CheckCircle2 className="h-16 w-16 text-blue-500" />
                                </motion.div>
                                <h2 className="text-xl font-bold text-white">{t('success')}</h2>
                                <p className="text-slate-400 text-sm">{t('redirecting')}</p>
                                <Link href="/login">
                                    <Button className="mt-2 bg-white text-slate-900 hover:bg-slate-100 font-bold">
                                        {t('loginNow')}
                                    </Button>
                                </Link>
                            </motion.div>
                        ) : isInvalidLink ? (
                            <div className="flex flex-col items-center gap-4 py-4 text-center">
                                <AlertTriangle className="h-12 w-12 text-amber-400" />
                                <h2 className="text-lg font-bold text-white">{t('invalidLink')}</h2>
                                <p className="text-slate-400 text-sm">{t('invalidLinkDesc')}</p>
                                <Link href="/forgot-password">
                                    <Button className="mt-2 bg-white text-slate-900 hover:bg-slate-100 font-bold">
                                        {t('retryRequest')}
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                {email && (
                                    <div className="mb-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <p className="text-xs text-blue-300 text-center">{t('resetFor')} <span className="font-semibold">{decodeURIComponent(email)}</span></p>
                                    </div>
                                )}
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">{t('newPassword')}</Label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <Input
                                                type="password" placeholder="Minimum 8 caractères" disabled={isLoading} {...form.register('password')}
                                                className="pl-10 h-12 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 placeholder:italic focus-visible:ring-blue-500/50 focus-visible:border-blue-500 rounded-xl transition-all"
                                            />
                                        </div>
                                        {form.formState.errors.password && <p className="text-xs font-medium text-red-400 mt-1 ml-1">{form.formState.errors.password.message}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">{t('confirmPassword')}</Label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <Input
                                                type="password" placeholder="••••••••" disabled={isLoading} {...form.register('confirm')}
                                                className="pl-10 h-12 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 placeholder:italic focus-visible:ring-blue-500/50 focus-visible:border-blue-500 rounded-xl transition-all"
                                            />
                                        </div>
                                        {form.formState.errors.confirm && <p className="text-xs font-medium text-red-400 mt-1 ml-1">{form.formState.errors.confirm.message}</p>}
                                    </div>

                                    <Button
                                        type="submit" disabled={isLoading}
                                        className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-xl mt-4 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
                                    >
                                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                            <>
                                                {t('reset')}
                                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </>
                        )}
                    </div>

                    <p className="text-center text-xs text-slate-500 mt-8">
                        © {new Date().getFullYear()} Harmony. Tous droits réservés.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#0F172A]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
