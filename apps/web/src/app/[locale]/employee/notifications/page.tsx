'use client';

import * as React from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Bell, AlertTriangle, Clock, FileWarning, Banknote, CheckCircle2, Loader2, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface Notification {
    id: string;
    type: 'error' | 'warning' | 'info';
    category: 'contract' | 'trial' | 'leave' | 'payroll';
    title: string;
    message: string;
    href: string;
    createdAt: string;
}

const TYPE_STYLES = {
    error: { border: 'border-l-red-500', bg: 'bg-red-50', iconColor: 'text-red-500', badge: 'bg-red-100 text-red-700' },
    warning: { border: 'border-l-amber-500', bg: 'bg-amber-50', iconColor: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
    info: { border: 'border-l-blue-500', bg: 'bg-blue-50', iconColor: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
};

const CATEGORY_ICONS = { contract: AlertTriangle, trial: Clock, leave: FileWarning, payroll: Banknote };
// CATEGORY_LABELS moved to translations

export default function EmployeeNotificationsPage() {
    const t = useTranslations('notifications');
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetch = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications/inbox');
            setNotifications(res.data.data || []);
        } catch {
            toast.error(t('errorLoading'));
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Bell className="h-6 w-6 text-emerald-600" />{` `}{t('myNotifications')}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {loading ? '...' : t('notificationCount', { count: String(notifications.length) })}
                    </p>
                </div>
                <Button variant="outline" size="icon" onClick={fetch} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </motion.div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                </div>
            ) : notifications.length === 0 ? (
                <Card className="border-slate-200/60 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                        <CheckCircle2 className="h-12 w-12 text-emerald-300" />
                        <p className="font-semibold text-slate-600">{t('noNotification')}</p>
                        <p className="text-sm">{t('allGood')}</p>
                    </CardContent>
                </Card>
            ) : (
                <motion.div
                    initial="hidden" animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                    className="space-y-2"
                >
                    {notifications.map(notif => {
                        const style = TYPE_STYLES[notif.type];
                        const CatIcon = CATEGORY_ICONS[notif.category];
                        return (
                            <motion.div key={notif.id} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                                <Link href={notif.href}>
                                    <div className={`flex items-start gap-4 p-4 rounded-xl border border-l-4 ${style.border} ${style.bg} hover:shadow-sm transition-all cursor-pointer group`}>
                                        <CatIcon className={`h-5 w-5 mt-0.5 shrink-0 ${style.iconColor}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}>
                                                    {notif.category === 'contract' ? t('categoryContract') : notif.category === 'trial' ? t('categoryTrial') : notif.category === 'leave' ? t('categoryLeave') : t('categoryPayroll')}
                                                </span>
                                                <p className="text-sm font-semibold text-slate-800">{notif.title}</p>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 mt-1" />
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}
