'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    PenTool, Loader2, CheckCircle2, Clock, XCircle, AlertTriangle,
    ArrowRight, FileText
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────
interface SignatureRequest {
    id: string;
    title: string;
    description?: string;
    documentType: string;
    status: 'PENDING' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
    createdAt: string;
    signedAt?: string;
    expiresAt?: string;
}

const STATUS_CONFIG = {
    PENDING: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    SIGNED: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    EXPIRED: { color: 'bg-red-100 text-red-600 border-red-200', icon: AlertTriangle },
    CANCELLED: { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle },
};

export default function MySignaturesPage() {
    const t = useTranslations('signatures');
    const tc = useTranslations('common');
    const tp = useTranslations('employeePortal');

    const [requests, setRequests] = useState<SignatureRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const res = await api.get('/signatures/my/pending');
                if (res.data.success) setRequests(res.data.data);
            } catch {
                toast.error(t('errorLoading'));
            } finally {
                setLoading(false);
            }
        };
        fetchPending();
    }, []);

    const docTypeLabel = (type: string) => {
        const map: Record<string, string> = {
            CONTRACT: t('contract'),
            ATTESTATION: t('attestation'),
            PAYSLIP: t('payslip'),
            OTHER: t('other'),
        };
        return map[type] || type;
    };

    const statusLabel = (status: string) => {
        const map: Record<string, string> = {
            PENDING: t('pending'),
            SIGNED: t('signed'),
            EXPIRED: t('expired'),
            CANCELLED: t('cancelled'),
        };
        return map[status] || status;
    };

    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    const completedRequests = requests.filter(r => r.status !== 'PENDING');

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-600/10">
                            <PenTool className="h-7 w-7 text-blue-600" />
                        </div>
                        {t('mySignatures')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('mySignaturesDesc')}</p>
                </div>
            </motion.div>

            {/* Pending count badge */}
            {!loading && pendingRequests.length > 0 && (
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                        <div>
                            <p className="font-semibold text-amber-900 text-sm">
                                {pendingRequests.length} {t('pendingCount').toLowerCase()}
                            </p>
                            <p className="text-xs text-amber-700 mt-0.5">
                                {t('mySignaturesDesc')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            )}

            {/* Empty state */}
            {!loading && requests.length === 0 && (
                <Card className="border-slate-200/60 shadow-sm bg-white/90">
                    <CardContent className="py-16">
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                            <PenTool className="h-12 w-12 text-slate-200" />
                            <div className="text-center">
                                <p className="font-medium">{t('noPending')}</p>
                                <p className="text-xs mt-1">{t('noPendingDesc')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pending signatures */}
            {!loading && pendingRequests.length > 0 && (
                <Card className="border-slate-200/60 shadow-sm bg-white/90">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-600" />
                            {t('pendingCount')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {pendingRequests.map((req, idx) => {
                                const cfg = STATUS_CONFIG[req.status];
                                const StatusIcon = cfg.icon;
                                return (
                                    <motion.div
                                        key={req.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                                <FileText className="h-5 w-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{req.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-slate-400">{docTypeLabel(req.documentType)}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link href={`/employee/signatures/${req.id}`}>
                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-2">
                                                <PenTool className="h-3.5 w-3.5" /> {t('sign')}
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Completed signatures */}
            {!loading && completedRequests.length > 0 && (
                <Card className="border-slate-200/60 shadow-sm bg-white/90">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            {t('signedCount')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {completedRequests.map((req, idx) => {
                                const cfg = STATUS_CONFIG[req.status];
                                const StatusIcon = cfg.icon;
                                return (
                                    <motion.div
                                        key={req.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                req.status === 'SIGNED' ? 'bg-emerald-50' : req.status === 'EXPIRED' ? 'bg-red-50' : 'bg-slate-50'
                                            }`}>
                                                <StatusIcon className={`h-5 w-5 ${
                                                    req.status === 'SIGNED' ? 'text-emerald-600' : req.status === 'EXPIRED' ? 'text-red-500' : 'text-slate-500'
                                                }`} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{req.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.color}`}>
                                                        <StatusIcon className="h-3 w-3" /> {statusLabel(req.status)}
                                                    </span>
                                                    {req.signedAt && (
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(req.signedAt).toLocaleDateString('fr-FR')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Link href={`/employee/signatures/${req.id}`}>
                                            <Button size="sm" variant="outline" className="gap-2 border-slate-200">
                                                {t('viewDetail')} <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
