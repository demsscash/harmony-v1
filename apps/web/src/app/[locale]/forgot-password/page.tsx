'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, CheckCircle2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const schema = z.object({
    subdomain: z.string().min(1),
    email: z.string().email(),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
    const t = useTranslations('forgotPassword');
    const tl = useTranslations('login');
    const [sent, setSent] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { subdomain: '', email: '' },
    });

    const onSubmit = async (data: FormValues) => {
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email: data.email }, {
                headers: { 'X-Tenant-Subdomain': data.subdomain.trim() },
            });
            setSent(true);
        } catch (e: any) {
            // On affiche toujours le succès pour ne pas divulguer si l'email existe
            setSent(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full relative overflow-hidden bg-[#0F172A] selection:bg-blue-500/30">
            {/* Background effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[420px]"
                >
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_40px_rgba(59,130,246,0.4)] mb-6 ring-1 ring-white/20"
                        >
                            <span className="text-white font-black text-3xl tracking-tighter">H</span>
                        </motion.div>
                        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
                        <p className="text-slate-400 text-sm mt-2">{t('subtitle')}</p>
                    </div>

                    <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-white/10 shadow-2xl p-8">
                        <AnimatePresence mode="wait">
                            {sent ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center text-center gap-4 py-4"
                                >
                                    <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">{t('emailSent')}</h2>
                                        <p className="text-slate-400 text-sm mt-2">
                                            {t('success')}
                                        </p>
                                        <p className="text-slate-500 text-xs mt-3">{t('checkSpam')}</p>
                                    </div>
                                    <Link href="/login" className="mt-2">
                                        <Button variant="outline" className="gap-2 text-slate-300 border-white/10 hover:bg-white/5">
                                            <ArrowLeft className="h-4 w-4" /> {t('backToLogin')}
                                        </Button>
                                    </Link>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-5"
                                >
                                    {/* Workspace */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">{tl('workspace')}</Label>
                                        <div className="relative group flex">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <Globe className="h-4 w-4 text-slate-500" />
                                            </div>
                                            <Input
                                                placeholder="acme"
                                                {...form.register('subdomain')}
                                                className="pl-10 h-12 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 placeholder:italic focus-visible:ring-blue-500/50 focus-visible:border-blue-500 rounded-r-none rounded-l-xl"
                                            />
                                            <span className="h-12 px-4 flex items-center text-sm font-medium text-slate-400 bg-slate-800/80 border border-l-0 border-white/10 rounded-r-xl whitespace-nowrap">
                                                .harmony.mr
                                            </span>
                                        </div>
                                        {form.formState.errors.subdomain && (
                                            <p className="text-xs text-red-400 ml-1">{form.formState.errors.subdomain.message}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">{tl('emailLabel')}</Label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <Mail className="h-4 w-4 text-slate-500" />
                                            </div>
                                            <Input
                                                type="email"
                                                placeholder="nom@entreprise.com"
                                                {...form.register('email')}
                                                className="pl-10 h-12 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 placeholder:italic focus-visible:ring-blue-500/50 focus-visible:border-blue-500 rounded-xl"
                                            />
                                        </div>
                                        {form.formState.errors.email && (
                                            <p className="text-xs text-red-400 ml-1">{form.formState.errors.email.message}</p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit" disabled={loading}
                                        className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-xl flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('send')}
                                    </Button>

                                    <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mt-2">
                                        <ArrowLeft className="h-4 w-4" /> {t('backToLogin')}
                                    </Link>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
