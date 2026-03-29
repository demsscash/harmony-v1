'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api, { API_BASE_URL } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Plane, Calendar, Clock, Download, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

// STATUS labels moved to translations

export default function MyLeavesPage() {
    const { user } = useAuthStore();
    const t = useTranslations('employeePortal');
    const tc = useTranslations('common');
    const [leaves, setLeaves] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
    const [lastCreatedLeaveId, setLastCreatedLeaveId] = useState<string | null>(null);

    const handleDownloadPdf = (leaveId: string) => {
        const tenantSubdomain = user?.tenantSubdomain || window.location.hostname.split('.')[0];
        const token = useAuthStore.getState().token;
        window.open(`${API_BASE_URL}/leaves/${leaveId}/pdf?tenant=${tenantSubdomain}&token=${token}`, '_blank');
    };

    const fetchLeaves = async () => {
        try {
            const tenantSubdomain = user?.tenantSubdomain || window.location.hostname.split('.')[0];
            const [leavesRes, typesRes, balancesRes] = await Promise.all([
                // The API controller uses req.user.role === 'EMPLOYEE' to force filter by employeeId
                api.get('/leaves', { headers: { 'X-Tenant-Subdomain': tenantSubdomain } }),
                api.get('/leaves/types', { headers: { 'X-Tenant-Subdomain': tenantSubdomain } }),
                user?.employeeId ? api.get(`/leaves/balances/${user.employeeId}?year=${new Date().getFullYear()}`, { headers: { 'X-Tenant-Subdomain': tenantSubdomain } }).catch(() => null) : Promise.resolve(null)
            ]);

            if (leavesRes.data.success) setLeaves(leavesRes.data.data);
            if (typesRes.data.success) setLeaveTypes(typesRes.data.data);
            if (balancesRes?.data?.success) setLeaveBalances(balancesRes.data.data || []);

        } catch (error) {
            toast.error(t('errorLoadingLeaves'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchLeaves();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const tenantSubdomain = user?.tenantSubdomain || window.location.hostname.split('.')[0];
            const res = await api.post('/leaves', {
                ...form,
                employeeId: user?.employeeId, // Just a placeholder, backend will override it
                startDate: new Date(form.startDate).toISOString(),
                endDate: new Date(form.endDate).toISOString()
            }, { headers: { 'X-Tenant-Subdomain': tenantSubdomain } });

            if (res.data.success) {
                const newLeaveId = res.data.data?.id;
                toast.success(t('requestSent'));
                setOpenModal(false);
                setForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
                setLastCreatedLeaveId(newLeaveId || null);
                fetchLeaves();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('errorCreating'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('myLeaves')}</h1>
                    <p className="text-slate-500 mt-1">{t('myLeavesSubtitle')}</p>
                </div>
                <Dialog open={openModal} onOpenChange={setOpenModal}>
                    <DialogTrigger render={<Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm mb-1" />}>
                        <Plus className="h-4 w-4 mr-2" />{` `}{t('newRequest')}
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('requestLeave')}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('leaveType')}</Label>
                                <div className="relative">
                                    <select
                                        className="w-full h-10 appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                                        value={form.leaveTypeId}
                                        onChange={e => setForm({ ...form, leaveTypeId: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>{t('selectType')}</option>
                                        {leaveTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                    <span className="absolute right-3 top-3 pointer-events-none text-slate-400">
                                        ▼
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('startDate')}</Label>
                                    <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('endDate')}</Label>
                                    <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('reason')}</Label>
                                <Input value={form.reason || ''} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder={t('reasonPlaceholder')} />
                            </div>
                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>{tc('cancel')}</Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plane className="h-4 w-4 mr-2" />}
                                    {t('submitRequest')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {lastCreatedLeaveId && (
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Download className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-emerald-800">{t('requestReady')}</p>
                            <p className="text-xs text-emerald-600">{t('requestReadyDesc')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleDownloadPdf(lastCreatedLeaveId)}>
                            <Download className="h-4 w-4 mr-1.5" />{` `}{tc('download')}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-emerald-700 hover:bg-emerald-100" onClick={() => setLastCreatedLeaveId(null)}>✕</Button>
                    </div>
                </div>
            )}

            {leaveBalances.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {leaveBalances.map((bal: any) => {
                        const entitled = Number(bal.entitled || 0);
                        const taken = Number(bal.taken || 0);
                        const remaining = Number(bal.remaining ?? (entitled - taken));
                        const pct = entitled > 0 ? (remaining / entitled) * 100 : 0;
                        const color = pct > 50 ? 'emerald' : pct >= 20 ? 'amber' : 'red';
                        return (
                            <div key={bal.id || bal.leaveTypeCode} className="p-4 rounded-xl border bg-white shadow-sm">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{bal.leaveType?.name || bal.leaveTypeCode}</p>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className={`text-2xl font-bold ${color === 'emerald' ? 'text-emerald-600' : color === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>{remaining}</span>
                                    <span className="text-sm text-slate-400">/ {entitled} jours</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`}
                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">{taken} jour{taken !== 1 ? 's' : ''} pris</p>
                            </div>
                        );
                    })}
                </div>
            )}

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-slate-400" /> {t('requestHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {leaves.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">{t('type')}</th>
                                        <th className="px-4 py-3 font-semibold">{t('from')}</th>
                                        <th className="px-4 py-3 font-semibold">{t('to')}</th>
                                        <th className="px-4 py-3 font-semibold text-center">{t('daysCount')}</th>
                                        <th className="px-4 py-3 font-semibold">{tc('status')}</th>
                                        <th className="px-4 py-3 font-semibold text-right">{t('creation')}</th>
                                        <th className="px-4 py-3 font-semibold text-right">{t('slip')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {leaves.map((leave: any) => (
                                        <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-700">{leave.leaveType?.name || '—'}</td>
                                            <td className="px-4 py-3 text-slate-600">{new Date(leave.startDate).toLocaleDateString('fr-FR')}</td>
                                            <td className="px-4 py-3 text-slate-600">{new Date(leave.endDate).toLocaleDateString('fr-FR')}</td>
                                            <td className="px-4 py-3 text-slate-600 text-center font-mono bg-slate-50">{Number(leave.totalDays || leave.daysCount || 0)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold tracking-wider ${leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                    leave.status === 'REJECTED' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                        leave.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                                        'bg-amber-100 text-amber-700 border border-amber-200'
                                                    }`}>
                                                    {leave.status === 'PENDING' && <Clock className="h-3 w-3 mr-1 opacity-70" />}
                                                    {leave.status === 'APPROVED' && <CheckCircle2 className="h-3 w-3 mr-1 opacity-70" />}
                                                    {leave.status === 'REJECTED' && <XCircle className="h-3 w-3 mr-1 opacity-70" />}
                                                    {leave.status === 'PENDING' ? tc('pending') : leave.status === 'APPROVED' ? tc('approved') : leave.status === 'REJECTED' ? tc('rejected') : tc('cancelled')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-xs text-right hidden sm:table-cell">
                                                {new Date(leave.createdAt).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-emerald-600 h-8 w-8 p-0" title="Télécharger la fiche PDF" onClick={() => handleDownloadPdf(leave.id)}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                            <Plane className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">{t('noRequestFound')}</p>
                            <p className="text-slate-400 text-sm mt-1">{t('noRequestYet')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
