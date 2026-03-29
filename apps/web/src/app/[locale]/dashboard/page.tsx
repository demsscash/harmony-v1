'use client';

import * as React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Briefcase, CreditCard, Activity, DollarSign,
    TrendingUp, ArrowUpRight, RefreshCw,
    Users, Calendar, Banknote, Network, Building2, CheckCircle, Clock, AlertCircle,
    AlertTriangle, FileWarning, UserX, X
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import api from '@/lib/api';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    isActive: boolean;
    createdAt: string;
    plan?: string;
    _count?: { users: number; employees: number; };
}

const PLAN_PRICES: Record<string, number> = {
    'Starter': 4500,
    'Pro': 12000,
    'Enterprise': 25000,
};

// MONTHS_FR removed - now uses useTranslations('monthsShort')
const PIE_COLORS = ['#94a3b8', '#3b82f6', '#a855f7'];

// Build MRR-over-time data from tenant creation dates
function buildMrrTimeline(tenants: Tenant[], monthNames: (idx: string) => string) {
    if (tenants.length === 0) return [];
    const sorted = [...tenants].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const dataMap = new Map<string, number>();
    let cumulative = 0;
    for (const t of sorted) {
        const d = new Date(t.createdAt);
        const key = `${monthNames(String(d.getMonth()))} ${d.getFullYear()}`;
        cumulative += PLAN_PRICES[t.plan || 'Starter'] || 0;
        dataMap.set(key, cumulative);
    }
    return Array.from(dataMap.entries()).map(([month, mrr]) => ({ month, mrr }));
}

export default function DashboardHome() {
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
        return <HRDashboard user={user} />;
    }

    return <SuperAdminDashboard user={user} />;
}

// ─── AlertsWidget ─────────────────────────────────────────────────────────────
function AlertsWidget({ employees, leaves }: { employees: any[]; leaves: any[] }) {
    const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
    const td = useTranslations('dashboard');
    const today = new Date();

    const alerts: { id: string; type: 'warning' | 'error' | 'info'; icon: any; title: string; desc: string; href: string }[] = [];

    // CDD expirant dans les 30 prochains jours
    const expiringCdd = employees.filter(e => {
        if (e.contractType !== 'CDD' || !e.contractEndDate) return false;
        const end = new Date(e.contractEndDate);
        const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 30;
    });
    if (expiringCdd.length > 0) {
        alerts.push({
            id: 'cdd-expiring',
            type: 'warning',
            icon: AlertTriangle,
            title: td('cddExpiring', { count: expiringCdd.length }),
            desc: expiringCdd.slice(0, 3).map(e => `${e.firstName} ${e.lastName}`).join(', ') + (expiringCdd.length > 3 ? ` +${expiringCdd.length - 3}` : ''),
            href: '/dashboard/employees',
        });
    }

    // Périodes d'essai se terminant dans 15 jours
    const expiringTrials = employees.filter(e => {
        if (!e.trialEndDate) return false;
        const end = new Date(e.trialEndDate);
        const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 15;
    });
    if (expiringTrials.length > 0) {
        alerts.push({
            id: 'trial-expiring',
            type: 'info',
            icon: Clock,
            title: td('trialExpiring', { count: expiringTrials.length }),
            desc: expiringTrials.slice(0, 3).map(e => `${e.firstName} ${e.lastName}`).join(', ') + (expiringTrials.length > 3 ? ` +${expiringTrials.length - 3}` : ''),
            href: '/dashboard/employees',
        });
    }

    // Congés en attente de validation
    const pendingLeaves = leaves.filter(l => l.status === 'PENDING');
    if (pendingLeaves.length > 0) {
        alerts.push({
            id: 'pending-leaves',
            type: 'warning',
            icon: FileWarning,
            title: td('pendingLeaveRequests', { count: pendingLeaves.length }),
            desc: td('employeesAwaitingValidation'),
            href: '/dashboard/leaves',
        });
    }

    const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));
    if (visibleAlerts.length === 0) return null;

    const colorMap = {
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
    };
    const iconColorMap = { warning: 'text-amber-500', error: 'text-red-500', info: 'text-blue-500' };

    return (
        <div className="space-y-2">
            {visibleAlerts.map(alert => (
                <div key={alert.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${colorMap[alert.type]}`}>
                    <alert.icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColorMap[alert.type]}`} />
                    <div className="flex-1 min-w-0">
                        <Link href={alert.href} className="font-semibold text-sm hover:underline">{alert.title}</Link>
                        <p className="text-xs mt-0.5 opacity-80 truncate">{alert.desc}</p>
                    </div>
                    <button onClick={() => setDismissed(prev => new Set([...prev, alert.id]))} className="shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors">
                        <X className="h-3.5 w-3.5 opacity-60" />
                    </button>
                </div>
            ))}
        </div>
    );
}

