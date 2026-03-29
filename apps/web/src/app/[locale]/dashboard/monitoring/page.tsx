'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import {
    Activity, Server, Clock, AlertTriangle, Database, Cpu, HardDrive,
    Search, ChevronLeft, ChevronRight, RefreshCw, Shield, Users, Building2,
    TrendingUp, Zap, Eye, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ─── Types ───────────────────────────────────────────────
interface HealthData {
    status: string;
    db: string;
    memory: { rss: number; heapUsed: number; heapTotal: number };
    uptime: number;
    requestStats: {
        requestsPerMinute: number;
        errorRate: number;
        avgResponseTime: number;
        totalRequests24h: number;
    };
}

interface MetricsData {
    requestsPerMinute: number;
    errorRate: number;
    avgResponseTime: number;
    totalRequests24h: number;
    topSlowEndpoints: Array<{ path: string; method: string; avgMs: number; count: number }>;
    requestsOverTime: Array<{ time: string; requests: number; errors: number; avgMs: number }>;
    statusCodeDistribution: Record<string, number>;
    uptime: number;
}

interface TenantHealth {
    id: string;
    name: string;
    subdomain: string;
    isActive: boolean;
    employeeCount: number;
    userCount: number;
    lastActivity: string | null;
    createdAt: string;
}

interface AuditLogEntry {
    id: string;
    tenantId: string | null;
    userId: string | null;
    action: string;
    resource: string;
    resourceId: string | null;
    ip: string | null;
    statusCode: number | null;
    method: string | null;
    path: string | null;
    createdAt: string;
    tenant: { name: string; subdomain: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────
function formatUptime(seconds: number) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}j ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function actionBadge(action: string) {
    if (action.startsWith('CREATE')) return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: action };
    if (action.startsWith('UPDATE') || action.startsWith('PROCESS') || action.startsWith('TOGGLE') || action.startsWith('GENERATE')) return { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: action };
    if (action.startsWith('DELETE')) return { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: action };
    if (action.includes('LOGIN') || action === 'LOGOUT' || action.includes('PASSWORD')) return { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: action };
    return { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: action };
}

