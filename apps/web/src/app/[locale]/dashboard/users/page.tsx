'use client';

import * as React from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
    UserCog, Plus, Loader2, Shield, RefreshCw,
    CheckCircle2, XCircle, Edit, Trash2, Clock, Key
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/DataTable';
import { ExportButtons, type ExportColumn } from '@/components/ExportButtons';

const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-blue-100 text-blue-700',
    HR: 'bg-emerald-100 text-emerald-700',
    EMPLOYEE: 'bg-slate-100 text-slate-700',
};

export default function UsersPage() {
    const { user: currentUser } = useAuthStore();
    const t = useTranslations('users');
    const tc = useTranslations('common');
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
    const [users, setUsers] = React.useState<any[]>([]);
    const [employees, setEmployees] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [showEditModal, setShowEditModal] = React.useState(false);
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [showPermissionsModal, setShowPermissionsModal] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<any>(null);
    const [saving, setSaving] = React.useState(false);
    const [permForm, setPermForm] = React.useState<Array<{ key: string; expiresAt: string; enabled: boolean }>>([]);

    const [formData, setFormData] = React.useState({
        email: '',
        password: '',
        role: 'EMPLOYEE',
        employeeId: '',
    });

    const ROLE_LABELS: Record<string, string> = {
        SUPER_ADMIN: t('roleSuperAdmin'),
        ADMIN: t('roleAdmin'),
        HR: t('roleHR'),
        EMPLOYEE: t('roleEmployee'),
    };

    const fetchUsers = React.useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, empRes] = await Promise.all([
                api.get('/users'),
                api.get('/employees'),
            ]);
            const usersData = Array.isArray(usersRes.data?.data) ? usersRes.data.data : Array.isArray(usersRes.data) ? usersRes.data : [];
            const empData = Array.isArray(empRes.data?.data) ? empRes.data.data : [];
            setUsers(usersData);
            const linkedEmployeeIds = new Set(usersData.map((u: any) => u.employeeId).filter(Boolean));
            setEmployees(empData.filter((e: any) => !linkedEmployeeIds.has(e.id) && e.status === 'ACTIVE'));
        } catch {
            toast.error(t('errorLoading'));
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleCreate = async () => {
        if (!formData.email || !formData.password) {
            toast.error(t('emailRequired'));
            return;
        }
        if (formData.role === 'EMPLOYEE' && !formData.employeeId) {
            toast.error(t('selectEmployee'));
            return;
        }
        setSaving(true);
        try {
            await api.post('/users', {
                email: formData.email,
                password: formData.password,
                role: formData.role,
                employeeId: formData.employeeId || undefined,
            });
            toast.success(t('userCreated'));
            setShowCreateModal(false);
            setFormData({ email: '', password: '', role: 'EMPLOYEE', employeeId: '' });
            fetchUsers();
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('errorCreating'));
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            await api.put(`/users/${selectedUser.id}`, { role: selectedUser.role });
            toast.success(t('roleUpdated'));
            setShowEditModal(false);
            fetchUsers();
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('errorUpdating'));
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (user: any) => {
        try {
            await api.put(`/users/${user.id}`, { isActive: !user.isActive });
            toast.success(user.isActive ? t('userDeactivated') : t('userActivated'));
            fetchUsers();
        } catch {
            toast.error(t('errorUpdating'));
        }
    };

    const PERM_OPTIONS = [
        { key: 'settings', label: t('permSettings'), desc: t('permSettingsDesc') },
        { key: 'payroll', label: t('permPayroll'), desc: t('permPayrollDesc') },
        { key: 'users_full', label: t('permUsersFull'), desc: t('permUsersFullDesc') },
    ];

    const openPermissions = (user: any) => {
        const existing: Array<{ key: string; expiresAt: string }> = Array.isArray(user.permissions) ? user.permissions : [];
        setPermForm(PERM_OPTIONS.map(opt => {
            const found = existing.find((p: any) => p.key === opt.key);
            return {
                key: opt.key,
                expiresAt: found ? found.expiresAt.slice(0, 10) : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                enabled: !!found,
            };
        }));
        setSelectedUser(user);
        setShowPermissionsModal(true);
    };

    const handleSavePermissions = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            const permissions = permForm
                .filter(p => p.enabled)
                .map(p => ({ key: p.key, expiresAt: new Date(p.expiresAt + 'T23:59:59').toISOString() }));
            await api.put(`/users/${selectedUser.id}/permissions`, { permissions });
            toast.success(t('permissionsUpdated'));
            setShowPermissionsModal(false);
            fetchUsers();
        } catch (e: any) {
            toast.error(e.response?.data?.error || tc('error'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            await api.delete(`/users/${selectedUser.id}`);
            toast.success(t('userDeleted'));
            setShowDeleteModal(false);
            fetchUsers();
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('errorDeleting'));
        } finally {
            setSaving(false);
        }
    };

    // ─── DataTable columns ──────────────────────────────────
    const columns = React.useMemo<Column<any>[]>(() => {
        const cols: Column<any>[] = [
            {
                key: 'email',
                header: t('email'),
                accessor: (user) => user.email || '',
                sortable: true,
                render: (user) => (
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs uppercase shrink-0">
                            {user.email[0]}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">{user.email}</p>
                            {user.employee && (
                                <p className="text-xs text-slate-400">{user.employee.firstName} {user.employee.lastName}</p>
                            )}
                        </div>
                    </div>
                ),
            },
            {
                key: 'role',
                header: t('roleLabel'),
                accessor: (user) => ROLE_LABELS[user.role as string] || user.role,
                sortable: true,
                render: (user) => (
                    <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-600'}`}>
                            {ROLE_LABELS[user.role as string] || user.role}
                        </span>
                        {user.role === 'HR' && Array.isArray(user.permissions) && user.permissions.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700" title={t('tempPermissions')}>
                                <Key className="h-2.5 w-2.5" /> {user.permissions.length}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                key: 'linkedEmployee',
                header: t('linkedEmployee'),
                accessor: (user) => user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : '',
                render: (user) => (
                    <span className="text-slate-600 text-xs">
                        {user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : <span className="text-slate-300 italic">{t('notLinked')}</span>}
                    </span>
                ),
            },
            {
                key: 'lastLogin',
                header: t('lastLogin'),
                accessor: (user) => user.lastLogin || '',
                sortable: true,
                render: (user) => (
                    <span className="text-slate-500 text-xs">
                        {user.lastLogin ? (
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(user.lastLogin).toLocaleDateString('fr-FR')}
                            </span>
                        ) : <span className="text-slate-300 italic">{t('never')}</span>}
                    </span>
                ),
            },
            {
                key: 'status',
                header: tc('status'),
                render: (user) => (
                    isAdmin ? (
                        <Switch
                            checked={user.isActive}
                            onCheckedChange={() => handleToggleActive(user)}
                            className="data-[state=checked]:bg-emerald-500"
                        />
                    ) : (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {user.isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                            {user.isActive ? tc('active') : tc('inactive')}
                        </span>
                    )
                ),
            },
        ];

        if (isAdmin) {
            cols.push({
                key: 'actions',
                header: tc('actions'),
                headerClassName: 'text-right',
                className: 'text-right',
                render: (user) => (
                    <div className="flex items-center justify-end gap-1">
                        {user.role === 'HR' && (
                            <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                                onClick={() => openPermissions(user)}
                                title={t('tempPermissions')}
                            >
                                <Key className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => { setSelectedUser({ ...user }); setShowEditModal(true); }}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            });
        }

        return cols;
    }, [isAdmin, t, tc]);

    // ─── Export columns ─────────────────────────────────────
    const exportColumns = React.useMemo<ExportColumn[]>(() => [
        { header: t('email'), accessor: (u) => u.email || '' },
        { header: t('roleLabel'), accessor: (u) => ROLE_LABELS[u.role as string] || u.role },
        { header: t('linkedEmployee'), accessor: (u) => u.employee ? `${u.employee.firstName} ${u.employee.lastName}` : '' },
        { header: t('lastLogin'), accessor: (u) => u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('fr-FR') : '' },
        { header: tc('status'), accessor: (u) => u.isActive ? tc('active') : tc('inactive') },
    ], [t, tc]);

    return (
        <div className="space-y-6">
            {/* En-tete */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-600/10"><UserCog className="h-7 w-7 text-blue-600" /></div>
                        {t('title')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('subtitle')}</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 gap-2 shrink-0">
                    <Plus className="h-4 w-4" />{` `}{t('newUser')}
                </Button>
            </motion.div>

            {/* Stats rapides */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['ADMIN', 'HR', 'EMPLOYEE'] as const).map(role => {
                    const count = users.filter(u => u.role === role).length;
                    return (
                        <Card key={role} className="border-slate-200/60 shadow-sm bg-white/80">
                            <CardContent className="p-4">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{ROLE_LABELS[role]}</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? '—' : count}</p>
                            </CardContent>
                        </Card>
                    );
                })}
                <Card className="border-slate-200/60 shadow-sm bg-white/80">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('total')}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? '—' : users.length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tableau */}
            <DataTable
                data={users}
                columns={columns}
                rowKey={(user) => user.id}
                searchable
                searchPlaceholder={t('searchPlaceholder')}
                searchFields={[
                    (u) => u.email || '',
                    (u) => ROLE_LABELS[u.role as string] || u.role || '',
                ]}
                loading={loading}
                emptyState={
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                        <UserCog className="h-10 w-10 text-slate-200" />
                        <p className="font-medium">{t('noUserFound')}</p>
                    </div>
                }
                headerExtra={
                    <>
                        <Button variant="outline" size="icon" onClick={fetchUsers} className="shrink-0">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <ExportButtons
                            data={users}
                            columns={exportColumns}
                            filename="utilisateurs"
                        />
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

            {/* Modal Creation */}
            <Dialog open={showCreateModal} onOpenChange={open => {
                setShowCreateModal(open);
                if (!open) setFormData({ email: '', password: '', role: 'EMPLOYEE', employeeId: '' });
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('createUserTitle')}</DialogTitle>
                        <DialogDescription>{t('createUserDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>{t('roleRequired')} <span className="text-red-500">*</span></Label>
                            {isAdmin ? (
                                <Select
                                    value={formData.role}
                                    onValueChange={v => setFormData(p => ({ ...p, role: v || '', employeeId: '' }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ADMIN">{t('roleAdmin')}</SelectItem>
                                        <SelectItem value="HR">{t('roleHR')}</SelectItem>
                                        <SelectItem value="EMPLOYEE">{t('roleEmployee')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="flex items-center h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-600">
                                    {t('roleEmployee')}
                                </div>
                            )}
                        </div>

                        {(formData.role === 'EMPLOYEE' || formData.role === 'HR') && (
                            <div className="space-y-1.5">
                                <Label>
                                    {t('linkedEmployee')}
                                    {formData.role === 'EMPLOYEE' && <span className="text-red-500"> *</span>}
                                    {formData.role === 'HR' && <span className="text-slate-400 text-xs ml-1">{t('employeeOptional')}</span>}
                                </Label>
                                <Select
                                    value={formData.employeeId || 'NONE'}
                                    onValueChange={v => setFormData(p => ({ ...p, employeeId: (!v || v === 'NONE') ? '' : v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectEmployeePlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formData.role === 'HR' && (
                                            <SelectItem value="NONE">{t('noEmployeeLinked')}</SelectItem>
                                        )}
                                        {employees.length === 0 ? (
                                            <SelectItem value="__empty__" disabled>
                                                {t('noEmployeeAvailable')}
                                            </SelectItem>
                                        ) : (
                                            employees.map(e => (
                                                <SelectItem key={e.id} value={e.id}>
                                                    {e.firstName} {e.lastName}
                                                    {e.position ? ` — ${e.position}` : ''}
                                                    {e.matricule ? ` (${e.matricule})` : ''}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {formData.role === 'EMPLOYEE' && (
                                    <p className="text-xs text-slate-500">
                                        {t('onlyActiveEmployees')}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>{t('email')} <span className="text-red-500">*</span></Label>
                            <Input
                                type="email" placeholder={t('emailPlaceholder')}
                                value={formData.email}
                                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                            />
                            {formData.employeeId && employees.find(e => e.id === formData.employeeId)?.email && formData.email === '' && (
                                <button
                                    type="button"
                                    className="text-xs text-blue-600 hover:underline"
                                    onClick={() => {
                                        const emp = employees.find(e => e.id === formData.employeeId);
                                        if (emp?.email) setFormData(p => ({ ...p, email: emp.email }));
                                    }}
                                >
                                    {t('useEmployeeEmail')} : {employees.find(e => e.id === formData.employeeId)?.email}
                                </button>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('tempPasswordLabel')} <span className="text-red-500">*</span></Label>
                            <Input
                                type="password" placeholder={t('minCharsPlaceholder')}
                                value={formData.password}
                                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>{tc('cancel')}</Button>
                        <Button onClick={handleCreate} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tc('create')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Edition du role */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{t('editRole')}</DialogTitle>
                        <DialogDescription>{selectedUser?.email}</DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label>{t('roleLabel')}</Label>
                        <Select
                            value={selectedUser?.role}
                            onValueChange={v => setSelectedUser((p: any) => ({ ...p, role: v }))}
                        >
                            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ADMIN">{t('roleAdmin')}</SelectItem>
                                <SelectItem value="HR">{t('roleHR')}</SelectItem>
                                <SelectItem value="EMPLOYEE">{t('roleEmployee')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditModal(false)}>{tc('cancel')}</Button>
                        <Button onClick={handleUpdateRole} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tc('save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Suppression */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">{t('deleteUser')}</DialogTitle>
                        <DialogDescription>
                            {t('deleteUserConfirm', { email: selectedUser?.email })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>{tc('cancel')}</Button>
                        <Button onClick={handleDelete} disabled={saving} variant="destructive">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tc('delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Permissions temporaires */}
            <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-amber-500" />
                            {t('permissionsTitle')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('permissionsDesc', { email: selectedUser?.email })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        {PERM_OPTIONS.map((opt, i) => {
                            const perm = permForm[i];
                            if (!perm) return null;
                            return (
                                <div key={opt.key} className={`p-4 rounded-xl border transition-colors ${perm.enabled ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={perm.enabled}
                                                onCheckedChange={checked =>
                                                    setPermForm(prev => prev.map((p, j) => j === i ? { ...p, enabled: checked } : p))
                                                }
                                                className="data-[state=checked]:bg-amber-500"
                                            />
                                            <span className="font-semibold text-sm text-slate-800">{opt.label}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 ml-11 mb-2">{opt.desc}</p>
                                    {perm.enabled && (
                                        <div className="ml-11">
                                            <Label className="text-xs text-slate-500">{t('expiresOn')}</Label>
                                            <Input
                                                type="date"
                                                value={perm.expiresAt}
                                                min={new Date().toISOString().slice(0, 10)}
                                                onChange={e =>
                                                    setPermForm(prev => prev.map((p, j) => j === i ? { ...p, expiresAt: e.target.value } : p))
                                                }
                                                className="mt-1 w-44 text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPermissionsModal(false)}>{tc('cancel')}</Button>
                        <Button onClick={handleSavePermissions} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tc('save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
