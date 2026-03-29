'use client';

import * as React from 'react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    Banknote, PlayCircle, Loader2, FileText,
    CheckCircle2, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { DataTable, Column } from '@/components/DataTable';
import { ExportButtons, ExportColumn } from '@/components/ExportButtons';

interface Payroll {
    id: string;
    month: number;
    year: number;
    grossSalary: number;
    netSalary: number;
    employeeCount: number;
    status: 'DRAFT' | 'VALIDATED' | 'PAID';
}

const STATUS_CONFIG = {
    DRAFT: { color: 'bg-slate-100 text-slate-600 border-slate-200' },
    VALIDATED: { color: 'bg-blue-100 text-blue-700 border-blue-200' },
    PAID: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const MONTH_KEYS = ['january','february','march','april','may','june','july','august','september','october','november','december'];

export default function PayrollPage() {
    const t = useTranslations('payroll');
    const tm = useTranslations('months');
    const tc = useTranslations('common');
    const [payrolls, setPayrolls] = React.useState<Payroll[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [generating, setGenerating] = React.useState(false);
    const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());

    const fetchPayrolls = async () => {
        try {
            const res = await api.get('/payrolls');
            if (res.data.success) setPayrolls(res.data.data);
        } catch (e) {
            toast.error(t('errorLoading'));
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPayrolls();
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            // First, create the Payroll Campaign
            const campaignRes = await api.post('/payrolls', { month: selectedMonth, year: selectedYear });
            const campaignId = campaignRes.data.data.id;

            // Then instruct the server to generate payslips for that campaign
            await api.post(`/payrolls/${campaignId}/generate`);

            toast.success(t('generatedFor', { month: tm(MONTH_KEYS[selectedMonth - 1]), year: String(selectedYear) }));
            fetchPayrolls();
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('errorGenerating'));
        } finally {
            setGenerating(false);
        }
    };

    const handleValidate = async (id: string) => {
        try {
            await api.patch(`/payrolls/${id}/validate`);
            toast.success(t('validated'));
            fetchPayrolls();
        } catch (e: any) {
            toast.error(e.response?.data?.error || tc('error'));
        }
    };

    const totalNet = payrolls.filter(p => p.status === 'VALIDATED' || p.status === 'PAID')
        .reduce((acc, p) => acc + p.netSalary, 0);

    const getStatusLabel = (status: Payroll['status']) => {
        if (status === 'DRAFT') return t('statusDraft');
        if (status === 'VALIDATED') return t('statusValidated');
        return t('statusPaid');
    };

    const columns: Column<Payroll>[] = [
        {
            key: 'employees',
            header: t('assignedEmployees'),
            render: (p) => (
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {p.employeeCount || 0}
                    </div>
                    <span className="font-semibold text-slate-800">
                        {t('payslips')}
                    </span>
                </div>
            ),
        },
        {
            key: 'period',
            header: t('period'),
            accessor: (p) => p.year * 100 + p.month,
            sortable: true,
            render: (p) => (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {tm(MONTH_KEYS[p.month - 1])} {p.year}
                </div>
            ),
        },
        {
            key: 'grossSalary',
            header: t('totalGross'),
            accessor: (p) => p.grossSalary,
            sortable: true,
            render: (p) => (
                <span className="font-semibold text-slate-800">{p.grossSalary.toLocaleString()} MRU</span>
            ),
        },
        {
            key: 'netSalary',
            header: t('totalNet'),
            accessor: (p) => p.netSalary,
            sortable: true,
            render: (p) => (
                <span className="font-bold text-emerald-700">{p.netSalary.toLocaleString()} MRU</span>
            ),
        },
        {
            key: 'status',
            header: tc('status'),
            accessor: (p) => p.status,
            sortable: true,
            render: (p) => {
                const cfg = STATUS_CONFIG[p.status];
                return (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
                        {getStatusLabel(p.status)}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: tc('actions'),
            className: 'text-right',
            headerClassName: 'text-right',
            render: (p) => (
                <div className="flex gap-1.5 justify-end">
                    {p.status === 'DRAFT' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleValidate(p.id); }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 transition-colors"
                        >
                            <CheckCircle2 className="h-3 w-3 inline mr-1" />{` `}{t('validate')}
                        </button>
                    )}
                    <Link href={`/dashboard/payroll/${p.id}`}>
                        <button className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors">
                            <FileText className="h-3 w-3 inline mr-1" />{` `}{t('slips')}
                        </button>
                    </Link>
                </div>
            ),
        },
    ];

    const exportColumns: ExportColumn[] = [
        { header: t('assignedEmployees'), accessor: (p: Payroll) => p.employeeCount || 0 },
        { header: t('period'), accessor: (p: Payroll) => `${tm(MONTH_KEYS[p.month - 1])} ${p.year}` },
        { header: t('totalGross'), accessor: (p: Payroll) => p.grossSalary },
        { header: t('totalNet'), accessor: (p: Payroll) => p.netSalary },
        { header: tc('status'), accessor: (p: Payroll) => getStatusLabel(p.status) },
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/40 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-emerald-600" />{` `}{t('title')}
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">{t('subtitle')}</p>
                </div>

                {/* Generate controls */}
                <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
                    <Link href="/dashboard/payroll/dgi">
                        <Button variant="outline" className="gap-2 text-slate-700 bg-white shadow-sm mr-2 h-9 border-slate-300">
                            <FileText className="h-4 w-4 text-blue-600" />{` `}{t('dgiDeclarations')}
                        </Button>
                    </Link>
                    <select
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 shadow-sm"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(Number(e.target.value))}
                    >
                        {MONTH_KEYS.map((m, i) => <option key={i} value={i + 1}>{tm(m)}</option>)}
                    </select>
                    <select
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700"
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                    >
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <Button onClick={handleGenerate} disabled={generating} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                        {t('generate')}
                    </Button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: t('totalPayslips'), value: payrolls.length, color: 'text-slate-700', bg: 'bg-white', border: 'border-slate-200' },
                    { label: t('pendingValidation'), value: payrolls.filter(p => p.status === 'DRAFT').length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                    { label: t('netPayroll'), value: `${totalNet.toLocaleString()} MRU`, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                ].map(kpi => (
                    <Card key={kpi.label} className={`border ${kpi.border} ${kpi.bg} shadow-sm`}>
                        <CardContent className="pt-4 pb-4">
                            <div className={`text-2xl font-black ${kpi.color}`}>{loading ? '...' : kpi.value}</div>
                            <div className="text-xs font-semibold text-slate-500 mt-0.5">{kpi.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Payrolls Table */}
            <DataTable<Payroll>
                data={payrolls}
                columns={columns}
                rowKey={(row) => row.id}
                searchable={false}
                loading={loading}
                headerExtra={
                    <ExportButtons
                        data={payrolls}
                        columns={exportColumns}
                        filename="paie"
                    />
                }
                pageSize={15}
                emptyState={
                    <div>
                        <Banknote className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                        <p className="font-medium">{t('noPayslips')}</p>
                        <p className="text-xs mt-1">{t('noPayslipsDesc')}</p>
                    </div>
                }
                texts={{
                    showing: tc('showing'),
                    of: tc('of'),
                    rows: tc('rows'),
                }}
            />
        </div>
    );
}
