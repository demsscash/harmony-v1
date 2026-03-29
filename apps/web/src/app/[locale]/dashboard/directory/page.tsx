'use client';

import * as React from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Search, MapPin, Mail, Phone, Users, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { paginate } from '@/components/TablePagination';

const CONTRACT_BADGE: Record<string, string> = {
    CDI: 'bg-blue-100 text-blue-700',
    CDD: 'bg-amber-100 text-amber-700',
    STAGE: 'bg-violet-100 text-violet-700',
    PRESTATION: 'bg-slate-100 text-slate-600',
};

export default function DirectoryPage() {
    const t = useTranslations('directory');
    const tc = useTranslations('common');
    const [employees, setEmployees] = React.useState<any[]>([]);
    const [departments, setDepartments] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');
    const [deptFilter, setDeptFilter] = React.useState('ALL');
    const [page, setPage] = React.useState(1);
    const PAGE_SIZE = 16; // 4 cols × 4 rows

    React.useEffect(() => {
        Promise.all([
            api.get('/employees').catch(() => ({ data: { data: [] } })),
            api.get('/departments').catch(() => ({ data: { data: [] } })),
        ]).then(([empRes, deptRes]) => {
            const emp = Array.isArray(empRes.data?.data) ? empRes.data.data : [];
            const depts = Array.isArray(deptRes.data?.data) ? deptRes.data.data : [];
            setEmployees(emp.filter((e: any) => e.status === 'ACTIVE'));
            setDepartments(depts);
        }).catch(() => toast.error(t('loadError'))).finally(() => setLoading(false));
    }, []);

    const filtered = React.useMemo(() => {
        const q = search.toLowerCase();
        return employees.filter(e => {
            const matchSearch = !q || `${e.firstName} ${e.lastName} ${e.position} ${e.email} ${e.phone}`.toLowerCase().includes(q);
            const matchDept = deptFilter === 'ALL' || e.departmentId === deptFilter;
            return matchSearch && matchDept;
        });
    }, [employees, search, deptFilter]);

    // Reset page on filter change
    React.useEffect(() => { setPage(1); }, [search, deptFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginatedFiltered = paginate(filtered, page, PAGE_SIZE);

    const getInitials = (first: string, last: string) => `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
    const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500'];
    const getColor = (id: string) => avatarColors[id.charCodeAt(0) % avatarColors.length];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-600/10"><MapPin className="h-7 w-7 text-blue-600" /></div>
                    {t('title')}
                </h1>
                <p className="text-slate-500 mt-1">{t('subtitle')}</p>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder={t('searchPlaceholder')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 border-slate-200"
                    />
                </div>
                <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v || 'ALL')}>
                    <SelectTrigger className="w-full sm:w-52 border-slate-200">
                        <SelectValue placeholder={t('allDepartments')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">{t('allDepartments')}</SelectItem>
                        {departments.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {!loading && (
                <p className="text-sm text-slate-500">
                    {t('membersFound', { count: filtered.length })}
                </p>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                    <Users className="h-12 w-12 text-slate-200" />
                    <p className="font-medium">{t('noMember')}</p>
                    <p className="text-xs">{t('noMemberDesc')}</p>
                </div>
            ) : (
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    {paginatedFiltered.map(emp => (
                        <motion.div
                            key={emp.id}
                            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}
                        >
                            <Link href={`/dashboard/employees/${emp.id}`}>
                                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
                                    <div className="flex flex-col items-center text-center mb-4">
                                        <div className={`h-16 w-16 rounded-2xl ${getColor(emp.id)} flex items-center justify-center text-white text-xl font-bold shadow-md mb-3 group-hover:scale-105 transition-transform`}>
                                            {emp.photo ? (
                                                <img src={emp.photo} alt={`${emp.firstName} ${emp.lastName}`} className="h-full w-full object-cover rounded-2xl" />
                                            ) : (
                                                getInitials(emp.firstName, emp.lastName)
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-blue-600 transition-colors">
                                            {emp.firstName} {emp.lastName}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">{emp.position || '—'}</p>

                                        {emp.contractType && (
                                            <span className={`mt-2 inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${CONTRACT_BADGE[emp.contractType] || 'bg-slate-100 text-slate-600'}`}>
                                                {emp.contractType}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2 pt-4 border-t border-slate-100">
                                        {emp.department && (
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                <span className="truncate">{emp.department.name}</span>
                                            </div>
                                        )}
                                        {emp.email && (
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                <span className="truncate">{emp.email}</span>
                                            </div>
                                        )}
                                        {emp.phone && (
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                <span>{emp.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
                <div className="flex items-center justify-center gap-3 pt-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {tc('back')}
                    </Button>
                    <span className="text-sm text-slate-500">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                        {tc('next')}
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
}
