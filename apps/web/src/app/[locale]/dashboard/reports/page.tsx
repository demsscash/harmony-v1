'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, AlertTriangle, Banknote, TrendingUp, TrendingDown } from 'lucide-react';
import api from '@/lib/api';

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function ReportsPage() {
    const t = useTranslations('reports');
    const tc = useTranslations('common');

    const [stats, setStats] = useState<any>(null);
    const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
    const [turnover, setTurnover] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [turnoverYear, setTurnoverYear] = useState(new Date().getFullYear());

    useEffect(() => {
        Promise.all([
            api.get('/reports/dashboard').then(r => setStats(r.data?.data)).catch(() => {}),
            api.get('/reports/payroll-history').then(r => setPayrollHistory(r.data?.data || [])).catch(() => {}),
            api.get('/reports/turnover', { params: { year: turnoverYear } }).then(r => setTurnover(r.data?.data || [])).catch(() => {}),
        ]).then(() => setLoading(false));
    }, []);

    useEffect(() => {
        api.get('/reports/turnover', { params: { year: turnoverYear } }).then(r => setTurnover(r.data?.data || [])).catch(() => {});
    }, [turnoverYear]);

    if (loading) {
        return <div className="py-20 text-center text-sm text-slate-500">{tc('loading')}</div>;
    }

    const maxPayroll = Math.max(...payrollHistory.map(p => p.totalGross), 1);
    const maxTurnover = Math.max(...turnover.map(t => Math.max(t.hires, t.departures)), 1);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                    {t('title')}
                </h1>
                <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
            </div>

            {/* KPI Cards */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">{t('active')}</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.employees.active}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">{t('recentHires')}</p>
                                <p className="text-2xl font-bold text-emerald-600">+{stats.employees.recentHires}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">{t('alerts')}</p>
                                <p className="text-2xl font-bold text-amber-600">
                                    {stats.alerts.pendingLeaves + stats.alerts.pendingAdvances + stats.alerts.pendingExpenses}
                                </p>
                            </div>
                        </div>
                    </Card>
                    {stats.payroll && (
                        <Card className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                    <Banknote className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">{t('net')}</p>
                                    <p className="text-lg font-bold text-slate-900">{stats.payroll.totalNet.toLocaleString()}</p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Department & Contract breakdown */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{t('byDepartment')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stats.employees.byDepartment.length === 0 ? (
                                <p className="text-sm text-slate-400 py-4">{t('noData')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {stats.employees.byDepartment.map((d: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="text-sm text-slate-600 w-32 truncate">{d.department}</span>
                                            <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                                                    style={{ width: `${Math.max((d.count / stats.employees.active) * 100, 8)}%` }}
                                                >
                                                    <span className="text-[10px] font-bold text-white">{d.count}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{t('byContractType')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stats.employees.byContractType.length === 0 ? (
                                <p className="text-sm text-slate-400 py-4">{t('noData')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {stats.employees.byContractType.map((ct: any, i: number) => {
                                        const colors: Record<string, string> = { CDI: 'bg-blue-500', CDD: 'bg-amber-500', STAGE: 'bg-purple-500', PRESTATION: 'bg-slate-500' };
                                        return (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="text-sm text-slate-600 w-32">{ct.type}</span>
                                                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                                                    <div
                                                        className={`h-full ${colors[ct.type] || 'bg-slate-400'} rounded-full flex items-center justify-end pr-2`}
                                                        style={{ width: `${Math.max((ct.count / stats.employees.active) * 100, 8)}%` }}
                                                    >
                                                        <span className="text-[10px] font-bold text-white">{ct.count}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Alerts */}
            {stats && (stats.alerts.upcomingTrialEnds.length > 0 || stats.alerts.upcomingContractEnds.length > 0) && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            {t('alerts')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {stats.alerts.upcomingTrialEnds.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('trialEnding')}</p>
                                    {stats.alerts.upcomingTrialEnds.map((e: any) => (
                                        <div key={e.id} className="flex items-center justify-between py-1.5 text-sm">
                                            <span className="font-medium">{e.firstName} {e.lastName}</span>
                                            <span className="text-amber-600 font-medium">{new Date(e.trialEndDate).toLocaleDateString('fr')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {stats.alerts.upcomingContractEnds.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('contractEnding')}</p>
                                    {stats.alerts.upcomingContractEnds.map((e: any) => (
                                        <div key={e.id} className="flex items-center justify-between py-1.5 text-sm">
                                            <span className="font-medium">{e.firstName} {e.lastName}</span>
                                            <span className="text-red-600 font-medium">{new Date(e.contractEndDate).toLocaleDateString('fr')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Payroll History - Simple Bar Chart */}
            {payrollHistory.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t('payrollHistory')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 h-48">
                            {payrollHistory.map((p, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '160px' }}>
                                        <div
                                            className="w-full bg-blue-500 rounded-t-sm"
                                            style={{ height: `${(p.totalGross / maxPayroll) * 100}%`, minHeight: '2px' }}
                                            title={`${t('gross')}: ${p.totalGross.toLocaleString()}`}
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-400">{MONTH_NAMES[p.month - 1]}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Turnover Chart */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{t('turnover')} {turnoverYear}</CardTitle>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setTurnoverYear(y => y - 1)} className="px-2 py-1 text-sm rounded border hover:bg-slate-50">&larr;</button>
                            <span className="text-sm font-medium">{turnoverYear}</span>
                            <button onClick={() => setTurnoverYear(y => y + 1)} className="px-2 py-1 text-sm rounded border hover:bg-slate-50">&rarr;</button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-3 text-xs">
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {t('hires')}</span>
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> {t('departures')}</span>
                    </div>
                    <div className="flex items-end gap-2 h-32">
                        {turnover.map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full flex items-end justify-center gap-0.5" style={{ height: '100px' }}>
                                    <div
                                        className="w-2/5 bg-emerald-500 rounded-t-sm"
                                        style={{ height: `${maxTurnover > 0 ? (m.hires / maxTurnover) * 100 : 0}%`, minHeight: m.hires > 0 ? '4px' : '0' }}
                                    />
                                    <div
                                        className="w-2/5 bg-red-400 rounded-t-sm"
                                        style={{ height: `${maxTurnover > 0 ? (m.departures / maxTurnover) * 100 : 0}%`, minHeight: m.departures > 0 ? '4px' : '0' }}
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400">{MONTH_NAMES[i]}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
