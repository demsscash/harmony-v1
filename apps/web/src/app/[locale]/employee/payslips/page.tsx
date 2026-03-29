'use client';

import * as React from 'react';
import api, { API_BASE_URL } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Banknote, Download, FileText, RefreshCw, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const MONTH_KEYS = ['january','february','march','april','may','june','july','august','september','october','november','december'];

const STATUS_STYLE: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600',
    PROCESSING: 'bg-blue-100 text-blue-700',
    VALIDATED: 'bg-emerald-100 text-emerald-700',
    CLOSED: 'bg-purple-100 text-purple-700',
};
// STATUS_LABEL moved to translations

export default function MyPayslipsPage() {
    const { user } = useAuthStore();
    const t = useTranslations('employeePortal');
    const tp = useTranslations('payroll');
    const tm = useTranslations('months');
    const [payslips, setPayslips] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!user?.employeeId) { setLoading(false); return; }
        api.get(`/employees/${user.employeeId}`)
            .then(res => {
                const emp = res.data?.data;
                const slips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                setPayslips(slips.sort((a: any, b: any) => {
                    const pa = a.payroll;
                    const pb = b.payroll;
                    if (!pa || !pb) return 0;
                    return (pb.year * 100 + pb.month) - (pa.year * 100 + pa.month);
                }));
            })
            .catch(() => toast.error(t('errorLoadingPayslips')))
            .finally(() => setLoading(false));
    }, [user?.employeeId]);

    const handleDownload = (payslipId: string) => {
        const base = API_BASE_URL;
        const tenantSubdomain = user?.tenantSubdomain || window.location.hostname.split('.')[0];
        const token = useAuthStore.getState().token;
        window.open(`${base}/payrolls/payslips/${payslipId}/pdf?tenant=${tenantSubdomain}&token=${token}`, '_blank');
    };

    const totalNet = payslips.reduce((acc, p) => acc + Number(p.netSalary || 0), 0);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-600/10"><Banknote className="h-7 w-7 text-emerald-600" /></div>
                    {t('myPayslips')}
                </h1>
                <p className="text-slate-500 mt-1">{t('myPayslipsSubtitle')}</p>
            </motion.div>

            {/* Résumé */}
            {!loading && payslips.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-slate-200/60 shadow-sm bg-white/80">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-50"><Banknote className="h-5 w-5 text-emerald-600" /></div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase">{t('availablePayslips')}</p>
                                <p className="text-2xl font-bold text-slate-900">{payslips.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200/60 shadow-sm bg-white/80">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-50"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase">{t('cumulativeNet')}</p>
                                <p className="text-2xl font-bold text-slate-900">{totalNet.toLocaleString('fr-FR')} MRU</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200/60 shadow-sm bg-white/80">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-50"><FileText className="h-5 w-5 text-purple-600" /></div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase">{t('lastPayslipLabel')}</p>
                                <p className="text-sm font-bold text-slate-900">
                                    {payslips[0]?.payroll ? `${tm(MONTH_KEYS[(payslips[0].payroll.month || 1) - 1])} ${payslips[0].payroll.year}` : '—'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Liste des bulletins */}
            <Card className="border-slate-200/60 shadow-sm bg-white/90">
                <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-base">{t('payslipsHistory')}</CardTitle>
                    <CardDescription>{t('payslipDownloadHint')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : payslips.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                            <Banknote className="h-10 w-10 text-slate-200" />
                            <p className="font-medium">{t('noPayslipAvailable')}</p>
                            <p className="text-xs">{t('payslipAppearHere')}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {payslips.map((slip, idx) => {
                                const payroll = slip.payroll;
                                const monthName = payroll ? tm(MONTH_KEYS[(payroll.month || 1) - 1]) : '—';
                                const year = payroll?.year || '—';
                                return (
                                    <motion.div
                                        key={slip.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                                <FileText className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{monthName} {year}</p>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-xs text-slate-500">
                                                        Net : <strong className="text-slate-800">{Number(slip.netSalary).toLocaleString('fr-FR')} MRU</strong>
                                                    </span>
                                                    {payroll?.status && (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLE[payroll.status]}`}>
                                                            {payroll.status === 'DRAFT' ? tp('statusDraft') : payroll.status === 'PROCESSING' ? tp('statusProcessing') : payroll.status === 'VALIDATED' ? tp('statusValidated') : tp('statusClosed')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm" variant="outline"
                                            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                                            onClick={() => handleDownload(slip.id)}
                                        >
                                            <Download className="h-3.5 w-3.5" /> PDF
                                        </Button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
