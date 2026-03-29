'use client';

import * as React from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
    Calendar, CheckCircle2, XCircle, Clock, Plus,
    ChevronDown, Loader2, User, BarChart3, Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/DataTable';
import { ExportButtons, type ExportColumn } from '@/components/ExportButtons';

interface LeaveRequest {
    id: string;
    startDate: string;
    endDate: string;
    reason?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    leaveType?: { name: string; color?: string; };
    employee?: { firstName: string; lastName: string; };
}

const STATUS_CONFIG = {
    PENDING: { label: 'PENDING', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    APPROVED: { label: 'APPROVED', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    REJECTED: { label: 'REJECTED', color: 'bg-red-100 text-red-600 border-red-200', icon: XCircle },
};

function BalancesTab({ loading, allBalances, balanceLeaveTypes, currentYear, initializingAll, onFetch, onInitializeAll }: {
    loading: boolean;
    allBalances: any[];
    balanceLeaveTypes: string[];
    currentYear: number;
    initializingAll: boolean;
    onFetch: () => void;
    onInitializeAll: () => void;
}) {
    const t = useTranslations('leaves');
    const tc = useTranslations('common');

    React.useEffect(() => { onFetch(); }, []);

    const balanceColumns: Column<any>[] = [
        {
            key: 'employee',
            header: t('employee'),
            accessor: (row) => `${row.firstName} ${row.lastName}`,
            sortable: true,
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <div>
                        <span className="font-semibold text-slate-800 text-sm">{row.firstName} {row.lastName}</span>
                        <span className="text-xs text-slate-400 ml-2">{row.matricule}</span>
                    </div>
                </div>
            ),
        },
        ...balanceLeaveTypes.map((typeName) => ({
            key: typeName,
            header: typeName,
            accessor: (row: any) => {
                const b = row.balances.find((bal: any) => bal.leaveTypeName === typeName);
                return b ? Number(b.remaining) : -1;
            },
            sortable: true,
            render: (row: any) => {
                const b = row.balances.find((bal: any) => bal.leaveTypeName === typeName);
                if (!b) return <span className="text-slate-300 text-xs">—</span>;
                const remaining = Number(b.remaining);
                const entitled = Number(b.entitled);
                const pct = entitled > 0 ? (remaining / entitled) * 100 : 0;
                const color = pct > 50 ? 'text-emerald-700' : pct > 20 ? 'text-amber-700' : 'text-red-600';
                return (
                    <div className="text-center">
                        <span className={`font-bold text-sm ${color}`}>{remaining}</span>
                        <span className="text-slate-400 text-xs"> / {entitled}</span>
                    </div>
                );
            },
        })),
    ];

    return (
        <DataTable
            data={allBalances}
            columns={balanceColumns}
            rowKey={(row) => row.id}
            searchable={true}
            searchPlaceholder={tc('search') + '...'}
            searchFields={[
                (row) => `${row.firstName} ${row.lastName}`,
                (row) => row.matricule || '',
            ]}
            loading={loading}
            emptyState={
                <div className="text-center text-slate-400">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                    <p className="font-medium text-sm">{t('noBalancesConfigured')}</p>
                    <p className="text-xs mt-1">{t('clickInitializeAll')}</p>
                </div>
            }
            headerExtra={
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onInitializeAll}
                    disabled={initializingAll}
                    className="gap-2 border-slate-200"
                >
                    {initializingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
                    {t('initializeAll', { year: currentYear })}
                </Button>
            }
            texts={{
                search: tc('search'),
                noResults: tc('noResults', { query: '' }),
                loading: tc('loading'),
                showing: tc('showing'),
                of: tc('of'),
                rows: tc('rows'),
                page: tc('page'),
                to: tc('to'),
            }}
        />
    );
}

export default function LeavesPage() {
    const t = useTranslations('leaves');
    const tc = useTranslations('common');
    const [leaves, setLeaves] = React.useState<LeaveRequest[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showForm, setShowForm] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [leaveTypes, setLeaveTypes] = React.useState<any[]>([]);
    const [form, setForm] = React.useState({ startDate: '', endDate: '', leaveTypeId: '', reason: '' });
    const [statusFilter, setStatusFilter] = React.useState<string>('all');
    const [activeTab, setActiveTab] = React.useState<'requests' | 'balances'>('requests');

    // ─── Balances state ─────────────────────────────
    const [allBalances, setAllBalances] = React.useState<any[]>([]);
    const [loadingBalances, setLoadingBalances] = React.useState(false);
    const [initializingAll, setInitializingAll] = React.useState(false);
    const [balanceLeaveTypes, setBalanceLeaveTypes] = React.useState<string[]>([]);
    const currentYear = new Date().getFullYear();

    const fetchLeaves = async () => {
        try {
            const res = await api.get('/leaves');
            if (res.data.success) setLeaves(res.data.data);
        } catch (e) {
            toast.error(tc('error'));
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            const res = await api.get('/leaves/types');
            if (res.data.success) setLeaveTypes(res.data.data);
        } catch (e) { /* silent */ }
    };

    const fetchAllBalances = async () => {
        setLoadingBalances(true);
        try {
            const res = await api.get(`/leaves/balances/all?year=${currentYear}`);
            if (res.data.success) {
                const data = res.data.data;
                setAllBalances(data);
                // Extraire les types de congé uniques
                const types = new Set<string>();
                for (const emp of data) {
                    for (const b of emp.balances) {
                        types.add(b.leaveTypeName);
                    }
                }
                setBalanceLeaveTypes(Array.from(types));
            }
        } catch { toast.error(t('errorLoading')); }
        finally { setLoadingBalances(false); }
    };

    const handleInitializeAll = async () => {
        setInitializingAll(true);
        try {
            const empsRes = await api.get('/employees');
            const employees = empsRes.data.success ? empsRes.data.data : [];
            let count = 0;
            for (const emp of employees) {
                await api.post('/leaves/balances/initialize', { employeeId: emp.id, year: currentYear });
                count++;
            }
            toast.success(t('balancesInitialized', { count }));
            fetchAllBalances();
        } catch (e: any) {
            toast.error(e.response?.data?.error || tc('error'));
        } finally {
            setInitializingAll(false);
        }
    };

    React.useEffect(() => {
        fetchLeaves();
        fetchLeaveTypes();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/leaves', form);
            toast.success(tc('success'));
            setShowForm(false);
            setForm({ startDate: '', endDate: '', leaveTypeId: '', reason: '' });
            fetchLeaves();
        } catch (e: any) {
            toast.error(e.response?.data?.error || tc('error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.patch(`/leaves/${id}/process`, { status: "APPROVED" });
            toast.success(t('approve'));
            fetchLeaves();
        } catch (e: any) {
            toast.error(e.response?.data?.error || tc('error'));
        }
    };

    const handleReject = async (id: string) => {
        try {
            await api.patch(`/leaves/${id}/process`, { status: "REJECTED", reason: t('rejectedByManagement') });
            toast.success(t('reject'));
            fetchLeaves();
        } catch (e: any) {
            toast.error(e.response?.data?.error || tc('error'));
        }
    };

    const pending = leaves.filter(l => l.status === 'PENDING');
    const approved = leaves.filter(l => l.status === 'APPROVED');
    const filteredLeaves = statusFilter === 'all' ? leaves : leaves.filter(l => l.status === statusFilter);

    // ─── DataTable columns ──────────────────────────────
    const columns: Column<LeaveRequest>[] = [
        {
            key: 'employee',
            header: t('employee'),
            accessor: (row) => row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '',
            sortable: true,
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <span className="font-semibold text-slate-800">
                        {row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '—'}
                    </span>
                </div>
            ),
        },
        {
            key: 'leaveType',
            header: t('leaveType'),
            accessor: (row) => row.leaveType?.name || '',
            sortable: true,
            render: (row) => (
                <span className="text-slate-600">{row.leaveType?.name || '—'}</span>
            ),
        },
        {
            key: 'dates',
            header: tc('date'),
            accessor: (row) => row.startDate,
            sortable: true,
            render: (row) => (
                <span className="text-slate-600 text-xs">
                    {new Date(row.startDate).toLocaleDateString('fr-FR')} → {new Date(row.endDate).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'status',
            header: tc('status'),
            accessor: (row) => row.status,
            sortable: true,
            render: (row) => {
                const cfg = STATUS_CONFIG[row.status];
                const Icon = cfg.icon;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
                        <Icon className="h-3 w-3" /> {cfg.label === 'PENDING' ? tc('pending') : cfg.label === 'APPROVED' ? tc('approved') : tc('rejected')}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: tc('actions'),
            className: 'text-right',
            headerClassName: 'text-right',
            render: (row) => row.status === 'PENDING' ? (
                <div className="flex gap-1.5 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleApprove(row.id); }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 transition-colors"
                    >
                        ✓ {t('approve')}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleReject(row.id); }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 transition-colors"
                    >
                        ✗ {t('reject')}
                    </button>
                </div>
            ) : null,
        },
    ];

    // ─── Export columns ─────────────────────────────────
    const exportColumns: ExportColumn[] = [
        { header: t('employee'), accessor: (row) => row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '' },
        { header: t('leaveType'), accessor: (row) => row.leaveType?.name || '' },
        { header: t('startDate'), accessor: (row) => new Date(row.startDate).toLocaleDateString('fr-FR') },
        { header: t('endDate'), accessor: (row) => new Date(row.endDate).toLocaleDateString('fr-FR') },
        { header: tc('status'), accessor: (row) => row.status === 'PENDING' ? tc('pending') : row.status === 'APPROVED' ? tc('approved') : tc('rejected') },
        { header: t('reason'), accessor: (row) => row.reason || '' },
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" /> {t('title')}
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">{t('subtitle')}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'requests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Calendar className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                    {t('requests')}
                </button>
                <button
                    onClick={() => setActiveTab('balances')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'balances' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <BarChart3 className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                    {t('balances')}
                </button>
            </div>

            {/* ═══════════════ BALANCES TAB ═══════════════ */}
            {activeTab === 'balances' && (
                <BalancesTab
                    loading={loadingBalances}
                    allBalances={allBalances}
                    balanceLeaveTypes={balanceLeaveTypes}
                    currentYear={currentYear}
                    initializingAll={initializingAll}
                    onFetch={fetchAllBalances}
                    onInitializeAll={handleInitializeAll}
                />
            )}

            {/* ═══════════════ REQUESTS TAB ═══════════════ */}
            {activeTab === 'requests' && <>
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: tc('pending'), value: pending.length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                    { label: tc('approved'), value: approved.length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                    { label: tc('all'), value: leaves.length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                ].map(kpi => (
                    <Card key={kpi.label} className={`border ${kpi.border} ${kpi.bg} shadow-sm`}>
                        <CardContent className="pt-4 pb-4">
                            <div className={`text-3xl font-black ${kpi.color}`}>{loading ? '…' : kpi.value}</div>
                            <div className="text-xs font-semibold text-slate-500 mt-0.5">{kpi.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* New Leave Form */}
            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
                        <CardHeader className="pb-3 border-b border-blue-100">
                            <CardTitle className="text-sm font-bold text-blue-800">{t('newRequest')}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-600 uppercase">{t('startDate')}</label>
                                    <Input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-600 uppercase">{t('endDate')}</label>
                                    <Input type="date" required value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                                </div>
                                {leaveTypes.length > 0 && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">{t('leaveType')}</label>
                                        <div className="relative">
                                            <select
                                                required
                                                className="w-full h-10 appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                                                value={form.leaveTypeId}
                                                onChange={e => setForm({ ...form, leaveTypeId: e.target.value })}
                                            >
                                                <option value="" disabled>{t('leaveType')}...</option>
                                                {leaveTypes.map(lt => (
                                                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-xs font-semibold text-slate-600 uppercase">{t('reason')}</label>
                                    <Input placeholder={t('reason') + '...'} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
                                </div>
                                <div className="sm:col-span-2 flex gap-2 justify-end">
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{tc('cancel')}</Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                                        {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                        {tc('submit')}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Leaves DataTable */}
            <DataTable<LeaveRequest>
                data={filteredLeaves}
                columns={columns}
                rowKey={(row) => row.id}
                searchable={true}
                searchPlaceholder={tc('search') + '...'}
                searchFields={[
                    (row) => row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '',
                    (row) => row.leaveType?.name || '',
                ]}
                loading={loading}
                emptyState={
                    <div className="text-center text-slate-400">
                        <Calendar className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                        <p className="font-medium">{leaves.length === 0 ? t('noLeaves') : tc('noResults', { query: '' })}</p>
                    </div>
                }
                headerExtra={
                    <>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="h-9 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 outline-none shadow-sm"
                        >
                            <option value="all">{tc('all')}</option>
                            <option value="PENDING">{tc('pending')}</option>
                            <option value="APPROVED">{tc('approved')}</option>
                            <option value="REJECTED">{tc('rejected')}</option>
                        </select>
                        <ExportButtons
                            data={filteredLeaves}
                            columns={exportColumns}
                            filename="conges"
                        />
                        <Button onClick={() => setShowForm(!showForm)} className="h-9 bg-blue-600 hover:bg-blue-700 gap-2">
                            <Plus className="h-4 w-4" /> {t("newRequest")}
                        </Button>
                    </>
                }
                texts={{
                    search: tc('search'),
                    noResults: tc('noResults', { query: '' }),
                    loading: tc('loading'),
                    showing: tc('showing'),
                    of: tc('of'),
                    rows: tc('rows'),
                    page: tc('page'),
                    to: tc('to'),
                }}
            />
            </>}
        </div>
    );
}
