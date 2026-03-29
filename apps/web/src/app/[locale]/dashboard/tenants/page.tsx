'use client';

import * as React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Server,
    Activity,
    Power,
    Shield,
    Trash2,
    Loader2
} from 'lucide-react';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable, Column } from '@/components/DataTable';
import { ExportButtons, ExportColumn } from '@/components/ExportButtons';

interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    isActive: boolean;
    createdAt: string;
    plan: string;
    _count?: {
        users: number;
        employees: number;
    }
}

export default function TenantsPage() {
    const { isAuthenticated, token } = useAuthStore();
    const t = useTranslations('tenants');
    const tc = useTranslations('common');
    const [tenants, setTenants] = React.useState<Tenant[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [statusFilter, setStatusFilter] = React.useState(''); // '' | 'ACTIVE' | 'SUSPENDED'

    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [createLoading, setCreateLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: '',
        subdomain: '',
        adminEmail: '',
        adminPassword: ''
    });

    const fetchTenants = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tenants');
            const list = res.data?.data || res.data;
            if (Array.isArray(list)) {
                setTenants(list);
            } else {
                console.error("Failed to fetch tenants");
            }
        } catch (error) {
            console.error("Error fetching tenants:", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchTenants();
    }, []);

    const handleCreateTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            const res = await api.post('/tenants', formData);
            if (res.data?.tenant) {
                setTenants([res.data.tenant, ...tenants]);
                setIsCreateOpen(false);
                setFormData({ name: '', subdomain: '', adminEmail: '', adminPassword: '' });
            }
        } catch (error: any) {
            console.error("Error creating tenant:", error);
            alert(error.response?.data?.error || t('errorOccurred'));
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDeleteTenant = async (id: string, name: string) => {
        if (!window.confirm(t('confirmDelete', { name }))) {
            return;
        }
        try {
            await api.delete(`/tenants/${id}`);
            setTenants(tenants.filter(t => t.id !== id));
        } catch (error: any) {
            console.error("Error deleting tenant:", error);
            alert(error.response?.data?.error || t('deleteError'));
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus;

            // Optimistic update
            setTenants(prev => prev.map(t => t.id === id ? { ...t, isActive: newStatus } : t));

            const res = await api.patch(`/tenants/${id}/status`, { isActive: newStatus });

            if (!res.data) {
                // Revert if failed
                setTenants(prev => prev.map(t => t.id === id ? { ...t, isActive: currentStatus } : t));
                console.error("Failed to toggle tenant status");
            }
        } catch (error) {
            console.error("Error toggling status:", error);
            setTenants(prev => prev.map(t => t.id === id ? { ...t, isActive: currentStatus } : t));
        }
    };

    // Pre-filter by status (search is handled by DataTable)
    const statusFilteredTenants = React.useMemo(() => {
        if (statusFilter === '') return tenants;
        if (statusFilter === 'ACTIVE') return tenants.filter(t => t.isActive);
        if (statusFilter === 'SUSPENDED') return tenants.filter(t => !t.isActive);
        return tenants;
    }, [tenants, statusFilter]);

    // DataTable columns
    const columns: Column<Tenant>[] = React.useMemo(() => [
        {
            key: 'organization',
            header: t('organization'),
            accessor: (row) => row.name,
            sortable: true,
            render: (tenant) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-sm shrink-0">
                        {tenant.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">
                            {tenant.name}
                        </div>
                        <div className="text-xs text-slate-500">{t('createdOn', { date: new Date(tenant.createdAt).toLocaleDateString() })}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'cloudDomain',
            header: t('cloudDomain'),
            accessor: (row) => row.subdomain,
            sortable: true,
            render: (tenant) => (
                <div className="flex items-center text-slate-600 font-medium">
                    <span className="text-slate-400 mr-0.5">https://</span>
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-bold">{tenant.subdomain}</span>
                    <span className="text-slate-400 ml-0.5">.harmony.mr</span>
                </div>
            ),
        },
        {
            key: 'plan',
            header: t('plan'),
            accessor: (row) => row.plan || 'Standard',
            sortable: true,
            render: (tenant) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm ${(tenant.plan || 'Standard') === 'Enterprise' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                    (tenant.plan || 'Standard') === 'Pro' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                    {tenant.plan || 'Standard'}
                </span>
            ),
        },
        {
            key: 'activeLicenses',
            header: t('activeLicenses'),
            accessor: (row) => row._count?.users || 0,
            sortable: true,
            className: 'text-center',
            render: (tenant) => (
                <>
                    <span className="font-bold text-slate-700">{tenant._count?.users || 0}</span>
                    <span className="text-slate-400 text-xs ml-1">{t('users')}</span>
                </>
            ),
        },
        {
            key: 'systemStatus',
            header: t('systemStatus'),
            accessor: (row) => row.isActive ? 1 : 0,
            sortable: true,
            render: (tenant) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${tenant.isActive
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tenant.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {tenant.isActive ? t('online') : t('suspended')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: tc('actions'),
            className: 'text-right',
            headerClassName: 'text-right',
            render: (tenant) => (
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title={t('impersonate')}>
                        <Shield className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTenant(tenant.id, tenant.name); }}
                        variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" title={t('deleteForever')}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(tenant.id, tenant.isActive); }}
                        variant="ghost" size="icon"
                        className={`h-8 w-8 ${tenant.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                        title={tenant.isActive ? t('suspendInstance') : t('reactivateInstance')}
                    >
                        <Power className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ], [t, tc]);

    // Export columns
    const exportColumns: ExportColumn[] = React.useMemo(() => [
        { header: t('organization'), accessor: (row: Tenant) => row.name },
        { header: t('cloudDomain'), accessor: (row: Tenant) => `${row.subdomain}.harmony.mr` },
        { header: t('plan'), accessor: (row: Tenant) => row.plan || 'Standard' },
        { header: t('activeLicenses'), accessor: (row: Tenant) => row._count?.users || 0 },
        { header: t('systemStatus'), accessor: (row: Tenant) => row.isActive ? t('online') : t('suspended') },
    ], [t]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Server className="h-6 w-6 text-blue-600" />
                        {t('title')}
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">{t('subtitle')}</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger render={
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:shadow-lg">
                            <Plus className="mr-2 h-4 w-4" />{` `}{t('newInstance')}
                        </Button>
                    } />
                    <DialogContent className="sm:max-w-[425px] bg-white border border-slate-200 shadow-2xl rounded-xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900">{t('createTitle')}</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                {t('createDescription')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateTenant} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('companyName')}</label>
                                <Input
                                    required
                                    placeholder="Ex: Acme Corp"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('subdomain')}</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        required
                                        placeholder="acme"
                                        className="text-right"
                                        value={formData.subdomain}
                                        onChange={e => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                    />
                                    <span className="text-slate-500 text-sm font-medium whitespace-nowrap">.harmony.mr</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('adminEmail')}</label>
                                <Input
                                    required
                                    type="email"
                                    placeholder="admin@acme.com"
                                    value={formData.adminEmail}
                                    onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('tempPassword')}</label>
                                <Input
                                    required
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    value={formData.adminPassword}
                                    onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                                />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={createLoading}>
                                    {createLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {createLoading ? t('creating') : t('createInstance')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* DataTable */}
            <DataTable<Tenant>
                data={statusFilteredTenants}
                columns={columns}
                rowKey={(row) => row.id}
                searchable
                searchPlaceholder={t('searchPlaceholder')}
                searchFields={[
                    (row) => row.name,
                    (row) => row.subdomain,
                ]}
                loading={loading}
                loadingState={
                    <div className="flex flex-col items-center gap-3">
                        <Activity className="h-8 w-8 text-blue-500 animate-spin" />
                        <p className="text-sm font-medium text-slate-500">{t('loadingInstances')}</p>
                    </div>
                }
                emptyState={
                    <div className="flex flex-col items-center">
                        <Server className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-lg font-medium text-slate-900">{t('noInstanceFound')}</p>
                        <p className="text-sm mt-1 text-slate-500">{t('noInstanceDesc')}</p>
                    </div>
                }
                headerExtra={
                    <>
                        <select className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
                            <option value="">{t('allPlans')}</option>
                            <option value="Starter">Starter</option>
                            <option value="Pro">Pro</option>
                            <option value="Enterprise">Enterprise</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                            <option value="">{t('allStatuses')}</option>
                            <option value="ACTIVE">{t('active')}</option>
                            <option value="SUSPENDED">{t('suspended')}</option>
                        </select>
                        <ExportButtons
                            data={statusFilteredTenants}
                            columns={exportColumns}
                            filename="tenants"
                        />
                    </>
                }
                rowClassName="group"
            />
        </div>
    );
}
