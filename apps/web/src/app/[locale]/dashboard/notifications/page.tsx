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
    error: {
        border: 'border-l-red-500',
        bg: 'bg-red-50',
        icon: AlertTriangle,
        iconColor: 'text-red-500',
        badge: 'bg-red-100 text-red-700',
        label: '' as string,
    },
    warning: {
        border: 'border-l-amber-500',
        bg: 'bg-amber-50',
        icon: FileWarning,
        iconColor: 'text-amber-500',
        badge: 'bg-amber-100 text-amber-700',
        label: '' as string,
    },
    info: {
        border: 'border-l-blue-500',
        bg: 'bg-blue-50',
        icon: Clock,
        iconColor: 'text-blue-500',
        badge: 'bg-blue-100 text-blue-700',
        label: '' as string,
    },
};

const CATEGORY_ICONS = {
    contract: AlertTriangle,
    trial: Clock,
    leave: FileWarning,
    payroll: Banknote,
};

// CATEGORY_LABELS moved to translations

export default function NotificationsPage() {
    const t = useTranslations('notifications');
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState<'all' | 'error' | 'warning' | 'info'>('all');

    const fetchNotifications = React.useCallback(async () => {
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

    React.useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);

    const counts = {
        all: notifications.length,
        error: notifications.filter(n => n.type === 'error').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        info: notifications.filter(n => n.type === 'info').length,
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-600/10">
                            <Bell className="h-7 w-7 text-blue-600" />
                        </div>
                        {t('title')}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {loading ? '...' : t('alertsActive', { count: String(counts.all) })}
                    </p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchNotifications} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </motion.div>

            {/* Filtres */}
            <div className="flex gap-2 flex-wrap">
                {(['all', 'error', 'warning', 'info'] as const).map(f => {
                    const labels = { all: t('filterAll'), error: t('filterUrgent'), warning: t('filterWarning'), info: t('filterInfo') };
                    const colors = {
                        all: filter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border-slate-200',
                        error: filter === 'error' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-200',
                        warning: filter === 'warning' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-600 border-amber-200',
                        info: filter === 'info' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200',
                    };
                    return (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${colors[f]}`}
                        >
                            {labels[f]}
                            {counts[f] > 0 && (
                                <span className="ml-1.5 opacity-70">({counts[f]})</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Liste */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : filtered.length === 0 ? (
                <Card className="border-slate-200/60 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                        <CheckCircle2 className="h-12 w-12 text-emerald-300" />
                        <p className="font-semibold text-slate-600">{t('noAlerts')}</p>
                        <p className="text-sm">{t('allGood')}</p>
                    </CardContent>
                </Card>
            ) : (
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                    className="space-y-2"
                >
                    {filtered.map(notif => {
                        const style = TYPE_STYLES[notif.type];
                        const CatIcon = CATEGORY_ICONS[notif.category];
                        return (
                            <motion.div
                                key={notif.id}
                                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                            >
                                <Link href={notif.href}>
                                    <div className={`flex items-start gap-4 p-4 rounded-xl border border-l-4 ${style.border} ${style.bg} hover:shadow-sm transition-all cursor-pointer group`}>
                                        <div className={`mt-0.5 shrink-0 ${style.iconColor}`}>
                                            <CatIcon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}>
                                                    {notif.category === 'contract' ? t('categoryContract') : notif.category === 'trial' ? t('categoryTrial') : notif.category === 'leave' ? t('categoryLeave') : t('categoryPayroll')}
                                                </span>
                                                <p className="text-sm font-semibold text-slate-800">{notif.title}</p>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 truncate">{notif.message}</p>
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
