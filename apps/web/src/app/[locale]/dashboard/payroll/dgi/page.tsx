'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api, { API_BASE_URL } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';

export default function DgiDeclarationsPage() {
    const { user } = useAuthStore();
    const t = useTranslations('payroll');
    const tm = useTranslations('months');
    const tc = useTranslations('common');
    const [downloadingITS, setDownloadingITS] = React.useState(false);
    const [downloadingDAS, setDownloadingDAS] = React.useState(false);
    const [downloadingTaxe, setDownloadingTaxe] = React.useState(false);

    const [itsMonth, setItsMonth] = React.useState(new Date().getMonth() + 1);
    const [itsYear, setItsYear] = React.useState(new Date().getFullYear());
    const [isItsGta, setIsItsGta] = React.useState(false);

    const [dasYear, setDasYear] = React.useState(new Date().getFullYear());
    const [isDasGta, setIsDasGta] = React.useState(false);

    const [taxeYear, setTaxeYear] = React.useState(new Date().getFullYear());

    const MONTH_KEYS = ['1','2','3','4','5','6','7','8','9','10','11','12'];

    const getApiUrl = () => {
        // Fallback pour dev locale si variables d'environnement absentes
        return API_BASE_URL;
    };

    const downloadITS = async () => {
        setDownloadingITS(true);
        try {
            const tenant = user?.tenantSubdomain || 'demo';

            const response = await api.get('/dgi/its', {
                params: { month: itsMonth, year: itsYear, gta: isItsGta },
                headers: { 'X-Tenant-Subdomain': tenant },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `Declaration_ITS_${itsMonth}_${itsYear}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(t('itsSuccess'));
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setDownloadingITS(false);
        }
    };

    const downloadDAS = async () => {
        setDownloadingDAS(true);
        try {
            const tenant = user?.tenantSubdomain || 'demo';

            const response = await api.get('/dgi/das', {
                params: { year: dasYear, gta: isDasGta },
                headers: { 'X-Tenant-Subdomain': tenant },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `Declaration_DAS_${dasYear}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(t('dasSuccess'));
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setDownloadingDAS(false);
        }
    };

    const downloadTaxeApprentissage = async () => {
        setDownloadingTaxe(true);
        try {
            const tenant = user?.tenantSubdomain || 'demo';

            const response = await api.get('/dgi/taxe-apprentissage', {
                params: { year: taxeYear },
                headers: { 'X-Tenant-Subdomain': tenant },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `Declaration_Taxe_Apprentissage_${taxeYear}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(t('apprenticeshipTaxSuccess'));
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setDownloadingTaxe(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 bg-white/40 p-4 rounded-xl border border-slate-200/50 shadow-sm backdrop-blur-sm">
                <Link href="/dashboard/payroll">
                    <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200 hover:bg-slate-100">
                        <ArrowLeft className="h-4 w-4 text-slate-600" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('dgiTitle')}</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{t('dgiSubtitle')}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* ITS Card */}
                <Card className="border-t-4 border-t-emerald-500 shadow-sm transition-all hover:shadow-md bg-white/80 backdrop-blur">
                    <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                            {t('monthlyITS')}
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            {t('itsDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('targetMonth')}</label>
                                <select
                                    className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                                    value={itsMonth}
                                    onChange={e => setItsMonth(Number(e.target.value))}
                                >
                                    {MONTH_KEYS.map((m, i) => <option key={i} value={i + 1}>{tm(m)}</option>)}
                                </select>
                            </div>
                            <div className="w-1/3 space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('year')}</label>
                                <select
                                    className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                                    value={itsYear}
                                    onChange={e => setItsYear(Number(e.target.value))}
                                >
                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                checked={isItsGta}
                                onChange={(e) => setIsItsGta(e.target.checked)}
                            />
                            {t('gtaRegime')}
                        </label>

                        <Button
                            onClick={downloadITS}
                            disabled={downloadingITS}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-5 shadow-sm transition-all"
                        >
                            {downloadingITS ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
                            {t('downloadITSExcel')}
                        </Button>
                    </CardContent>
                </Card>

                {/* DAS Card */}
                <Card className="border-t-4 border-t-blue-500 shadow-sm transition-all hover:shadow-md bg-white/80 backdrop-blur">
                    <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                            {t('annualDAS')}
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            {t('dasDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('fiscalYear')}</label>
                            <select
                                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                value={dasYear}
                                onChange={e => setDasYear(Number(e.target.value))}
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-slate-700 font-medium pt-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                checked={isDasGta}
                                onChange={(e) => setIsDasGta(e.target.checked)}
                            />
                            {t('gtaRegime')}
                        </label>

                        <Button
                            onClick={downloadDAS}
                            disabled={downloadingDAS}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-5 shadow-sm transition-all mt-6"
                        >
                            {downloadingDAS ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
                            {t('downloadDASExcel')}
                        </Button>
                    </CardContent>
                </Card>

                {/* Taxe Apprentissage Card */}
                <Card className="border-t-4 border-t-purple-500 shadow-sm transition-all hover:shadow-md bg-white/80 backdrop-blur md:col-span-2">
                    <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                                <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                                {t('apprenticeshipTax')}
                            </CardTitle>
                            <CardDescription className="text-slate-500 mt-1">
                                {t('apprenticeshipTaxDesc')}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <select
                                className="w-32 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
                                value={taxeYear}
                                onChange={e => setTaxeYear(Number(e.target.value))}
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <Button
                                onClick={downloadTaxeApprentissage}
                                disabled={downloadingTaxe}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm transition-all"
                            >
                                {downloadingTaxe ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                {t('downloadExcel')}
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-600">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">ℹ️ {t('dgiNote')}</h4>
                <p>{t('dgiNoteContent')}</p>
            </div>
        </div>
    );
}
