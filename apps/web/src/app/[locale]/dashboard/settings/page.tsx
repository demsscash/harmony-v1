'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import {
    Settings, Mail, Shield, Globe, Save, CheckCircle, Server,
    Database, Lock, RefreshCw, AlertTriangle, Loader2, Eye, EyeOff, Building2, Briefcase, ChevronRight, FileText,
    Plus, Trash2, Edit, Plane, Calendar, Clock, ImageIcon, Upload, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

// =========================================
// SUPER ADMIN COMPONENT
// =========================================
function SuperAdminSettings() {
    const t = useTranslations('settings');
    const tc = useTranslations('common');
    const [smtpForm, setSmtpForm] = React.useState({
        smtpHost: '', smtpPort: '587', smtpUser: '', smtpPassword: '',
        smtpFromEmail: '', smtpFromName: 'Harmony'
    });
    const [loading, setLoading] = React.useState(false);
    const [saved, setSaved] = React.useState(false);

    const handleSmtpSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            toast.info(t('smtpDev'));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const systemStats = [
        { label: t('apiVersion'), value: 'v1.0.0', icon: Server, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
        { label: t('databaseLabel'), value: 'PostgreSQL 15', icon: Database, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
        { label: t('environment'), value: process.env.NODE_ENV || 'development', icon: Globe, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
        { label: t('jwtExpiration'), value: '15 minutes', icon: Lock, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('systemStatus')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {systemStats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Icon className="h-16 w-16" />
                                </div>
                                <div className={`inline-flex h-10 w-10 rounded-xl items-center justify-center border mb-3 ${stat.color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">{t('smtpConfig')}</CardTitle>
                                <CardDescription className="text-sm mt-1 text-slate-500">{t('smtpDesc')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSmtpSave} className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('smtpHost')}</label>
                                    <Input placeholder="smtp.harmony.mr" className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Button type="submit" disabled={loading} className={`h-11 px-8 rounded-xl font-bold transition-all ${saved ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'}`}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : saved ? <CheckCircle className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    {loading ? t('applying') : saved ? t('saved') : tc('save')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Danger Zone */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 shadow-sm">
                    <CardHeader className="border-b border-red-100 dark:border-red-900/30 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-red-800 dark:text-red-400">{t('dangerZone')}</CardTitle>
                                <CardDescription className="text-sm mt-0.5 text-red-600/80 dark:text-red-400/80">{t('dangerZoneDesc')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between p-5 rounded-2xl border border-red-200/60 dark:border-red-900/50 bg-white dark:bg-slate-900 shadow-sm transition-all hover:border-red-300 dark:hover:border-red-800">
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white text-base">{t('restartApi')}</p>
                                <p className="text-sm text-slate-500 mt-1">{t('restartApiDesc')}</p>
                            </div>
                            <Button variant="outline" className="h-10 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 font-bold px-6">
                                <RefreshCw className="h-4 w-4 mr-2" /> {t('forceRestart')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

// =========================================
// INSTANCE ADMIN / HR COMPONENT
// =========================================
// =========================================
// LEAVE TYPES MANAGEMENT CARD
// =========================================
function LeaveTypesCard() {
    const t = useTranslations('settings');
    const tc = useTranslations('common');
    const [leaveTypes, setLeaveTypes] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [showForm, setShowForm] = React.useState(false);
    const [form, setForm] = React.useState({ name: '', description: '', daysAllowed: 0, isPaid: true, requiresApproval: true, maxConsecutiveDays: 0 });

    const fetchLeaveTypes = React.useCallback(async () => {
        try {
            const res = await api.get('/leaves/types');
            setLeaveTypes(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch { /* silent */ } finally { setLoading(false); }
    }, []);

    React.useEffect(() => { fetchLeaveTypes(); }, [fetchLeaveTypes]);

    const resetForm = () => {
        setForm({ name: '', description: '', daysAllowed: 0, isPaid: true, requiresApproval: true, maxConsecutiveDays: 0 });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (lt: any) => {
        setForm({ name: lt.name, description: lt.description || '', daysAllowed: lt.daysAllowed || 0, isPaid: lt.isPaid ?? true, requiresApproval: lt.requiresApproval ?? true, maxConsecutiveDays: lt.maxConsecutiveDays || 0 });
        setEditingId(lt.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name) { toast.error(t('nameRequired')); return; }
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/leaves/types/${editingId}`, form);
                toast.success(t('typeUpdated'));
            } else {
                await api.post('/leaves/types', form);
                toast.success(t('typeCreated'));
            }
            resetForm();
            fetchLeaveTypes();
        } catch (e: any) { toast.error(e.response?.data?.error || t('genericError')); } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteLeaveTypeConfirm'))) return;
        try {
            await api.delete(`/leaves/types/${id}`);
            toast.success(t('deleted'));
            fetchLeaveTypes();
        } catch (e: any) { toast.error(e.response?.data?.error || t('cannotDelete')); }
    };

    return (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                            <Plane className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">{t('leaveTypesTitle')}</CardTitle>
                            <CardDescription className="text-sm mt-1 text-slate-500">{t('leaveTypesCardDesc')}</CardDescription>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        <Plus className="h-4 w-4" /> {t('new')}
                    </button>
                </div>
            </CardHeader>
            <CardContent className="pt-5">
                <AnimatePresence>
                    {showForm && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="mb-5 p-5 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 rounded-2xl space-y-4"
                        >
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{editingId ? t('editLeaveType') : t('newLeaveType')}</h4>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('nameLabel')} <span className="text-red-500">*</span></label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={t('leaveNamePlaceholder')} className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('daysAllowedPerYear')}</label>
                                    <input type="number" min="0" value={form.daysAllowed} onChange={e => setForm(p => ({ ...p, daysAllowed: Number(e.target.value) }))} className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500" />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('description')}</label>
                                    <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder={t('optional')} className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={form.isPaid} onChange={e => setForm(p => ({ ...p, isPaid: e.target.checked }))} className="rounded" />
                                        <span className="text-sm font-medium text-slate-700">{t('paid')}</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={form.requiresApproval} onChange={e => setForm(p => ({ ...p, requiresApproval: e.target.checked }))} className="rounded" />
                                        <span className="text-sm font-medium text-slate-700">{t('approvalRequired')}</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">{tc('cancel')}</button>
                                <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    {editingId ? tc('save') : tc('create')}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-sky-500" /></div>
                ) : leaveTypes.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <Plane className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                        <p className="font-medium text-sm">{t('noLeaveTypeConfigured')}</p>
                        <p className="text-xs mt-1">{t('addFirstLeaveTypes')}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {leaveTypes.map((lt) => (
                            <div key={lt.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-sky-100 flex items-center justify-center">
                                        <Plane className="h-4 w-4 text-sky-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{lt.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {lt.daysAllowed > 0 && <span className="text-xs text-slate-500">{lt.daysAllowed} {t('daysPerYear')}</span>}
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${lt.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{lt.isPaid ? t('paid') : t('unpaid')}</span>
                                            {lt.requiresApproval && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{t('approval')}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" onClick={() => handleEdit(lt)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button type="button" onClick={() => handleDelete(lt.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// =========================================
// HOLIDAYS MANAGEMENT CARD
// =========================================
function HolidaysCard() {
    const t = useTranslations('settings');
    const tc = useTranslations('common');
    const [holidays, setHolidays] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [seeding, setSeeding] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [showForm, setShowForm] = React.useState(false);
    const [form, setForm] = React.useState({ name: '', date: '', isRecurring: true });

    const fetchHolidays = React.useCallback(async () => {
        try {
            const res = await api.get('/holidays');
            setHolidays(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch { /* silent */ } finally { setLoading(false); }
    }, []);

    React.useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

    const resetForm = () => {
        setForm({ name: '', date: '', isRecurring: true });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (h: any) => {
        setForm({ name: h.name, date: h.date ? h.date.substring(0, 10) : '', isRecurring: h.isRecurring ?? true });
        setEditingId(h.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name) { toast.error(t('nameRequired')); return; }
        if (!form.date) { toast.error(t('dateRequired')); return; }
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/holidays/${editingId}`, form);
                toast.success(t('holidayUpdated'));
            } else {
                await api.post('/holidays', form);
                toast.success(t('holidayCreated'));
            }
            resetForm();
            fetchHolidays();
        } catch (e: any) { toast.error(e.response?.data?.error || t('genericError')); } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteHolidayConfirm'))) return;
        try {
            await api.delete(`/holidays/${id}`);
            toast.success(t('deleted'));
            fetchHolidays();
        } catch (e: any) { toast.error(e.response?.data?.error || t('cannotDelete')); }
    };

    const handleSeedDefaults = async () => {
        setSeeding(true);
        try {
            await api.post('/holidays/seed-defaults');
            toast.success(t('defaultHolidaysLoaded'));
            fetchHolidays();
        } catch (e: any) { toast.error(e.response?.data?.error || t('loadError')); } finally { setSeeding(false); }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch { return dateStr; }
    };

    return (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">{t('holidaysTitle')}</CardTitle>
                            <CardDescription className="text-sm mt-1 text-slate-500">{t('holidaysDesc')}</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSeedDefaults}
                            disabled={seeding}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                            {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            {t('loadDefaults')}
                        </button>
                        <button
                            type="button"
                            onClick={() => { resetForm(); setShowForm(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                            <Plus className="h-4 w-4" /> {t('new')}
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-5">
                <AnimatePresence>
                    {showForm && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="mb-5 p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-4"
                        >
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{editingId ? t('editHoliday') : t('newHoliday')}</h4>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('nameLabel')} <span className="text-red-500">*</span></label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={t('holidayNamePlaceholder')} className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('dateLabel')} <span className="text-red-500">*</span></label>
                                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={form.isRecurring} onChange={e => setForm(p => ({ ...p, isRecurring: e.target.checked }))} className="rounded" />
                                        <span className="text-sm font-medium text-slate-700">{t('recurringYearly')}</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">{tc('cancel')}</button>
                                <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    {editingId ? tc('save') : tc('create')}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
                ) : holidays.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                        <p className="font-medium text-sm">{t('noHolidayConfigured')}</p>
                        <p className="text-xs mt-1">{t('addHolidaysHint')}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {holidays.map((h) => (
                            <div key={h.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{h.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-slate-500">{formatDate(h.date)}</span>
                                            {h.isRecurring && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">{t('recurring')}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" onClick={() => handleEdit(h)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button type="button" onClick={() => handleDelete(h.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// =========================================
// INSTANCE ADMIN / HR COMPONENT
// =========================================
// =========================================
// LOGO UPLOAD CARD
// =========================================
function LogoCard() {
    const t = useTranslations('settings');
    const { tenantLogo, setTenantLogo } = useAuthStore();
    const [currentLogo, setCurrentLogo] = React.useState<string | null>(tenantLogo);
    const [preview, setPreview] = React.useState<string | null>(null);
    const [uploading, setUploading] = React.useState(false);
    const [loadingLogo, setLoadingLogo] = React.useState(true);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        const fetchLogo = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data.success && res.data.data?.logo) {
                    setCurrentLogo(res.data.data.logo);
                    setTenantLogo(res.data.data.logo);
                }
            } catch {
                // ignore
            } finally {
                setLoadingLogo(false);
            }
        };
        fetchLogo();
    }, [setTenantLogo]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate format
        const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            toast.error(t('invalidFormat'));
            return;
        }

        // Validate size (500KB)
        if (file.size > 500 * 1024) {
            toast.error(t('logoTooLarge'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            setPreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!preview) return;
        setUploading(true);
        try {
            await api.patch('/settings/logo', { logo: preview });
            setCurrentLogo(preview);
            setTenantLogo(preview);
            setPreview(null);
            toast.success(t('logoUpdated'));
        } catch {
            toast.error(t('typeError'));
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async () => {
        setUploading(true);
        try {
            await api.delete('/settings/logo');
            setCurrentLogo(null);
            setTenantLogo(null);
            setPreview(null);
            toast.success(t('logoRemoved'));
        } catch {
            toast.error(t('typeError'));
        } finally {
            setUploading(false);
        }
    };

    const handleCancelPreview = () => {
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const displayLogo = preview || currentLogo;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">{t('companyLogo')}</CardTitle>
                            <CardDescription className="text-sm mt-1 text-slate-500">{t('companyLogoDesc')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-6">
                        {/* Logo display */}
                        <div className="relative flex-shrink-0">
                            {loadingLogo ? (
                                <div className="h-24 w-24 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
                                </div>
                            ) : displayLogo ? (
                                <div className="h-24 w-24 rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center">
                                    <img src={displayLogo} alt="Logo" className="h-full w-full object-contain p-1" />
                                </div>
                            ) : (
                                <div className="h-24 w-24 rounded-xl bg-blue-600 flex items-center justify-center">
                                    <span className="text-3xl font-black text-white">H</span>
                                </div>
                            )}
                            {preview && (
                                <button type="button" onClick={handleCancelPreview}
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {preview ? (
                                <Button type="button" onClick={handleUpload} disabled={uploading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-sm font-semibold">
                                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    {uploading ? t('applying') : t('saveLogo')}
                                </Button>
                            ) : (
                                <Button type="button" onClick={() => fileInputRef.current?.click()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-sm font-semibold">
                                    <Upload className="h-4 w-4 mr-2" />
                                    {t('changeLogo')}
                                </Button>
                            )}

                            {currentLogo && !preview && (
                                <Button type="button" variant="outline" onClick={handleRemove} disabled={uploading}
                                    className="h-9 px-4 text-sm font-semibold text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950">
                                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                    {t('removeLogo')}
                                </Button>
                            )}

                            <p className="text-xs text-slate-400 font-medium">{t('logoHint')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// =========================================
// TENANT SETTINGS COMPONENT
// =========================================
function TenantSettings() {
    const t = useTranslations('settings');
    const tc = useTranslations('common');
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [previewing, setPreviewing] = React.useState(false);
    const [testingSmtp, setTestingSmtp] = React.useState(false);
    const [smtpForm, setSmtpForm] = React.useState({
        smtpHost: '', smtpPort: '587', smtpUser: '', smtpPassword: '',
        smtpFromEmail: '', smtpFromName: '', testEmail: ''
    });
    const [form, setForm] = React.useState({
        name: '', email: '', phone: '', address: '', currency: 'MRU',
        fiscalYearStart: 1, workDaysPerWeek: 5, weekStartDay: 1, defaultLeaveDays: 24,
        leaveCarryOver: 'CONFIGURABLE', maxCarryOverDays: 0,
        contractTemplate: ''
    });

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data.success) {
                    const t = res.data.data;
                    const s = t.settings || {};
                    setForm({
                        name: t.name || '', email: t.email || '', phone: t.phone || '', address: t.address || '',
                        currency: t.currency || 'MRU', leaveCarryOver: t.leaveCarryOver || 'CONFIGURABLE',
                        maxCarryOverDays: t.maxCarryOverDays || 0,
                        fiscalYearStart: s.fiscalYearStart || 1, workDaysPerWeek: s.workDaysPerWeek || 5, weekStartDay: s.weekStartDay || 1,
                        defaultLeaveDays: s.defaultLeaveDays || 24,
                        contractTemplate: s.contractTemplate || ''
                    });
                }
            } catch (error) {
                toast.error(t('settingsLoadError'));
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/settings', form);
            toast.success(t('settingsSaved'));
        } catch (error) {
            toast.error(t('settingsSaveError'));
        } finally {
            setSaving(false);
        }
    };

    const handlePreview = async () => {
        setPreviewing(true);
        try {
            const response = await api.post('/settings/preview-contract', {
                contractTemplate: form.contractTemplate
            }, {
                responseType: 'blob' // Important for PDF
            });

            // Create a blob URL and open it in a new tab
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');

        } catch (error) {
            toast.error(t('previewError'));
            console.error(error);
        } finally {
            setPreviewing(false);
        }
    };

    const handleSmtpSave = async () => {
        try {
            const { testEmail, ...smtpData } = smtpForm;
            await api.put('/settings', {
                smtpHost: smtpData.smtpHost || undefined,
                smtpPort: smtpData.smtpPort ? Number(smtpData.smtpPort) : undefined,
                smtpUser: smtpData.smtpUser || undefined,
                smtpPassword: smtpData.smtpPassword || undefined,
                smtpFromEmail: smtpData.smtpFromEmail || undefined,
                smtpFromName: smtpData.smtpFromName || undefined,
            });
            toast.success(t('smtpSaved'));
        } catch {
            toast.error(t('smtpSaveError'));
        }
    };

    const handleSmtpTest = async () => {
        if (!smtpForm.testEmail) {
            toast.error(t('enterTestEmail'));
            return;
        }
        setTestingSmtp(true);
        try {
            await api.post('/notifications/test-smtp', { testEmail: smtpForm.testEmail });
            toast.success(t('testSent'));
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('smtpTestError'));
        } finally {
            setTestingSmtp(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="text-slate-500 font-medium animate-pulse">{t('settingsLoading')}</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <LogoCard />

            <form onSubmit={handleSave} className="space-y-8">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">{t('orgIdentity')}</CardTitle>
                                <CardDescription className="text-sm mt-1 text-slate-500">{t('orgIdentityDesc')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8 grid sm:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('legalName')}</label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                                className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('emailHrDirection')}</label>
                            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('phoneStandard')}</label>
                            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('accountingCurrency')}</label>
                            <div className="relative">
                                <select className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 text-sm font-medium text-slate-900 dark:text-white appearance-none outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                                    value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                                    <option value="MRU">Ouguiya (MRU)</option>
                                    <option value="EUR">Euro (EUR)</option>
                                    <option value="USD">Dollar (USD)</option>
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">{t('hrRules')}</CardTitle>
                                <CardDescription className="text-sm mt-1 text-slate-500">{t('hrRulesDesc')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8 grid sm:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('fiscalYearStartMonth')}</label>
                            <div className="relative">
                                <select className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 text-sm font-medium text-slate-900 dark:text-white appearance-none outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                                    value={form.fiscalYearStart} onChange={e => setForm({ ...form, fiscalYearStart: Number(e.target.value) })}>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('fr', { month: 'long' }).toUpperCase()}</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('workDaysPerWeek')}</label>
                            <Input type="number" min="1" max="7" value={form.workDaysPerWeek} onChange={e => setForm({ ...form, workDaysPerWeek: Number(e.target.value) })}
                                className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('defaultAnnualLeaveDays')}</label>
                            <Input type="number" min="0" max="365" value={form.defaultLeaveDays} onChange={e => setForm({ ...form, defaultLeaveDays: Number(e.target.value) })}
                                className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium" />
                        </div>

                        <div className="space-y-2 sm:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">{t('leaveCarryOverPolicy')}</label>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="relative">
                                    <select className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 text-sm font-medium text-slate-900 dark:text-white appearance-none outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                                        value={form.leaveCarryOver} onChange={e => setForm({ ...form, leaveCarryOver: e.target.value })}>
                                        <option value="NONE">{t('carryOverNone')}</option>
                                        <option value="CAPPED">{t('carryOverCapped')}</option>
                                        <option value="UNLIMITED">{t('carryOverUnlimited')}</option>
                                        <option value="CONFIGURABLE">{t('carryOverConfigurable')}</option>
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none" />
                                </div>
                                <AnimatePresence>
                                    {form.leaveCarryOver === 'CAPPED' && (
                                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                            <Input type="number" min="0" placeholder={t('maxCarryOverPlaceholder')}
                                                value={form.maxCarryOverDays} onChange={e => setForm({ ...form, maxCarryOverDays: Number(e.target.value) })}
                                                className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium border-l-amber-400 border-l-4" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* ===== Leave Types Card ===== */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.4 }}>
                <LeaveTypesCard />
            </motion.div>

            {/* ===== Holidays Card ===== */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.17, duration: 0.4 }}>
                <HolidaysCard />
            </motion.div>

            {/* ===== Attendance Config Card ===== */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.19, duration: 0.4 }}>
                <AttendanceConfigCard />
            </motion.div>

            {/* ===== Tax Config Card ===== */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.21, duration: 0.4 }}>
                <TaxConfigCard />
            </motion.div>

            {/* ===== SMTP Card ===== */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.4 }}>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">{t('smtpConfigTitle')}</CardTitle>
                                <CardDescription className="text-sm mt-1 text-slate-500">{t('smtpConfigDesc')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('smtpHost')}</label>
                                <Input placeholder="smtp.example.com" value={smtpForm.smtpHost} onChange={e => setSmtpForm({ ...smtpForm, smtpHost: e.target.value })} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('portLabel')}</label>
                                <Input placeholder="587" value={smtpForm.smtpPort} onChange={e => setSmtpForm({ ...smtpForm, smtpPort: e.target.value })} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('smtpUserLabel')}</label>
                                <Input placeholder="notifications@example.com" value={smtpForm.smtpUser} onChange={e => setSmtpForm({ ...smtpForm, smtpUser: e.target.value })} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('passwordLabel')}</label>
                                <Input type="password" placeholder="••••••••" value={smtpForm.smtpPassword} onChange={e => setSmtpForm({ ...smtpForm, smtpPassword: e.target.value })} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('senderEmailLabel')}</label>
                                <Input placeholder="rh@example.com" value={smtpForm.smtpFromEmail} onChange={e => setSmtpForm({ ...smtpForm, smtpFromEmail: e.target.value })} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('senderNameLabel')}</label>
                                <Input placeholder={t('senderNamePlaceholder')} value={smtpForm.smtpFromName} onChange={e => setSmtpForm({ ...smtpForm, smtpFromName: e.target.value })} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
                            <Input placeholder={t('testEmailPlaceholder')} value={smtpForm.testEmail} onChange={e => setSmtpForm({ ...smtpForm, testEmail: e.target.value })} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 flex-1 min-w-[220px]" />
                            <Button type="button" variant="outline" onClick={handleSmtpTest} disabled={testingSmtp} className="h-11 px-5 border-blue-200 text-blue-700 hover:bg-blue-50">
                                {testingSmtp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                                {t('testSmtp')}
                            </Button>
                            <Button type="button" onClick={handleSmtpSave} className="h-11 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800">
                                <Save className="h-4 w-4 mr-2" /> {t('saveSmtp')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">{t('contractTemplate')}</CardTitle>
                                <CardDescription className="text-sm mt-1 text-slate-500">{t('contractTemplateDesc')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">{t('contractBodyLabel')}</label>
                                <Textarea
                                    className="min-h-[300px] font-mono text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-4 leading-relaxed resize-y"
                                    placeholder={t('contractBodyPlaceholder')}
                                    value={form.contractTemplate}
                                    onChange={e => setForm({ ...form, contractTemplate: e.target.value })}
                                />
                                <p className="text-xs text-slate-500 mt-2">{t('contractBodyHint')}</p>
                            </div>

                            <div className="w-full md:w-64 shrink-0 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    {t('magicVariables')}
                                </h4>
                                <p className="text-xs text-slate-500 mb-4">{t('magicVariablesDesc')}</p>
                                <ul className="space-y-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                    <li><code className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-1 py-0.5 rounded">{"{{EMPLOYEE_NAME}}"}</code><br />{t('varEmployeeName')}</li>
                                    <li><code className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-1 py-0.5 rounded">{"{{POSITION}}"}</code><br />{t('varPosition')}</li>
                                    <li><code className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-1 py-0.5 rounded">{"{{DEPARTMENT}}"}</code><br />{t('varDepartment')}</li>
                                    <li><code className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-1 py-0.5 rounded">{"{{START_DATE}}"}</code><br />{t('varStartDate')}</li>
                                    <li><code className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-1 py-0.5 rounded">{"{{CONTRACT_TYPE}}"}</code><br />{t('varContractType')}</li>
                                    <li><code className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-1 py-0.5 rounded">{"{{SALARY}}"}</code><br />{t('varSalary')}</li>
                                    <li><code className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-1 py-0.5 rounded">{"{{CURRENCY}}"}</code><br />{t('varCurrency')}</li>
                                </ul>

                                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full flex items-center justify-center gap-2 border-violet-200 dark:border-violet-900/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-violet-700 dark:text-violet-400"
                                        onClick={handlePreview}
                                        disabled={previewing}
                                    >
                                        {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                        {t('previewPdf')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="flex items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10">
                <div>
                    <h3 className="text-white font-bold text-lg tracking-tight">{t('readyToDeploy')}</h3>
                    <p className="text-slate-400 text-sm mt-1">{t('remindEmployees')}</p>
                </div>
                <Button type="submit" disabled={saving} className="h-12 px-8 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {saving && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                    {t('confirmChanges')}
                </Button>
            </motion.div>
        </form>
        </div>
    );
}

// =========================================
// TAX CONFIG CARD (CNSS / ITS)
// =========================================
function OrgLevelsCard() {
    const t = useTranslations('orgLevels');
    const tc = useTranslations('common');
    const [levels, setLevels] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showForm, setShowForm] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [form, setForm] = React.useState({ name: '', rank: '', description: '' });
    const [saving, setSaving] = React.useState(false);
    const [deleteId, setDeleteId] = React.useState<string | null>(null);

    const fetchLevels = async () => {
        try {
            const res = await api.get('/org-levels');
            setLevels(res.data?.data || []);
        } catch { /* silent */ }
        setLoading(false);
    };

    React.useEffect(() => { fetchLevels(); }, []);

    const resetForm = () => { setForm({ name: '', rank: '', description: '' }); setEditingId(null); setShowForm(false); };

    const openCreate = () => {
        const nextRank = levels.length > 0 ? Math.max(...levels.map(l => l.rank)) + 1 : 1;
        setForm({ name: '', rank: String(nextRank), description: '' });
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (level: any) => {
        setForm({ name: level.name, rank: String(level.rank), description: level.description || '' });
        setEditingId(level.id);
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!form.name || !form.rank) return;
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/org-levels/${editingId}`, { name: form.name, rank: Number(form.rank), description: form.description || undefined });
                toast.success(t('updateSuccess'));
            } else {
                await api.post('/org-levels', { name: form.name, rank: Number(form.rank), description: form.description || undefined });
                toast.success(t('createSuccess'));
            }
            resetForm();
            fetchLevels();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/org-levels/${deleteId}`);
            toast.success(t('deleteSuccess'));
            setDeleteId(null);
            fetchLevels();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    return (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Briefcase className="h-5 w-5 text-indigo-600" />
                            {t('title')}
                        </CardTitle>
                        <CardDescription>{t('subtitle')}</CardDescription>
                    </div>
                    <Button size="sm" onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> {t('addLevel')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {loading ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-indigo-500" /></div>
                ) : levels.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-xl bg-slate-50">
                        <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-500">{t('noLevels')}</p>
                        <p className="text-xs text-slate-400 mt-1">{t('examples')}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {levels.map((level, idx) => (
                            <div key={level.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:bg-slate-100 transition-colors">
                                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                                    {level.rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800">{level.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {level.description || t('employeeCount', { count: level._count?.employees || 0 })}
                                    </p>
                                </div>
                                {idx < levels.length - 1 && (
                                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 hidden sm:block" />
                                )}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(level)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => setDeleteId(level.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Inline Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3 mt-2">
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-slate-600">{t('name')} *</label>
                                        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('namePlaceholder')} className="mt-1" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-600">{t('rank')} *</label>
                                        <Input type="number" min="1" value={form.rank} onChange={e => setForm({ ...form, rank: e.target.value })} className="mt-1" />
                                        <p className="text-[10px] text-slate-400 mt-0.5">{t('rankHint')}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600">{t('description')}</label>
                                    <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={t('descriptionPlaceholder')} className="mt-1" />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={resetForm}>{tc('cancel')}</Button>
                                    <Button size="sm" onClick={handleSubmit} disabled={saving || !form.name || !form.rank} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                                        {editingId ? tc('save') : tc('create')}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Delete confirm */}
                {deleteId && (
                    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-sm text-red-700">{t('deleteConfirm')}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>{tc('cancel')}</Button>
                            <Button variant="destructive" size="sm" onClick={handleDelete}>{tc('delete')}</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function TaxConfigCard() {
    const t = useTranslations('taxConfig');
    const tc = useTranslations('common');
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [cnssEmployeeRate, setCnssEmployeeRate] = React.useState(1);
    const [cnssEmployerRate, setCnssEmployerRate] = React.useState(13);
    const [cnssCeiling, setCnssCeiling] = React.useState(70000);
    const [cnamEmployeeRate, setCnamEmployeeRate] = React.useState(0);
    const [cnamEmployerRate, setCnamEmployerRate] = React.useState(4);
    const [cnamCeiling, setCnamCeiling] = React.useState(70000);
    const [mdtRate, setMdtRate] = React.useState(0.25);
    const [itsBrackets, setItsBrackets] = React.useState<{ min: number; max: number | null; rate: number }[]>([
        { min: 0, max: 9000, rate: 0 },
        { min: 9000, max: 21000, rate: 15 },
        { min: 21000, max: 50000, rate: 25 },
        { min: 50000, max: null, rate: 40 },
    ]);

    React.useEffect(() => {
        api.get('/settings/tax-config').then(res => {
            const d = res.data?.data;
            if (d) {
                setCnssEmployeeRate(Number(d.cnssEmployeeRate) * 100);
                setCnssEmployerRate(Number(d.cnssEmployerRate) * 100);
                setCnssCeiling(Number(d.cnssCeiling));
                setCnamEmployeeRate(Number(d.cnamEmployeeRate ?? 0) * 100);
                setCnamEmployerRate(Number(d.cnamEmployerRate ?? 0.04) * 100);
                setCnamCeiling(Number(d.cnamCeiling ?? 70000));
                setMdtRate(Number(d.mdtRate ?? 0.0025) * 100);
                if (d.itsBrackets && Array.isArray(d.itsBrackets)) {
                    setItsBrackets(d.itsBrackets.map((b: any) => ({ min: b.min, max: b.max, rate: b.rate * 100 })));
                }
            }
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/settings/tax-config', {
                cnssEmployeeRate: cnssEmployeeRate / 100,
                cnssEmployerRate: cnssEmployerRate / 100,
                cnssCeiling,
                cnamEmployeeRate: cnamEmployeeRate / 100,
                cnamEmployerRate: cnamEmployerRate / 100,
                cnamCeiling,
                mdtRate: mdtRate / 100,
                itsBrackets: itsBrackets.map(b => ({ min: b.min, max: b.max, rate: b.rate / 100 })),
            });
            toast.success(t('saved'));
        } catch (err: any) {
            toast.error(err.response?.data?.error || tc('error'));
        } finally {
            setSaving(false);
        }
    };

    const addBracket = () => {
        const last = itsBrackets[itsBrackets.length - 1];
        setItsBrackets([...itsBrackets, { min: last?.max ?? 0, max: null, rate: 0 }]);
    };

    const removeBracket = (idx: number) => {
        setItsBrackets(itsBrackets.filter((_, i) => i !== idx));
    };

    const updateBracket = (idx: number, field: string, value: string) => {
        const updated = [...itsBrackets];
        if (field === 'max' && value === '') {
            updated[idx] = { ...updated[idx], max: null };
        } else {
            (updated[idx] as any)[field] = parseFloat(value) || 0;
        }
        setItsBrackets(updated);
    };

    if (loading) return null;

    return (
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Database className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-900">{t('title')}</CardTitle>
                        <CardDescription className="text-slate-500 text-sm">{t('subtitle')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {/* CNSS */}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">CNSS</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">{t('cnssEmployeeRate')}</label>
                            <Input type="number" step="0.01" min="0" max="100" value={cnssEmployeeRate} onChange={e => setCnssEmployeeRate(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">{t('cnssEmployerRate')}</label>
                            <Input type="number" step="0.01" min="0" max="100" value={cnssEmployerRate} onChange={e => setCnssEmployerRate(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">{t('cnssCeiling')}</label>
                            <Input type="number" min="0" value={cnssCeiling} onChange={e => setCnssCeiling(parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                </div>

                {/* CNAM (retenue salariale uniquement) */}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">CNAM (retenue salariale)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">{t('cnamEmployeeRate')}</label>
                            <Input type="number" step="0.01" min="0" max="100" value={cnamEmployeeRate} onChange={e => setCnamEmployeeRate(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">{t('cnamCeiling')}</label>
                            <Input type="number" min="0" value={cnamCeiling} onChange={e => setCnamCeiling(parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                </div>

                {/* MDT */}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">MDT</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">{t('mdtRate')}</label>
                            <Input type="number" step="0.01" min="0" max="100" value={mdtRate} onChange={e => setMdtRate(parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                </div>

                {/* ITS Brackets */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">{t('itsBrackets')}</label>
                        <Button variant="outline" size="sm" onClick={addBracket} className="gap-1.5">
                            <Plus className="h-3.5 w-3.5" /> {t('addBracket')}
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {itsBrackets.map((bracket, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <Input
                                    type="number" min="0" placeholder={t('bracketMin')}
                                    value={bracket.min} onChange={e => updateBracket(idx, 'min', e.target.value)}
                                    className="w-28 text-sm"
                                />
                                <span className="text-slate-400">→</span>
                                <Input
                                    type="number" min="0" placeholder={t('unlimited')}
                                    value={bracket.max ?? ''} onChange={e => updateBracket(idx, 'max', e.target.value)}
                                    className="w-28 text-sm"
                                />
                                <Input
                                    type="number" step="0.1" min="0" max="100" placeholder="%"
                                    value={bracket.rate} onChange={e => updateBracket(idx, 'rate', e.target.value)}
                                    className="w-20 text-sm"
                                />
                                <span className="text-xs text-slate-400">%</span>
                                {itsBrackets.length > 1 && (
                                    <button onClick={() => removeBracket(idx)} className="p-1 text-slate-400 hover:text-red-500" aria-label={tc('delete')}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        <Save className="h-4 w-4" />
                        {saving ? tc('loading') : tc('save')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// =========================================
// ATTENDANCE CONFIG CARD
// =========================================
function AttendanceConfigCard() {
    const t = useTranslations('attendance');
    const tc = useTranslations('common');
    const [codes, setCodes] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showForm, setShowForm] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [form, setForm] = React.useState({ code: '', label: '', color: '#3b82f6', deductsSalary: false, order: 0 });
    const [saving, setSaving] = React.useState(false);
    const [deleteId, setDeleteId] = React.useState<string | null>(null);

    const fetchCodes = () => {
        api.get('/attendance/codes').then(res => setCodes(res.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
    };
    React.useEffect(() => { fetchCodes(); }, []);

    const resetForm = () => { setForm({ code: '', label: '', color: '#3b82f6', deductsSalary: false, order: 0 }); setEditingId(null); setShowForm(false); };

    const openEdit = (c: any) => {
        setForm({ code: c.code, label: c.label, color: c.color, deductsSalary: c.deductsSalary, order: c.order });
        setEditingId(c.id);
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!form.code || !form.label) return;
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/attendance/codes/${editingId}`, form);
                toast.success(t('codeUpdated'));
            } else {
                await api.post('/attendance/codes', { ...form, order: codes.length + 1 });
                toast.success(t('codeCreated'));
            }
            resetForm();
            fetchCodes();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/attendance/codes/${deleteId}`);
            toast.success(t('codeDeleted'));
            setDeleteId(null);
            fetchCodes();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
    };

    return (
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{t('codes')}</CardTitle>
                            <CardDescription>{t('codesSubtitle')}</CardDescription>
                        </div>
                    </div>
                    <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> {t('addCode')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /></div>
                ) : (
                    <div className="space-y-2">
                        {codes.map(c => (
                            <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:bg-slate-100 transition-colors">
                                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ backgroundColor: c.color }}>
                                    {c.code}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800">{c.label}</p>
                                    <p className="text-xs text-slate-500">
                                        {c.deductsSalary ? <span className="text-red-500 font-semibold">{t('deductsSalary')}</span> : <span className="text-emerald-500">{tc('no')}</span>}
                                        {c.isDefault && <span className="ml-2 text-blue-500">({t('isDefault')})</span>}
                                    </p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="h-3.5 w-3.5" /></button>
                                    {!c.isDefault && (
                                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showForm && (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3 mt-2">
                        <div className="grid grid-cols-4 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-600">{t('codeLabel')} *</label>
                                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="AB" maxLength={4} className="mt-1" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-medium text-slate-600">{t('codeName')} *</label>
                                <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Absence" className="mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">{t('codeColor')}</label>
                                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="mt-1 w-full h-9 rounded-lg border border-slate-200 cursor-pointer" />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.deductsSalary} onChange={e => setForm({ ...form, deductsSalary: e.target.checked })} className="rounded" />
                            <span className="text-sm text-slate-700 font-medium">{t('deductsSalary')}</span>
                        </label>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={resetForm}>{tc('cancel')}</Button>
                            <Button size="sm" onClick={handleSubmit} disabled={saving || !form.code || !form.label} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                                {editingId ? tc('save') : tc('create')}
                            </Button>
                        </div>
                    </div>
                )}

                {deleteId && (
                    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-sm text-red-700">{t('deleteCodeConfirm')}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>{tc('cancel')}</Button>
                            <Button variant="destructive" size="sm" onClick={handleDelete}>{tc('delete')}</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// =========================================
// MAIN PAGE EXPORT
// =========================================
export default function SettingsPage() {
    const { user } = useAuthStore();
    const t = useTranslations('settings');
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isAdmin = user?.role === 'ADMIN';
    const hasSettingsPerm = user?.permissions?.includes('settings');

    // HR n'a pas accès aux paramètres (sauf permission temporaire)
    if (!isSuperAdmin && !isAdmin && !hasSettingsPerm) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                <Settings className="h-10 w-10 text-slate-200" />
                <p className="font-medium">{t('accessDenied')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="relative overflow-hidden bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">

                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 dark:bg-slate-800/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60" />

                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-6">
                        <Settings className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                        {isSuperAdmin ? t('title') : t('orgSettings')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
                        {isSuperAdmin
                            ? t('subtitle')
                            : t('orgDesc')}
                    </p>
                </div>
            </motion.div>

            {isSuperAdmin ? <SuperAdminSettings /> : <TenantSettings />}
        </div>
    );
}