// ─── Main Component ──────────────────────────────────────
export default function MonitoringPage() {
    const { user } = useAuthStore();
    const t = useTranslations('monitoring');
    const tc = useTranslations('common');
    const [activeTab, setActiveTab] = React.useState(0);
    const [loading, setLoading] = React.useState(true);

    // Data states
    const [health, setHealth] = React.useState<HealthData | null>(null);
    const [metrics, setMetrics] = React.useState<MetricsData | null>(null);
    const [tenants, setTenants] = React.useState<TenantHealth[]>([]);
    const [auditLogs, setAuditLogs] = React.useState<AuditLogEntry[]>([]);
    const [auditTotal, setAuditTotal] = React.useState(0);
    const [auditPage, setAuditPage] = React.useState(1);
    const [auditTotalPages, setAuditTotalPages] = React.useState(1);

    // Filters
    const [tenantSearch, setTenantSearch] = React.useState('');
    const [auditActionFilter, setAuditActionFilter] = React.useState('');
    const [auditSearch, setAuditSearch] = React.useState('');

    const timeAgo = (dateStr: string | null) => {
        if (!dateStr) return t('never');
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return t('justNow');
        if (mins < 60) return t('agoMinutes', { count: String(mins) });
        const hours = Math.floor(mins / 60);
        if (hours < 24) return t('agoHours', { count: String(hours) });
        const days = Math.floor(hours / 24);
        return t('agoDays', { count: String(days) });
    }

    const healthIndicator = (lastActivity: string | null, isActive: boolean) => {
        if (!isActive) return { color: 'bg-red-500', label: t('suspended') };
        if (!lastActivity) return { color: 'bg-slate-400', label: t('inactive') };
        const days = Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000);
        if (days <= 1) return { color: 'bg-emerald-500', label: t('active') };
        if (days <= 7) return { color: 'bg-amber-500', label: t('moderate') };
        return { color: 'bg-red-400', label: t('dormant') };
    }

    const fetchHealth = async () => {
        try {
            const res = await api.get('/monitoring/health');
            setHealth(res.data.data);
        } catch { }
    };

    const fetchMetrics = async () => {
        try {
            const res = await api.get('/monitoring/metrics');
            setMetrics(res.data.data);
        } catch { }
    };

    const fetchTenants = async () => {
        try {
            const res = await api.get('/monitoring/tenants-health');
            setTenants(res.data.data);
        } catch { }
    };

    const fetchAuditLogs = async (page = 1) => {
        try {
            const params: any = { page, limit: 15 };
            if (auditActionFilter) params.action = auditActionFilter;
            const res = await api.get('/monitoring/audit-logs', { params });
            setAuditLogs(res.data.data.logs);
            setAuditTotal(res.data.data.total);
            setAuditTotalPages(res.data.data.totalPages);
            setAuditPage(res.data.data.page);
        } catch { }
    };

    const fetchAll = async () => {
        setLoading(true);
        await Promise.all([fetchHealth(), fetchMetrics(), fetchTenants(), fetchAuditLogs()]);
        setLoading(false);
    };

    React.useEffect(() => {
        fetchAll();
        const interval = setInterval(() => {
            fetchHealth();
            fetchMetrics();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    React.useEffect(() => {
        fetchAuditLogs(1);
    }, [auditActionFilter]);

    if (user?.role !== 'SUPER_ADMIN') {
        return <div className="text-center py-20 text-slate-500">{t('unauthorized')}</div>;
    }

    const tabs = [
        { label: t('tabOverview'), icon: Eye },
        { label: t('tabInstances'), icon: Building2 },
        { label: t('tabAudit'), icon: Shield },
        { label: t('tabPerformance'), icon: Activity },
    ];

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
        t.subdomain.toLowerCase().includes(tenantSearch.toLowerCase())
    );

    const chartData = metrics?.requestsOverTime.map(d => ({
        ...d,
        time: new Date(d.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    })) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
                    <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
                </div>
                <Button
                    variant="outline" size="sm"
                    onClick={fetchAll}
                    className="gap-2"
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    {t('refresh')}
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                {tabs.map((tab, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveTab(i)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === i
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading && !health ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <>
                    {/* Tab 0: Vue d'ensemble */}
                    {activeTab === 0 && health && metrics && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            {/* Status Bar */}
                            <div className={`flex items-center gap-3 p-4 rounded-xl border ${health.status === 'healthy'
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-amber-50 border-amber-200'
                                }`}>
                                {health.status === 'healthy'
                                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    : <AlertTriangle className="h-5 w-5 text-amber-500" />
                                }
                                <span className="font-semibold text-sm">
                                    {health.status === 'healthy' ? t('allSystemsOk') : t('systemDegraded')}
                                </span>
                                <span className="ml-auto text-xs text-slate-500">{t('uptime')}: {formatUptime(health.uptime)}</span>
                            </div>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                <KPICard
                                    title={t('instances')}
                                    value={tenants.length}
                                    subtitle={t('activeCount', { count: String(tenants.filter(tn => tn.isActive).length) })}
                                    icon={Building2}
                                    color="blue"
                                />
                                <KPICard
                                    title={t('reqPerMin')}
                                    value={health.requestStats.requestsPerMinute}
                                    subtitle={t('last5min')}
                                    icon={Zap}
                                    color="indigo"
                                />
                                <KPICard
                                    title={t('responseTime')}
                                    value={`${health.requestStats.avgResponseTime}ms`}
                                    subtitle={t('avg1h')}
                                    icon={Clock}
                                    color="emerald"
                                    alert={health.requestStats.avgResponseTime > 500}
                                />
                                <KPICard
                                    title={t('errorRate')}
                                    value={`${health.requestStats.errorRate}%`}
                                    subtitle={t('lastHour')}
                                    icon={AlertTriangle}
                                    color="amber"
                                    alert={health.requestStats.errorRate > 5}
                                />
                                <KPICard
                                    title={t('req24h')}
                                    value={health.requestStats.totalRequests24h.toLocaleString()}
                                    subtitle={t('totalCumulated')}
                                    icon={TrendingUp}
                                    color="violet"
                                />
                            </div>

                            {/* System Resources */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                                            <Database className="h-4 w-4" />{` `}{t('database')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2">
                                            <div className={`h-3 w-3 rounded-full ${health.db === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            <span className="font-bold text-lg">{health.db === 'ok' ? t('connected') : t('dbError')}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                                            <Cpu className="h-4 w-4" />{` `}{t('heapMemory')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <span className="font-bold text-lg">{health.memory.heapUsed} / {health.memory.heapTotal} MB</span>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all"
                                                    style={{ width: `${Math.min(100, (health.memory.heapUsed / health.memory.heapTotal) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                                            <HardDrive className="h-4 w-4" />{` `}{t('rssMemory')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <span className="font-bold text-lg">{health.memory.rss} MB</span>
                                        <p className="text-xs text-slate-500 mt-1">{t('processMemory')}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Mini chart */}
                            {chartData.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold">{t('requests24h')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData}>
                                                    <defs>
                                                        <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                                                    <YAxis tick={{ fontSize: 11 }} />
                                                    <Tooltip />
                                                    <Area type="monotone" dataKey="requests" stroke="#3b82f6" fill="url(#colorReq)" strokeWidth={2} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    )}

                    {/* Tab 1: Santé des Instances */}
                    {activeTab === 1 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder={t('searchInstance')}
                                        value={tenantSearch}
                                        onChange={e => setTenantSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <span className="text-sm text-slate-500">{t('instanceCount', { count: String(filteredTenants.length) })}</span>
                            </div>

                            <Card>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-slate-50">
                                                    <th className="text-left p-3 font-semibold text-slate-600">{t('instance')}</th>
                                                    <th className="text-left p-3 font-semibold text-slate-600">{t('status')}</th>
                                                    <th className="text-center p-3 font-semibold text-slate-600">{t('employees')}</th>
                                                    <th className="text-center p-3 font-semibold text-slate-600">{t('users')}</th>
                                                    <th className="text-left p-3 font-semibold text-slate-600">{t('lastActivity')}</th>
                                                    <th className="text-left p-3 font-semibold text-slate-600">{t('createdOn')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredTenants.map(t => {
                                                    const hi = healthIndicator(t.lastActivity, t.isActive);
                                                    return (
                                                        <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                                            <td className="p-3">
                                                                <div>
                                                                    <p className="font-semibold text-slate-900">{t.name}</p>
                                                                    <p className="text-xs text-slate-400">{t.subdomain}.harmony.mr</p>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`h-2.5 w-2.5 rounded-full ${hi.color}`} />
                                                                    <span className="text-xs font-medium">{hi.label}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-center font-semibold">{t.employeeCount}</td>
                                                            <td className="p-3 text-center font-semibold">{t.userCount}</td>
                                                            <td className="p-3 text-slate-500 text-xs">{timeAgo(t.lastActivity)}</td>
                                                            <td className="p-3 text-xs text-slate-500">
                                                                {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {filteredTenants.length === 0 && (
                                                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">{t('noInstanceFound')}</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Tab 2: Journal d'audit */}
                    {activeTab === 2 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    value={auditActionFilter}
                                    onChange={e => setAuditActionFilter(e.target.value)}
                                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">{t('allActions')}</option>
                                    <option value="LOGIN">{t('actionLogin')}</option>
                                    <option value="SUPER_ADMIN_LOGIN">{t('actionSuperAdminLogin')}</option>
                                    <option value="LOGOUT">{t('actionLogout')}</option>
                                    <option value="CREATE_EMPLOYEE">{t('actionCreateEmployee')}</option>
                                    <option value="UPDATE_EMPLOYEE">{t('actionUpdateEmployee')}</option>
                                    <option value="CREATE_LEAVE">{t('actionCreateLeave')}</option>
                                    <option value="PROCESS_LEAVE">{t('actionProcessLeave')}</option>
                                    <option value="CREATE_PAYROLL">{t('actionCreatePayroll')}</option>
                                    <option value="GENERATE_PAYSLIPS">{t('actionGeneratePayslips')}</option>
                                    <option value="CREATE_TENANT">{t('actionCreateTenant')}</option>
                                    <option value="DELETE_TENANT">{t('actionDeleteTenant')}</option>
                                    <option value="FORGOT_PASSWORD">{t('actionForgotPassword')}</option>
                                    <option value="RESET_PASSWORD">{t('actionResetPassword')}</option>
                                </select>
                                <span className="text-sm text-slate-500">{t('entries', { count: String(auditTotal) })}</span>
                            </div>

                            <Card>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-slate-50">
                                                    <th className="text-left p-3 font-semibold text-slate-600">{t('dateCol')}</th>
                                                    <th className="text-left p-3 font-semibold text-slate-600">{t('instance')}</th>
                                                    <th className="text-left p-3 font-semibold text-slate-600">{t('action')}</th>
                                                    <th className="text-left p-3 font-semibold text-slate-600">{t('resource')}</th>
                                                    <th className="text-left p-3 font-semibold text-slate-600">{t('method')}</th>
                                                    <th className="text-left p-3 font-semibold text-slate-600">{t('ip')}</th>
                                                    <th className="text-center p-3 font-semibold text-slate-600">{t('statusCode')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {auditLogs.map(log => {
                                                    const badge = actionBadge(log.action);
                                                    return (
                                                        <tr key={log.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                                            <td className="p-3 text-xs text-slate-500 whitespace-nowrap">
                                                                {new Date(log.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                            </td>
                                                            <td className="p-3 text-xs font-medium">
                                                                {log.tenant?.name || <span className="text-slate-400">—</span>}
                                                            </td>
                                                            <td className="p-3">
                                                                <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${badge.color}`}>
                                                                    {badge.label}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-xs text-slate-600">{log.resource}</td>
                                                            <td className="p-3">
                                                                {log.method && (
                                                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono">
                                                                        {log.method}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-xs text-slate-400 font-mono">{log.ip || '—'}</td>
                                                            <td className="p-3 text-center">
                                                                {log.statusCode && (
                                                                    <span className={`text-xs font-bold ${log.statusCode < 400 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                        {log.statusCode}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {auditLogs.length === 0 && (
                                                    <tr><td colSpan={7} className="p-8 text-center text-slate-400">{t('noLogFound')}</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {auditTotalPages > 1 && (
                                        <div className="flex items-center justify-between p-3 border-t">
                                            <span className="text-xs text-slate-500">{t('page', { current: String(auditPage), total: String(auditTotalPages) })}</span>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="outline" size="sm"
                                                    disabled={auditPage <= 1}
                                                    onClick={() => fetchAuditLogs(auditPage - 1)}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline" size="sm"
                                                    disabled={auditPage >= auditTotalPages}
                                                    onClick={() => fetchAuditLogs(auditPage + 1)}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Tab 3: Performance */}
                    {activeTab === 3 && metrics && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            {/* Mini KPIs */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('totalReq24h')}</p>
                                        <p className="text-3xl font-bold text-slate-900 mt-1">{metrics.totalRequests24h.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('avgResponseTime')}</p>
                                        <p className={`text-3xl font-bold mt-1 ${metrics.avgResponseTime > 500 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                            {metrics.avgResponseTime}ms
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('errorRate')}</p>
                                        <p className={`text-3xl font-bold mt-1 ${metrics.errorRate > 5 ? 'text-red-500' : 'text-emerald-600'}`}>
                                            {metrics.errorRate}%
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Requests Over Time Chart */}
                            {chartData.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold">{t('reqOverTime')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData}>
                                                    <defs>
                                                        <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                                                    <YAxis tick={{ fontSize: 11 }} />
                                                    <Tooltip />
                                                    <Area type="monotone" dataKey="requests" name={t('requestsLabel')} stroke="#6366f1" fill="url(#colorReqs)" strokeWidth={2} />
                                                    <Area type="monotone" dataKey="errors" name={t('errorsLabel')} stroke="#ef4444" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Top Slow Endpoints */}
                            {metrics.topSlowEndpoints.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold">{t('slowestEndpoints')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={metrics.topSlowEndpoints.slice(0, 8)} layout="vertical" margin={{ left: 120 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis type="number" tick={{ fontSize: 11 }} unit="ms" />
                                                    <YAxis
                                                        type="category"
                                                        dataKey="path"
                                                        tick={{ fontSize: 11 }}
                                                        width={110}
                                                    />
                                                    <Tooltip formatter={(v: any) => [`${v}ms`, t('avgTime')]} />
                                                    <Bar dataKey="avgMs" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Status Code Distribution */}
                            {Object.keys(metrics.statusCodeDistribution).length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold">{t('httpDistribution')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-4 flex-wrap">
                                            {Object.entries(metrics.statusCodeDistribution).map(([code, count]) => (
                                                <div key={code} className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl">
                                                    <div className={`h-3 w-3 rounded-full ${code === '2xx' ? 'bg-emerald-500' : code === '3xx' ? 'bg-blue-500' : code === '4xx' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                    <span className="font-mono text-sm font-bold">{code}</span>
                                                    <span className="text-slate-500 text-sm">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── KPI Card Component ──────────────────────────────────
function KPICard({ title, value, subtitle, icon: Icon, color, alert }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    color: string;
    alert?: boolean;
}) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        violet: 'bg-violet-50 text-violet-600',
    };

    return (
        <Card className={alert ? 'ring-2 ring-amber-300' : ''}>
            <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${colors[color] || colors.blue}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                    {alert && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 mt-1">{title} — {subtitle}</p>
            </CardContent>
        </Card>
    );
}
