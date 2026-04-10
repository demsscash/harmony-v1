'use client';

import * as React from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Wallet, Plus, Loader2, Clock, CheckCircle2, XCircle, AlertTriangle, Banknote
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Advance {
    id: string;
    amount: number;
    reason?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEDUCTED';
    requestDate: string;
    reviewedAt?: string;
    rejectionReason?: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
    PENDING: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'pending' },
    APPROVED: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'approved' },
    REJECTED: { color: 'bg-red-100 text-red-600 border-red-200', icon: XCircle, label: 'rejected' },
    DEDUCTED: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Banknote, label: 'deducted' },
};

export default function EmployeeAdvancesPage() {
    const t = useTranslations('advances');
    const tc = useTranslations('common');
    const tp = useTranslations('employeePortal');

    const [advances, setAdvances] = React.useState<Advance[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [amount, setAmount] = React.useState('');
    const [reason, setReason] = React.useState('');

    const fetchAdvances = React.useCallback(async () => {
        try {
            const res = await api.get('/advances');
            const list = res.data?.data || res.data;
            if (Array.isArray(list)) setAdvances(list);
        } catch {
            toast.error(tc('error'));
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => { fetchAdvances(); }, [fetchAdvances]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            toast.error(t('amount') + ' invalide');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/advances', { amount: numAmount, reason: reason.trim() || undefined });
            toast.success(t('requestAdvance') + ' — ' + tc('success'));
            setIsCreateOpen(false);
            setAmount('');
            setReason('');
            fetchAdvances();
        } catch (err: any) {
            toast.error(err.response?.data?.error || tc('error'));
        } finally {
            setSubmitting(false);
        }
    };

    const pendingCount = advances.filter(a => a.status === 'PENDING').length;
    const approvedTotal = advances.filter(a => a.status === 'APPROVED').reduce((sum, a) => sum + Number(a.amount), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{tp('myAdvances')}</h1>
                        <p className="text-sm text-slate-500">{t('subtitle')}</p>
                    </div>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-violet-600 hover:bg-violet-700 gap-2">
                    <Plus className="h-4 w-4" /> {t('requestAdvance')}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-slate-400">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase">{t('totalRequests')}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{advances.length}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-400">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase">{t('pending')}</p>
                        <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-400">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase">{t('approved')}</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedTotal.toLocaleString('fr-FR')} MRU</p>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
            ) : advances.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Wallet className="h-12 w-12 mb-3 text-slate-200" />
                        <p className="font-medium">{t('noAdvances')}</p>
                        <p className="text-sm mt-1">{t('clickToMakeFirstRequest')}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {advances.map((adv, i) => {
                        const cfg = STATUS_CONFIG[adv.status] || STATUS_CONFIG.PENDING;
                        const StatusIcon = cfg.icon;
                        return (
                            <motion.div
                                key={adv.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                                                    <Banknote className="h-5 w-5 text-violet-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-lg">
                                                        {Number(adv.amount).toLocaleString('fr-FR')} MRU
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        {new Date(adv.requestDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                    </p>
                                                    {adv.reason && (
                                                        <p className="text-sm text-slate-400 mt-0.5">{adv.reason}</p>
                                                    )}
                                                    {adv.status === 'REJECTED' && adv.rejectionReason && (
                                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" /> {adv.rejectionReason}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.color}`}>
                                                <StatusIcon className="h-3.5 w-3.5" /> {t(cfg.label)}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-violet-600" /> {t('requestAdvance')}
                        </DialogTitle>
                        <DialogDescription>{t('maxAmount')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">{t('amount')} (MRU) *</label>
                            <Input
                                type="number"
                                min="1"
                                step="100"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Ex: 15000"
                                required
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">{t('reason')}</label>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder={t('reasonPlaceholder')}
                                className="mt-1"
                                rows={3}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                {tc('cancel')}
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-violet-600 hover:bg-violet-700 gap-2">
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                {tc('submit')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
