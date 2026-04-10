'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Plus, Users, BadgeIcon, Eye, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { DataTable, Column } from '@/components/DataTable';
import { ExportButtons, ExportColumn } from '@/components/ExportButtons';

export default function EmployeesPage() {
    const t = useTranslations('employees');
    const tc = useTranslations('common');
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [deptFilter, setDeptFilter] = useState('all');
    const [departments, setDepartments] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empRes, deptRes] = await Promise.all([
                    api.get('/employees'),
                    api.get('/departments'),
                ]);
                if (empRes.data.success) setEmployees(empRes.data.data);
                if (deptRes.data.success) setDepartments(deptRes.data.data);
            } catch (error: any) {
                toast.error(t('errorLoading'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredEmployees = employees.filter(emp => {
        const matchStatus = statusFilter === 'all' || emp.status === statusFilter;
        const matchDept = deptFilter === 'all' || emp.departmentId === deptFilter;
        return matchStatus && matchDept;
    });

    const handleDownloadBadge = async (employeeId: string) => {
        setDownloadingId(employeeId);
        try {
            const response = await api.get(`/employees/${employeeId}/badge`, {
                headers: { 'X-Tenant-ID': 'tenant1' },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `badge_${employeeId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            toast.error(t('errorBadge'));
        } finally {
            setDownloadingId(null);
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'matricule',
            header: t('matricule'),
            accessor: (row) => row.matricule || '',
            render: (row) => (
                <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                    {row.matricule}
                </span>
            ),
        },
        {
            key: 'fullName',
            header: t('fullName'),
            accessor: (row) => `${row.firstName} ${row.lastName}`,
            render: (row) => (
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs mr-3 border border-blue-200">
                        {row.firstName?.[0]}{row.lastName?.[0]}
                    </div>
                    <div>
                        <Link href={`/dashboard/employees/${row.id}`} className="font-bold text-slate-800 hover:text-blue-600 transition-colors">
                            {row.firstName} {row.lastName}
                        </Link>
                        <div className="text-xs text-slate-500">{row.email || tc('noEmail')}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'position',
            header: t('position'),
            accessor: (row) => row.position || '',
            render: (row) => (
                <span className="text-slate-600 font-medium">{row.position || '-'}</span>
            ),
        },
        {
            key: 'department',
            header: t('department'),
            accessor: (row) => row.department?.name || '',
            render: (row) => (
                <span className="text-slate-600">
                    {row.department?.name || <span className="italic text-slate-400">{tc('notAssigned')}</span>}
                </span>
            ),
        },
        {
            key: 'contractType',
            header: t('contractTypeCol'),
            accessor: (row) => row.contractType || '',
            render: (row) => {
                const colors: Record<string, string> = {
                    CDI: 'bg-blue-50 text-blue-700 border-blue-200',
                    CDD: 'bg-amber-50 text-amber-700 border-amber-200',
                    STAGE: 'bg-purple-50 text-purple-700 border-purple-200',
                    PRESTATION: 'bg-cyan-50 text-cyan-700 border-cyan-200',
                };
                return (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${colors[row.contractType] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {row.contractType}
                    </span>
                );
            },
        },
        {
            key: 'hireDate',
            header: t('hireDateCol'),
            accessor: (row) => row.hireDate ? new Date(row.hireDate).getTime() : 0,
            sortable: true,
            render: (row) => (
                <span className="text-slate-600 text-sm">
                    {row.hireDate ? new Date(row.hireDate).toLocaleDateString('fr-FR') : '—'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: tc('actions'),
            headerClassName: 'text-right',
            className: 'text-right',
            render: (row) => (
                <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/dashboard/employees/${row.id}/onboarding`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors" title={t('onboarding')}>
                            <Rocket className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleDownloadBadge(row.id); }}
                        disabled={downloadingId === row.id}
                        title={t('downloadBadge')}
                    >
                        {downloadingId === row.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <BadgeIcon className="h-4 w-4" />
                        )}
                    </Button>
                    <Link href={`/dashboard/employees/${row.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 transition-colors" title={t('viewProfile')}>
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            ),
        },
    ];

    const exportColumns: ExportColumn[] = [
        { header: t('matricule'), accessor: (row) => row.matricule || '' },
        { header: t('firstName'), accessor: (row) => row.firstName || '' },
        { header: t('lastName'), accessor: (row) => row.lastName || '' },
        { header: tc('email'), accessor: (row) => row.email || '' },
        { header: t('position'), accessor: (row) => row.position || '' },
        { header: t('department'), accessor: (row) => row.department?.name || '' },
        { header: tc('status'), accessor: (row) => row.status || '' },
        { header: t('hireDate'), accessor: (row) => row.hireDate ? new Date(row.hireDate).toLocaleDateString('fr-FR') : '' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-5 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('directory')}</h1>
                    <p className="text-slate-500 font-medium mt-1">{t('directoryDesc')}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="h-4 w-4 text-blue-600" />
                    {filteredEmployees.length !== employees.length
                        ? t('filteredCount', { filtered: filteredEmployees.length, total: employees.length })
                        : t('totalCount', { filtered: filteredEmployees.length })}
                </div>
            </div>

            <DataTable
                data={filteredEmployees}
                columns={columns}
                rowKey={(row) => row.id}
                searchable={true}
                searchPlaceholder={t('searchBtn')}
                searchFields={[
                    (row) => `${row.firstName} ${row.lastName}`,
                    (row) => row.matricule || '',
                    (row) => row.position || '',
                    (row) => row.email || '',
                ]}
                loading={isLoading}
                rowClassName="group"
                headerExtra={
                    <>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="h-9 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 outline-none shadow-sm">
                            <option value="all">{t('allStatuses')}</option>
                            <option value="ACTIVE">{tc('active')}</option>
                            <option value="INACTIVE">{tc('inactive')}</option>
                        </select>
                        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                            className="h-9 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 outline-none shadow-sm">
                            <option value="all">{t('allDepts')}</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <ExportButtons
                            data={filteredEmployees}
                            columns={exportColumns}
                            filename="employes"
                            csvLabel={t('exportCsv')}
                            excelLabel="Excel"
                        />
                        <Link href="/dashboard/employees/create">
                            <Button className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:shadow-lg">
                                <Plus className="h-4 w-4 mr-2" /> {t('newEmployee')}
                            </Button>
                        </Link>
                    </>
                }
                emptyState={
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-300">
                            <Users className="h-10 w-10 text-slate-400" />
                        </div>
                        {employees.length === 0 ? (
                            <>
                                <h3 className="text-lg font-bold text-slate-800">{t('noEmployees')}</h3>
                                <p className="text-slate-500 max-w-sm mt-1 mb-6">{t('emptyDirectory')}</p>
                                <Link href="/dashboard/employees/create">
                                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">{t('addEmployee')}</Button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-slate-800">{t('noResultsTitle')}</h3>
                                <p className="text-slate-500 max-w-sm mt-1">{t('noResultsDesc')}</p>
                                <button onClick={() => { setStatusFilter('all'); setDeptFilter('all'); }} className="mt-4 text-sm text-blue-600 hover:underline">{t('resetFilters')}</button>
                            </>
                        )}
                    </div>
                }
                texts={{
                    showing: tc('showing'),
                    of: tc('of'),
                    rows: tc('rows'),
                    noResults: t('noResultsTitle'),
                }}
            />
        </div>
    );
}
