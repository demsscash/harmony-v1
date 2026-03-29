'use client';

import * as React from 'react';
import api from '@/lib/api';
import { Loader2, ChevronLeft, ChevronRight, Calendar, Users, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';

interface LeaveEvent {
    id: string;
    employeeId: string;
    employeeName: string;
    departmentId?: string;
    department?: string;
    startDate: string;
    endDate: string;
    status: 'APPROVED' | 'PENDING' | 'REJECTED';
    leaveType?: string;
    leaveTypeId?: string;
}

// Color palette by leave type index
const TYPE_COLORS = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-rose-100 text-rose-800 border-rose-200',
    'bg-violet-100 text-violet-800 border-violet-200',
    'bg-cyan-100 text-cyan-800 border-cyan-200',
    'bg-orange-100 text-orange-800 border-orange-200',
    'bg-pink-100 text-pink-800 border-pink-200',
];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    // Monday=0, Sunday=6
    const d = new Date(year, month, 1).getDay();
    return (d + 6) % 7;
}

export default function TeamCalendarPage() {
    const t = useTranslations('leaves');
    const tm = useTranslations('months');
    const today = new Date();
    const [year, setYear] = React.useState(today.getFullYear());
    const [month, setMonth] = React.useState(today.getMonth());
    const [leaves, setLeaves] = React.useState<LeaveEvent[]>([]);
    const [departments, setDepartments] = React.useState<any[]>([]);
    const [deptFilter, setDeptFilter] = React.useState('ALL');
    const [loading, setLoading] = React.useState(true);

    const DAYS_SHORT = t('daysShort').split(',');

    React.useEffect(() => {
        Promise.all([
            api.get('/leaves', { params: { status: 'APPROVED' } }),
            api.get('/departments').catch(() => ({ data: { data: [] } })),
        ]).then(([leavesRes, deptsRes]) => {
            const data = (leavesRes.data.data || []).map((l: any) => ({
                id: l.id,
                employeeId: l.employeeId,
                employeeName: l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : t('employee'),
                departmentId: l.employee?.departmentId,
                department: l.employee?.department?.name,
                startDate: l.startDate,
                endDate: l.endDate,
                status: l.status,
                leaveType: l.leaveType?.name,
                leaveTypeId: l.leaveTypeId,
            }));
            setLeaves(data);
            setDepartments(Array.isArray(deptsRes.data?.data) ? deptsRes.data.data : []);
        }).catch(() => toast.error(t('errorLoading')))
          .finally(() => setLoading(false));
    }, []);

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    // Color by leave type
    const typeColorMap: Record<string, string> = {};
    let colorIdx = 0;
    const getColor = (leaveTypeId: string | undefined) => {
        const key = leaveTypeId || '__unknown__';
        if (!typeColorMap[key]) {
            typeColorMap[key] = TYPE_COLORS[colorIdx % TYPE_COLORS.length];
            colorIdx++;
        }
        return typeColorMap[key];
    };

    const filteredLeaves = deptFilter === 'ALL'
        ? leaves
        : leaves.filter(l => l.departmentId === deptFilter);

    const getLeavesForDay = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return filteredLeaves.filter(l => {
            const start = new Date(l.startDate).toISOString().slice(0, 10);
            const end = new Date(l.endDate).toISOString().slice(0, 10);
            return dateStr >= start && dateStr <= end;
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-blue-600" /> {t('teamCalendar')}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">{t('teamCalendarDesc')}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {departments.length > 0 && (
                        <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v || 'ALL')}>
                            <SelectTrigger className="w-44 h-9 border-slate-200 text-sm">
                                <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                <SelectValue placeholder={t('departmentFilter')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">{t('allDepts')}</SelectItem>
                                {departments.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-bold text-slate-800 px-3 min-w-[160px] text-center">
                        {tm(String(month + 1))} {year}
                    </span>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-7 border-b border-slate-100">
                        {DAYS_SHORT.map(d => (
                            <div key={d} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`e-${i}`} className="min-h-[100px] border-b border-r border-slate-100 bg-slate-50/30" />
                        ))}

                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const dayLeaves = getLeavesForDay(day);
                            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                            const col = (firstDay + day - 1) % 7;
                            const isWeekend = col === 5 || col === 6;

                            return (
                                <div key={day} className={`min-h-[100px] border-b border-r border-slate-100 p-1.5 ${isWeekend ? 'bg-slate-50/50' : ''}`}>
                                    <div className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold mb-1 ${isToday ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>
                                        {day}
                                    </div>
                                    <div className="space-y-0.5">
                                        {dayLeaves.length > 0 && (
                                            <div className="text-[9px] font-bold text-slate-400 mb-0.5">
                                                {t('absentCount', { count: dayLeaves.length })}
                                            </div>
                                        )}
                                        {dayLeaves.slice(0, 3).map(l => (
                                            <div key={l.id}
                                                className={`text-[10px] font-semibold rounded truncate px-1 py-0.5 border ${getColor(l.leaveTypeId)}`}
                                                title={`${l.employeeName} — ${l.leaveType || t('leave')}`}
                                            >
                                                {l.employeeName.split(' ')[0]}
                                            </div>
                                        ))}
                                        {dayLeaves.length > 3 && (
                                            <div className="text-[9px] text-slate-400 font-medium px-1">
                                                {t('others', { count: dayLeaves.length - 3 })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {filteredLeaves.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-slate-500" /> {t('leaveTypeColors')}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {[...new Map(filteredLeaves.map(l => [l.leaveTypeId || '__unknown__', l])).values()].map(l => (
                                <div key={l.leaveTypeId || '__unknown__'} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getColor(l.leaveTypeId)}`}>
                                    {l.leaveType || t('untypedLeave')}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-slate-500" /> {t('absentThisMonth')}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {[...new Map(filteredLeaves
                                .filter(l => {
                                    const start = new Date(l.startDate);
                                    const end = new Date(l.endDate);
                                    return start <= new Date(year, month + 1, 0) && end >= new Date(year, month, 1);
                                })
                                .map(l => [l.employeeId, l]))
                                .values()
                            ].map(l => (
                                <div key={l.employeeId} className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                                    {l.employeeName}{l.department ? ` · ${l.department}` : ''}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
