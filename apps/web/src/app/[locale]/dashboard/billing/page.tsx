'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    CreditCard, CheckCircle2, ShieldAlert, ArrowUpRight, DollarSign,
    Building2, Calendar, Zap, Crown, Star, Package, RefreshCw, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    isActive: boolean;
    createdAt: string;
    plan?: string;
    _count?: { users: number; employees: number; };
}

const PLANS = [
    {
        id: 'Starter',
        name: 'Starter',
        price: 4500,
        maxEmployees: 20,
        icon: Package,
        color: 'text-slate-600',
        bg: 'from-slate-50 to-slate-100',
        border: 'border-slate-200',
        ring: 'ring-slate-400',
        features: ['featureEmployees', 'featureBasicLeaves', 'featureEmailSupport']
    },
    {
        id: 'Pro',
        name: 'Pro',
        price: 12000,
        maxEmployees: 100,
        icon: Star,
        color: 'text-blue-600',
        bg: 'from-blue-50 to-blue-100',
        border: 'border-blue-200',
        ring: 'ring-blue-500',
        popular: true,
        features: ['featureStarterPlus', 'featureBankInteg', 'featurePrioritySupport']
    },
    {
        id: 'Enterprise',
        name: 'Enterprise',
        price: 0,
        maxEmployees: Infinity,
        icon: Crown,
        color: 'text-purple-600',
        bg: 'from-purple-50 to-purple-100',
        border: 'border-purple-200',
        ring: 'ring-purple-500',
        features: ['featureProPlus', 'featureDedicatedAPI', 'featureDedicatedManager']
    }
];

export default function BillingPage() {
    const t = useTranslations('billing');
    const tc = useTranslations('common');
    const [tenants, setTenants] = React.useState<Tenant[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [assigningId, setAssigningId] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchTenants = async () => {
            try {
                const res = await api.get('/tenants');
                if (res.data) setTenants(res.data);
            } catch (e) {
                console.error('Failed to fetch tenants:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchTenants();
    }, []);

    const handleAssignPlan = async (tenantId: string, plan: string) => {
        setAssigningId(tenantId);
        try {
            await api.patch(`/tenants/${tenantId}/plan`, { plan });
            setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, plan } : t));
        } catch (e) {
            console.error('Failed to assign plan:', e);
        } finally {
            setAssigningId(null);
        }
    };

    const activeTenants = tenants.filter(t => t.isActive).length;
    const mrr = tenants.reduce((acc, t) => {
        const plan = PLANS.find(p => p.id === t.plan);
        return acc + (plan?.price || 0);
    }, 0);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col gap-2 bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-emerald-600" />
                    {t('title')}
                </h1>
                <p className="text-slate-500 font-medium text-sm">
                    {t('subtitle')}
                </p>
            </div>

            {/* KPI Row */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-slate-200 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('totalMRR')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900">{mrr.toLocaleString()} <span className="text-base font-semibold text-slate-400">MRU</span></div>
                        <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3" />{` `}{t('realTimeCalc')}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('activeInstances')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900">{activeTenants}</div>
                        <p className="text-xs font-medium text-blue-600 mt-1 flex items-center gap-1">
                            <Zap className="h-3 w-3" />{` `}{t('outOf', { total: String(tenants.length) })}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('unpaidInvoices')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-amber-600">0</div>
                        <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" />{` `}{t('noLatePayment')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Plans Reference */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">{t('availablePlans')}</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                    {PLANS.map((plan) => {
                        const Icon = plan.icon;
                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`relative rounded-2xl bg-gradient-to-br ${plan.bg} border ${plan.border} p-5 shadow-sm`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full border border-blue-700">
                                        {t('mostPopular')}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mb-3">
                                    <Icon className={`h-5 w-5 ${plan.color}`} />
                                    <span className={`font-black text-lg ${plan.color}`}>{plan.name}</span>
                                </div>
                                <div className="text-2xl font-black text-slate-900 mb-3">
                                    {plan.price === 0 ? t('onQuote') : t('perMonth', { price: plan.price.toLocaleString() })}
                                </div>
                                <div className="space-y-1.5">
                                    {plan.features.map(f => (
                                        <div key={f} className="flex items-start text-xs text-slate-600">
                                            <CheckCircle2 className={`h-3.5 w-3.5 mr-1.5 mt-0.5 shrink-0 ${plan.color}`} />
                                            {t(f)}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Tenant Plan Assignment Table */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">{t('planAssignment')}</h2>
                <Card className="border-slate-200/60 shadow-md bg-white/90">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">{t('instance')}</th>
                                    <th className="px-5 py-3 font-semibold">{t('since')}</th>
                                    <th className="px-5 py-3 font-semibold">{t('licenses')}</th>
                                    <th className="px-5 py-3 font-semibold">{t('currentPlan')}</th>
                                    <th className="px-5 py-3 font-semibold text-right">{t('changePlan')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            {tc('loading')}
                                        </td>
                                    </tr>
                                ) : tenants.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                                            <Building2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                            {t('noInstanceFound')}
                                        </td>
                                    </tr>
                                ) : tenants.map((tenant) => {
                                    const currentPlan = tenant.plan || 'Starter';
                                    return (
                                        <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                                                        {tenant.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{tenant.name}</div>
                                                        <div className="text-xs text-slate-400">{tenant.subdomain}.harmony.mr</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-slate-500 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(tenant.createdAt).toLocaleDateString('fr-FR')}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="font-bold text-slate-700">{tenant._count?.users || 0}</span>
                                                <span className="text-slate-400 text-xs ml-1">{t('licenses')}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${currentPlan === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                                                    currentPlan === 'Pro' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {currentPlan}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex gap-1.5 justify-end">
                                                    {PLANS.map(plan => (
                                                        <button
                                                            key={plan.id}
                                                            disabled={currentPlan === plan.id || assigningId === tenant.id}
                                                            onClick={() => handleAssignPlan(tenant.id, plan.id)}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${currentPlan === plan.id
                                                                ? `bg-gradient-to-br ${plan.bg} ${plan.border} ${plan.color} cursor-default`
                                                                : 'border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 bg-white'
                                                                } disabled:opacity-50`}
                                                        >
                                                            {assigningId === tenant.id ? <Loader2 className="h-3 w-3 animate-spin" /> : plan.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