// ─── HR / Admin Dashboard ─────────────────────────────────────────────────────
function HRDashboard({ user }: { user: any }) {
    const t = useTranslations('dashboard');
    const tc = useTranslations('common');
    const [empList, setEmpList] = React.useState<any[]>([]);
    const [leaveList, setLeaveList] = React.useState<any[]>([]);
    const [deptList, setDeptList] = React.useState<any[]>([]);
    const [payrollData, setPayrollData] = React.useState<{ grossSalary: number; netSalary: number; isEstimate?: boolean } | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        Promise.all([
            api.get('/employees').catch(() => ({ data: { data: [] } })),
            api.get('/leaves').catch(() => ({ data: { data: [] } })),
            api.get('/departments').catch(() => ({ data: { data: [] } })),
            api.get('/payroll').catch(() => ({ data: { data: [] } })),
        ]).then(([empRes, leaveRes, deptRes, payrollRes]) => {
            const emp = Array.isArray(empRes.data?.data) ? empRes.data.data : Array.isArray(empRes.data) ? empRes.data : [];
            const leaves = Array.isArray(leaveRes.data?.data) ? leaveRes.data.data : Array.isArray(leaveRes.data) ? leaveRes.data : [];
            const depts = Array.isArray(deptRes.data?.data) ? deptRes.data.data : Array.isArray(deptRes.data) ? deptRes.data : [];
            const payrolls = Array.isArray(payrollRes.data?.data) ? payrollRes.data.data : Array.isArray(payrollRes.data) ? payrollRes.data : [];
            setEmpList(emp);
            setLeaveList(leaves);
            setDeptList(depts);
            // Get the latest payroll campaign
            if (payrolls.length > 0) {
                const latest = payrolls.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                setPayrollData({
                    grossSalary: Number(latest.grossSalary) || 0,
                    netSalary: Number(latest.netSalary) || 0,
                });
            } else if (emp.length > 0) {
                // Pas de campagne — montrer la somme des salaires de base comme estimation
                const totalBase = emp.reduce((sum: number, e: any) => sum + (Number(e.baseSalary) || 0), 0);
                setPayrollData({ grossSalary: totalBase, netSalary: 0, isEstimate: true });
            }
        }).finally(() => setLoading(false));
    }, []);

    // Derived stats
    const pendingLeaves = leaveList.filter(l => l.status === 'PENDING').length;

    const hrStats = [
        { label: t('employees'), value: empList.length, icon: Users, cardBg: 'bg-gradient-to-br from-blue-500 to-blue-600', iconBg: 'bg-white/20', href: '/dashboard/employees', trend: t('viewList') },
        { label: tc('pending'), value: pendingLeaves, icon: Clock, cardBg: 'bg-gradient-to-br from-amber-500 to-amber-600', iconBg: 'bg-white/20', href: '/dashboard/leaves', trend: pendingLeaves > 0 ? t('actionRequired') + ' ⚠' : t('allProcessed') + ' ✓' },
        { label: t('departments'), value: deptList.length, icon: Building2, cardBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', iconBg: 'bg-white/20', href: '/dashboard/organization', trend: t('viewStructure') },
    ];

    // Chart 1: employees per department
    const deptChartData = deptList.map(d => ({
        name: d.name?.length > 12 ? d.name.slice(0, 12) + '…' : d.name,
        employés: empList.filter(e => e.departmentId === d.id).length,
    })).filter(d => d.employés > 0);

    // Chart 2: leave distribution by type (motif)
    const MOTIF_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#94a3b8'];
    const leaveByMotifData = Object.entries(
        leaveList.reduce((acc: Record<string, number>, l) => {
            const typeName = l.leaveType?.name || 'Autre';
            acc[typeName] = (acc[typeName] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, count], i) => ({ name, value: count, color: MOTIF_COLORS[i % MOTIF_COLORS.length] }));

    const quickActions = [
        { label: t('newEmployee'), desc: t('addMember'), href: '/dashboard/employees/create', icon: Users, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-l-blue-500' },
        { label: t('leaveRequests'), desc: t('approveReject'), href: '/dashboard/leaves', icon: Calendar, color: 'violet', bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-l-violet-500' },
        { label: t('generatePayroll'), desc: t('payslips'), href: '/dashboard/payroll', icon: Banknote, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-l-emerald-500' },
        { label: t('organization'), desc: t('deptsAndGrades'), href: '/dashboard/organization', icon: Network, color: 'slate', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-l-slate-500' },
    ];

    const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
    const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm"
            >
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('hello', { name: user?.firstName || 'Admin' })} 👋</h1>
                <p className="text-slate-500 font-medium mt-1">{t('overview')}</p>
            </motion.div>

            {/* Alertes */}
            {!loading && <AlertsWidget employees={empList} leaves={leaveList} />}

            {/* KPI cards */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {hrStats.map(stat => (
                    <motion.div key={stat.label} variants={itemVariants}>
                        <Link href={stat.href}>
                            <Card className={`${stat.cardBg} shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden relative border-0`}>
                                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-20 bg-white" />
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                    <CardTitle className="text-sm font-semibold text-white/80">{stat.label}</CardTitle>
                                    <div className={`p-2.5 rounded-xl ${stat.iconBg}`}><stat.icon className="h-4 w-4 text-white" /></div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-3xl font-bold text-white">
                                        {loading ? <RefreshCw className="h-6 w-6 animate-spin text-white/50" /> : stat.value}
                                    </div>
                                    <div className="flex items-center mt-1 text-xs font-medium text-white/70">
                                        <ArrowUpRight className="h-3 w-3 mr-1 text-white/50" />{stat.trend}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>
                ))}

                {/* Masse Salariale card */}
                <motion.div variants={itemVariants}>
                    <Link href="/dashboard/payroll">
                        <Card className="bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden relative h-full border-0">
                            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-20 bg-white" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                <CardTitle className="text-sm font-semibold text-white/80">{t('monthlyPayroll')}</CardTitle>
                                <div className="p-2.5 rounded-xl bg-white/20"><Banknote className="h-4 w-4 text-white" /></div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                {loading ? (
                                    <RefreshCw className="h-6 w-6 animate-spin text-white/50" />
                                ) : payrollData ? (
                                    <div className="space-y-1">
                                        {payrollData.isEstimate ? (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-white/60">Salaires de base</span>
                                                    <span className="text-lg font-bold text-white">{payrollData.grossSalary.toLocaleString('fr-FR')} MRU</span>
                                                </div>
                                                <p className="text-[10px] text-white/40">Aucune campagne de paie</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-white/60">{t('grossLabel')}</span>
                                                    <span className="text-lg font-bold text-white">{payrollData.grossSalary.toLocaleString('fr-FR')} MRU</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-white/60">{t('netLabel')}</span>
                                                    <span className="text-lg font-bold text-white/90">{payrollData.netSalary.toLocaleString('fr-FR')} MRU</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-white/50">—</p>
                                )}
                                <div className="flex items-center mt-1 text-xs font-medium text-white/70">
                                    <ArrowUpRight className="h-3 w-3 mr-1 text-white/50" />{t('lastCampaign')}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>
            </motion.div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Bar chart — effectif par département */}
                <Card className="lg:col-span-4 shadow-sm border-slate-200/60 bg-white/90">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-base text-slate-900">{t('staffByDept')}</CardTitle>
                                <CardDescription className="text-xs">{t('employeesPerDept')}</CardDescription>
                            </div>
                            <Link href="/dashboard/employees" className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
                                {t('viewAll')} <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 h-72">
                        {loading ? (
                            <div className="h-full flex items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-slate-300" /></div>
                        ) : deptChartData.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                <Users className="h-10 w-10 text-slate-200" />
                                <p className="text-sm font-medium">{t('noEmployeesInDepts')}</p>
                                <p className="text-xs">{t('assignEmployeesToDept')}</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={deptChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc', fontSize: 12 }}
                                        formatter={(v: any) => [v, t('employees')]}
                                        cursor={{ fill: '#f1f5f9' }}
                                    />
                                    <Bar dataKey="employés" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={48} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Pie chart — congés par motif */}
                <Card className="lg:col-span-3 shadow-sm border-slate-200/60 bg-white/90 flex flex-col">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-base text-slate-900">{t('leaveByMotif')}</CardTitle>
                                <CardDescription className="text-xs">{t('leaveMotifDistribution')}</CardDescription>
                            </div>
                            <Link href="/dashboard/leaves" className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
                                {t('manage')} <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 pt-4 flex items-center justify-center">
                        {loading ? (
                            <RefreshCw className="h-6 w-6 animate-spin text-slate-300" />
                        ) : leaveByMotifData.length === 0 ? (
                            <div className="text-slate-400 text-sm text-center">
                                <Calendar className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                                {t('noLeaveRequest')}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={leaveByMotifData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {leaveByMotifData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc', fontSize: 12 }}
                                        formatter={(v: any, name: any) => [`${v} ${t('requests')}`, name]}
                                    />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick actions */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">{t('quickAccess')}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {quickActions.map(action => (
                        <Link key={action.href} href={action.href}>
                            <Card className={`border-l-4 ${action.border} bg-white/80 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer h-full`}>
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${action.bg} ${action.text} shrink-0`}>
                                        <action.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{action.label}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{action.desc}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Super Admin Dashboard ─────────────────────────────────────────────────────
function SuperAdminDashboard({ user }: { user: any }) {
    const t = useTranslations('dashboard');
    const tms = useTranslations('monthsShort');
    const [tenants, setTenants] = React.useState<Tenant[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        api.get('/tenants').then(res => {
            const list = res.data?.data || res.data;
            if (Array.isArray(list)) setTenants(list);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const activeTenants = tenants.filter(t => t.isActive);
    const mrr = tenants.reduce((acc, t) => acc + (PLAN_PRICES[t.plan || 'Starter'] || 0), 0);
    const premiumCount = tenants.filter(t => t.plan === 'Pro' || t.plan === 'Enterprise').length;
    const suspended = tenants.length - activeTenants.length;
    const recentTenants = [...tenants].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
    const mrrTimeline = buildMrrTimeline(tenants, (idx) => tms(idx));

    const planData = [
        { name: 'Starter', value: tenants.filter(t => (t.plan || 'Starter') === 'Starter').length },
        { name: 'Pro', value: tenants.filter(t => t.plan === 'Pro').length },
        { name: 'Enterprise', value: tenants.filter(t => t.plan === 'Enterprise').length },
    ].filter(d => d.value > 0);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };
    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    const stats = [
        { label: t('mrrTotal'), value: loading ? '…' : `${mrr.toLocaleString()} MRU`, icon: DollarSign, cardBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', iconBg: 'bg-white/20', trend: t('instancesBilled', { count: tenants.length }) },
        { label: t('activeInstances'), value: loading ? '…' : String(activeTenants.length), icon: Briefcase, cardBg: 'bg-gradient-to-br from-blue-500 to-blue-600', iconBg: 'bg-white/20', trend: t('totalDeployed', { count: tenants.length }) },
        { label: t('premiumPlans'), value: loading ? '…' : String(premiumCount), icon: CreditCard, cardBg: 'bg-gradient-to-br from-purple-500 to-purple-600', iconBg: 'bg-white/20', trend: t('proEnterprise') },
        { label: t('suspended'), value: loading ? '…' : String(suspended), icon: Activity, cardBg: 'bg-gradient-to-br from-slate-600 to-slate-700', iconBg: 'bg-white/20', trend: suspended === 0 ? t('networkStable') + ' ✓' : t('actionRequired') + ' ⚠' },
    ];

    return (
        <div className="space-y-8">
            {/* Welcome header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm"
            >
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('adminConsole')} 👋</h1>
                <p className="text-slate-500 font-medium mt-1">
                    {t('adminWelcome', { name: user?.firstName || 'Super Admin' })}
                </p>
            </motion.div>

            {/* KPI Cards */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <motion.div key={stat.label} variants={itemVariants}>
                        <Card className={`${stat.cardBg} shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden relative border-0`}>
                            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-20 bg-white" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                <CardTitle className="text-sm font-semibold text-white/80">{stat.label}</CardTitle>
                                <div className={`p-2.5 rounded-xl ${stat.iconBg}`}><stat.icon className="h-4 w-4 text-white" /></div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-bold text-white flex items-center gap-2">
                                    {loading ? <RefreshCw className="h-6 w-6 animate-spin text-white/50" /> : stat.value}
                                </div>
                                <div className="flex items-center mt-1 text-xs font-medium text-white/70">
                                    <TrendingUp className="h-3 w-3 mr-1 text-white/50" />{stat.trend}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-7">

                {/* Area chart — MRR cumulatif */}
                <Card className="lg:col-span-4 shadow-sm border-slate-200/60 bg-white/90">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-base text-slate-900">{t('mrrGrowth')}</CardTitle>
                                <CardDescription className="text-xs">{t('mrrCumulative')}</CardDescription>
                            </div>
                            <Link href="/dashboard/billing" className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
                                {t('manage')} <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 h-72">
                        {loading ? (
                            <div className="h-full flex items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-slate-300" /></div>
                        ) : mrrTimeline.length < 2 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                <TrendingUp className="h-10 w-10 text-slate-200" />
                                <p className="text-sm font-medium">{t('notEnoughData')}</p>
                                <p className="text-xs">{t('chartAppearsAt2')}</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mrrTimeline} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc', fontSize: 12 }}
                                        formatter={(v: any) => [`${Number(v).toLocaleString()} MRU`, 'MRR']}
                                        labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                                    />
                                    <Area type="monotone" dataKey="mrr" stroke="#3b82f6" strokeWidth={2.5} fill="url(#mrrGrad)" dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Pie chart — Plan distribution */}
                <Card className="lg:col-span-3 shadow-sm border-slate-200/60 bg-white/90 flex flex-col">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-base text-slate-900">{t('planDistribution')}</CardTitle>
                        <CardDescription className="text-xs">{t('instancesByPlan')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pt-4 flex items-center justify-center">
                        {loading ? (
                            <RefreshCw className="h-6 w-6 animate-spin text-slate-300" />
                        ) : planData.length === 0 ? (
                            <div className="text-slate-400 text-sm text-center">
                                <CreditCard className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                                {t('noInstances')}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={planData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {planData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc', fontSize: 12 }}
                                        formatter={(v: any, name: any) => [`${v} instance${Number(v) > 1 ? 's' : ''}`, name]}
                                    />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Instances */}
            <Card className="shadow-sm border-slate-200/60 bg-white/90">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-base text-slate-900">{t('recentInstances')}</CardTitle>
                            <CardDescription className="text-xs">{t('recentClients')}</CardDescription>
                        </div>
                        <Link href="/dashboard/tenants" className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
                            {t('viewAll')} <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-slate-300" /></div>
                    ) : recentTenants.length === 0 ? (
                        <div className="text-center text-slate-400 py-8 text-sm">{t('noInstanceDeployed')}</div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                            {recentTenants.map((tenant) => (
                                <div key={tenant.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 transition-all group">
                                    <div className="relative shrink-0">
                                        <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white text-xs">
                                            {tenant.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${tenant.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{tenant.name}</p>
                                        <p className="text-xs text-slate-400 truncate">{tenant.subdomain}.harmony.mr</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
