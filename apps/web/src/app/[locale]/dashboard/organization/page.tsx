'use client';

import * as React from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import api from '@/lib/api';
import { Loader2, User, Search, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface OrgNode {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    photo?: string | null;
    department?: { name: string } | null;
    orgLevel?: { name: string; rank: number } | null;
    managerId?: string | null;
    children: OrgNode[];
}

function OrgCard({ node, viewProfileLabel }: { node: OrgNode; viewProfileLabel?: string }) {
    const router = useRouter();
    const initials = `${node.firstName?.[0] || ''}${node.lastName?.[0] || ''}`.toUpperCase();
    const levelColor = node.orgLevel
        ? node.orgLevel.rank === 1 ? 'from-indigo-600 to-purple-700'
        : node.orgLevel.rank === 2 ? 'from-blue-500 to-indigo-600'
        : node.orgLevel.rank <= 4 ? 'from-cyan-500 to-blue-600'
        : 'from-slate-500 to-slate-600'
        : 'from-blue-500 to-indigo-600';

    return (
        <div className="inline-flex flex-col items-center p-0.5">
            <div
                className="bg-white border border-slate-200 rounded-2xl shadow-md hover:shadow-lg transition-all group cursor-pointer min-w-[150px] text-center overflow-hidden"
                onClick={() => router.push(`/dashboard/employees/${node.id}`)}
                title={viewProfileLabel}
            >
                <div className={`bg-gradient-to-br ${levelColor} p-3 flex justify-center group-hover:opacity-90 transition-all`}>
                    {node.photo ? (
                        <img src={node.photo} alt={`${node.firstName} ${node.lastName}`} className="h-10 w-10 rounded-full object-cover border-2 border-white" />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50">
                            <span className="text-white font-bold text-sm">{initials}</span>
                        </div>
                    )}
                </div>
                <div className="px-3 py-2">
                    <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                        {node.firstName} {node.lastName}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{node.position}</p>
                    {node.orgLevel && (
                        <span className="inline-block mt-1 text-[9px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                            {node.orgLevel.name}
                        </span>
                    )}
                    {node.department && (
                        <span className="inline-block mt-1 text-[9px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5 ml-0.5">
                            {node.department.name}
                        </span>
                    )}
                    {node.children.length > 0 && (
                        <p className="text-[9px] text-slate-400 mt-1">{node.children.length} subordonné(s)</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function renderTree(nodes: OrgNode[], viewProfileLabel?: string) {
    return nodes.map(node => (
        <TreeNode key={node.id} label={<OrgCard node={node} viewProfileLabel={viewProfileLabel} />}>
            {node.children.length > 0 && renderTree(node.children, viewProfileLabel)}
        </TreeNode>
    ));
}

export default function OrganizationPage() {
    const t = useTranslations('organization');
    const tc = useTranslations('common');
    const [chartData, setChartData] = React.useState<OrgNode[]>([]);
    const [departments, setDepartments] = React.useState<any[]>([]);
    const [employees, setEmployees] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');
    const [deptFilter, setDeptFilter] = React.useState('all');

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [chartRes, empRes, deptRes] = await Promise.all([
                    api.get('/org-levels/chart'),
                    api.get('/employees'),
                    api.get('/departments'),
                ]);
                setChartData(chartRes.data?.data || []);
                setEmployees(empRes.data?.data || []);
                setDepartments(deptRes.data?.data || []);
            } catch {
                toast.error(t('loadError'));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredEmployees = employees.filter(e => {
        const matchSearch = !search || `${e.firstName} ${e.lastName} ${e.position}`.toLowerCase().includes(search.toLowerCase());
        const matchDept = deptFilter === 'all' || e.departmentId === deptFilter;
        return matchSearch && matchDept;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                <p className="text-slate-500 animate-pulse">{t('loadingChart')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {t('stats', { empCount: employees.length, deptCount: departments.length })}
                    </p>
                </div>
            </div>

            {/* Org Chart */}
            {chartData.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto p-8" style={{ minHeight: '400px' }}>
                    {chartData.length === 1 ? (
                        <Tree
                            lineWidth="2px"
                            lineColor="#cbd5e1"
                            lineBorderRadius="6px"
                            label={<OrgCard node={chartData[0]} viewProfileLabel={t('viewProfile')} />}
                        >
                            {chartData[0].children.length > 0 && renderTree(chartData[0].children, t('viewProfile'))}
                        </Tree>
                    ) : (
                        <Tree
                            lineWidth="2px"
                            lineColor="#cbd5e1"
                            lineBorderRadius="6px"
                            label={
                                <div className="inline-flex flex-col items-center p-0.5">
                                    <div className="bg-white border border-slate-200 rounded-2xl shadow-md min-w-[140px] text-center overflow-hidden">
                                        <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-3">
                                            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50 mx-auto">
                                                <Users className="h-5 w-5 text-white" />
                                            </div>
                                        </div>
                                        <div className="px-3 py-2">
                                            <p className="text-xs font-bold text-slate-800">{t('orgRoot')}</p>
                                            <p className="text-[10px] text-slate-500">{t('generalDirection')}</p>
                                        </div>
                                    </div>
                                </div>
                            }
                        >
                            {renderTree(chartData, t('viewProfile'))}
                        </Tree>
                    )}
                </div>
            ) : (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">{t('noEmployees')}</p>
                    <p className="text-xs text-slate-400 mt-1">{t('noManager')}</p>
                </div>
            )}

            {/* Employee Directory */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <h2 className="font-bold text-slate-900">{t('employeeDirectory')}</h2>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={deptFilter}
                            onChange={e => setDeptFilter(e.target.value)}
                            className="h-9 px-3 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none"
                        >
                            <option value="all">{t('allDepartments')}</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                                className="bg-transparent outline-none text-sm text-slate-700 w-40 placeholder:text-slate-400"
                                placeholder={t('searchPlaceholder')}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="divide-y divide-slate-100">
                    {filteredEmployees.map(emp => (
                        <a key={emp.id} href={`/dashboard/employees/${emp.id}`} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {emp.firstName?.[0]}{emp.lastName?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{emp.firstName} {emp.lastName}</p>
                                <p className="text-xs text-slate-500 truncate">
                                    {emp.position}
                                    {emp.orgLevel && <span className="text-indigo-500 ml-1">· {emp.orgLevel.name}</span>}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold text-slate-600">{emp.department?.name || '—'}</p>
                                <p className="text-xs text-slate-400">{emp.manager ? `↑ ${emp.manager.firstName} ${emp.manager.lastName}` : '—'}</p>
                            </div>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {emp.status === 'ACTIVE' ? tc('active') : emp.status === 'INACTIVE' ? tc('inactive') : emp.status}
                            </span>
                        </a>
                    ))}
                    {filteredEmployees.length === 0 && (
                        <div className="py-12 text-center text-slate-400 text-sm">
                            <User className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                            {t('noEmployees')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
