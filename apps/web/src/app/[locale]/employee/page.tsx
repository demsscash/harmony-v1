'use client';

import * as React from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane, FileText, Banknote, Calendar, ArrowRight, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const MONTH_KEYS = ['1','2','3','4','5','6','7','8','9','10','11','12'];
// STATUS labels moved to translations (common namespace)

export default function EmployeeDashboard() {
    const { user } = useAuthStore();
    const t = useTranslations('employeePortal');
    const tm = useTranslations('months');
    const tc = useTranslations('common');
    const [loading, setLoading] = React.useState(true);
    const [leavesPending, setLeavesPending] = React.useState(0);
    const [leavesApproved, setLeavesApproved] = React.useState(0);
    const [recentLeaves, setRecentLeaves] = React.useState<any[]>([]);
    const [lastPayslip, setLastPayslip] = React.useState<any>(null);

    React.useEffect(() => {
        if (!user?.employeeId) { setLoading(false); return; }
        const fetchData = async () => {
            try {
                const [leavesRes, empRes] = await Promise.all([
                    api.get('/leaves'),
                    api.get(`/employees/${user.employeeId}`),
                ]);
                const leaves = leavesRes.data?.data || [];
                setLeavesPending(leaves.filter((l: any) => l.status === 'PENDING').length);
                setLeavesApproved(leaves.filter((l: any) => l.status === 'APPROVED').length);
                setRecentLeaves(leaves.slice(0, 5));

                const payslips = empRes.data?.data?.payslips || [];
                if (payslips.length > 0) setLastPayslip(payslips[0]);
            } catch { /* silently fail */ }
            setLoading(false);
        };
        fetchData();
    }, [user?.employeeId]);

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {t('hello', { name: user?.firstName || 'Employé' })}
                </h1>
                <p className="text-slate-500 mt-2">
                    {t('welcome')}
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Congés en attente */}
                <Card className="border-t-4 border-t-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex justify-between items-center text-sm font-medium text-slate-500">
                            {t('pendingLeaves')}
                            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                <Plane className="h-4 w-4 text-emerald-600" />
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-slate-900 mb-1">{leavesPending}</div>
                        <p className="text-xs text-slate-400 mb-2">{t('approvedLeaves', { count: String(leavesApproved) })}</p>
                        <Link href="/employee/leaves" className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 flex items-center group">
                            {t('makeRequest')} <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </CardContent>
                </Card>

                {/* Dernier Bulletin */}
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex justify-between items-center text-sm font-medium text-slate-500">
                            {t('lastPayslip')}
                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                <Banknote className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-slate-900 mb-1 truncate">
                            {lastPayslip?.payroll
                                ? `${tm(MONTH_KEYS[(lastPayslip.payroll.month || 1) - 1])} ${lastPayslip.payroll.year}`
                                : t('noPayslip')}
                        </div>
                        {lastPayslip && (
                            <p className="text-xs text-slate-400 mb-2">Net : {Number(lastPayslip.netSalary).toLocaleString('fr-FR')} MRU</p>
                        )}
                        <Link href="/employee/payslips" className="text-sm text-blue-600 font-semibold hover:text-blue-700 flex items-center group">
                            {t('viewPayslips')} <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </CardContent>
                </Card>

                {/* Documents Pro */}
                <Card className="border shadow-sm hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex justify-between items-center text-sm font-medium text-slate-500">
                            {t('documents')}
                            <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-slate-900 mb-2">{t('contractAndBadge')}</div>
                        <Link href="/employee/documents" className="text-sm text-purple-600 font-semibold hover:text-purple-700 flex items-center group">
                            {t('downloadDoc')} <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Activité récente */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-slate-400" /> {t('recentRequests')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentLeaves.length > 0 ? (
                        <div className="space-y-3">
                            {recentLeaves.map((leave: any) => (
                                <div key={leave.id} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${leave.status === 'APPROVED' ? 'bg-emerald-100' : leave.status === 'PENDING' ? 'bg-amber-100' : 'bg-red-100'}`}>
                                            {leave.status === 'APPROVED' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : leave.status === 'PENDING' ? <Clock className="h-4 w-4 text-amber-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{leave.leaveType?.name || 'Congé'}</p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(leave.startDate).toLocaleDateString('fr-FR')} → {new Date(leave.endDate).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : leave.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                        {leave.status === 'PENDING' ? tc('pending') : leave.status === 'APPROVED' ? tc('approved') : leave.status === 'REJECTED' ? tc('rejected') : tc('cancelled')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-500 text-sm italic">
                            {t('noLeaveRequest')}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
