'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api, { API_BASE_URL } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Banknote, Download, Loader2, UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function MyDocumentsPage() {
    const { user } = useAuthStore();
    const t = useTranslations('employeePortal');
    const tc = useTranslations('common');
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.employeeId) return;

        api.get(`/employees/${user.employeeId}`)
            .then(res => {
                const emp = res.data?.data;
                if (emp?.payslips) {
                    setPayrolls(emp.payslips);
                }
            })
            .catch(() => toast.error(t('errorLoadingDocs')))
            .finally(() => setIsLoading(false));

    }, [user]);

    const handleDownloadDocument = (type: 'contract' | 'badge') => {
        if (!user?.employeeId) return;
        const tenantSubdomain = user.tenantSubdomain || window.location.hostname.split('.')[0];
        const token = useAuthStore.getState().token;
        const url = `${API_BASE_URL}/employees/${user.employeeId}/${type}?tenant=${tenantSubdomain}&token=${token}`;
        window.open(url, '_blank');
    };

    const handleDownloadPayslip = (payrollId: string) => {
        const tenantSubdomain = user?.tenantSubdomain || window.location.hostname.split('.')[0];
        const token = useAuthStore.getState().token;
        const url = `${API_BASE_URL}/payrolls/payslips/${payrollId}/pdf?tenant=${tenantSubdomain}&token=${token}`;
        window.open(url, '_blank');
    };

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('myDocuments')}</h1>
                <p className="text-slate-500 mt-1">{t('myDocumentsSubtitle')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-t-4 border-t-purple-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-purple-600" />{` `}{t('officialDocuments')}</CardTitle>
                        <CardDescription>{t('officialDocsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-purple-700" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">{t('workContract')}</h4>
                                    <p className="text-xs text-slate-500">{t('digitalVersion')}</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleDownloadDocument('contract')} className="text-purple-700 border-purple-200 hover:bg-purple-50">
                                <Download className="h-4 w-4 mr-2" />{` `}{tc('download')}
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <UserIcon className="h-5 w-5 text-blue-700" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">{t('employeeBadge')}</h4>
                                    <p className="text-xs text-slate-500">{t('professionalId')}</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleDownloadDocument('badge')} className="text-blue-700 border-blue-200 hover:bg-blue-50">
                                <Download className="h-4 w-4 mr-2" />{` `}{tc('download')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-t-4 border-t-emerald-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-emerald-600" />{` `}{t('payslipArchive')}</CardTitle>
                        <CardDescription>{t('payslipArchiveDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payrolls.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {payrolls.map((payroll) => (
                                    <div key={payroll.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-emerald-300 hover:shadow-sm transition-all bg-white group">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-800">
                                                {payroll.payroll
                                                    ? new Date(payroll.payroll.year, payroll.payroll.month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()
                                                    : new Date(payroll.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                Net: <span className="font-bold text-slate-700">{Number(payroll.netSalary).toLocaleString('fr-FR')} MRU</span>
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-700 hover:bg-emerald-50"
                                            onClick={() => handleDownloadPayslip(payroll.id)}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                <Banknote className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-500 font-medium">{t('noBulletin')}</p>
                                <p className="text-slate-400 text-xs mt-1">{t('payslipAppearHereDoc')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
