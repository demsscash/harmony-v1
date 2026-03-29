'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { API_BASE_URL } from '@/lib/api';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, FileText, User, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Payslip {
    id: string;
    employee: { firstName: string; lastName: string; matricule: string };
    baseSalary: number;
    totalAdvantages: number;
    grossSalary: number;
    cnssEmployee: number;
    itsAmount: number;
    netSalary: number;
}

interface PayrollCampaign {
    id: string;
    month: number;
    year: number;
    status: string;
    payslips: Payslip[];
}

const MONTH_KEYS = ['january','february','march','april','may','june','july','august','september','october','november','december'];

export default function PayrollDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const t = useTranslations('payroll');
    const tm = useTranslations('months');
    const tc = useTranslations('common');
    const [campaign, setCampaign] = React.useState<PayrollCampaign | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [sending, setSending] = React.useState(false);

    React.useEffect(() => {
        const fetchCampaign = async () => {
            try {
                const res = await api.get(`/payrolls/${params.id}`);
                if (res.data.success) {
                    setCampaign(res.data.data);
                }
            } catch (error) {
                toast.error(t('errorLoadingCampaign'));
            } finally {
                setLoading(false);
            }
        };
        fetchCampaign();
    }, [params.id]);

    const handleSendPayslips = async () => {
        if (!campaign) return;
        setSending(true);
        try {
            const res = await api.post('/notifications/send-payslips', { payrollId: campaign.id });
            toast.success(res.data.message || t('payslipsSent'));
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('errorSending'));
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="text-center py-20 text-slate-500">
                {t('campaignNotFound')}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 flex-wrap">
                <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/payroll')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-slate-900">
                        {t('campaignTitle', { month: tm(MONTH_KEYS[campaign.month - 1]), year: String(campaign.year) })}
                    </h1>
                    <p className="text-slate-500 text-sm">{t('payslipsGenerated', { count: String(campaign.payslips.length) })}</p>
                </div>
                {campaign.status === 'VALIDATED' && (
                    <Button
                        onClick={handleSendPayslips}
                        disabled={sending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 text-sm font-bold"
                    >
                        {sending
                            ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            : <Send className="h-4 w-4 mr-2" />
                        }
                        {t('sendByEmail')}
                    </Button>
                )}
            </div>


            <Card className="border-slate-200/60 shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-3 font-semibold">{t('employee')}</th>
                                <th className="px-5 py-3 font-semibold">{t('base')}</th>
                                <th className="px-5 py-3 font-semibold">{t('advantages')}</th>
                                <th className="px-5 py-3 font-semibold">{t('gross')}</th>
                                <th className="px-5 py-3 font-semibold">{t('deductions')}</th>
                                <th className="px-5 py-3 font-semibold font-bold text-emerald-700">{t('net')}</th>
                                <th className="px-5 py-3 font-semibold text-right">{tc('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {campaign.payslips.map(payslip => {
                                const deductions = Number(payslip.cnssEmployee) + Number(payslip.itsAmount);
                                return (
                                    <tr key={payslip.id} className="hover:bg-slate-50/80">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center">
                                                    <User className="h-3.5 w-3.5 text-slate-500" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-800">
                                                        {payslip.employee.firstName} {payslip.employee.lastName}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{payslip.employee.matricule}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">{Number(payslip.baseSalary).toLocaleString()}</td>
                                        <td className="px-5 py-3">{Number(payslip.totalAdvantages).toLocaleString()}</td>
                                        <td className="px-5 py-3 font-semibold">{Number(payslip.grossSalary).toLocaleString()}</td>
                                        <td className="px-5 py-3 text-rose-600">-{deductions.toLocaleString()}</td>
                                        <td className="px-5 py-3 font-bold text-emerald-700">{Number(payslip.netSalary).toLocaleString()} MRU</td>
                                        <td className="px-5 py-3 text-right">
                                            <Button variant="outline" size="sm" className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => {
                                                const base = API_BASE_URL;
                                                const tenant = user?.tenantSubdomain || 'demo';
                                                const token = Cookies.get('accessToken') || '';
                                                window.open(`${base}/payrolls/payslips/${payslip.id}/pdf?tenant=${tenant}&token=${token}`, '_blank');
                                            }}>
                                                <FileText className="h-3 w-3 mr-1" /> PDF
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
