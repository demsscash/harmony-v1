'use client';

import * as React from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, ClipboardList, CheckSquare, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface TemplateTask {
    title: string;
    description: string;
    assignedRole: string;
    order: number;
}

export default function OnboardingPage() {
    const t = useTranslations('onboarding');
    const tc = useTranslations('common');
    const [templates, setTemplates] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [modal, setModal] = React.useState<'create' | 'edit' | null>(null);
    const [deleteModal, setDeleteModal] = React.useState(false);
    const [selected, setSelected] = React.useState<any>(null);
    const [saving, setSaving] = React.useState(false);

    const [form, setForm] = React.useState({ name: '', tasks: [] as TemplateTask[] });

    const fetchTemplates = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/onboarding/templates');
            setTemplates(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch {
            toast.error(t('loadError'));
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

    const openCreate = () => {
        setForm({ name: '', tasks: [{ title: '', description: '', assignedRole: 'HR', order: 1 }] });
        setModal('create');
    };

    const openEdit = (tpl: any) => {
        setSelected(tpl);
        setForm({
            name: tpl.name,
            tasks: Array.isArray(tpl.tasks) ? tpl.tasks : [],
        });
        setModal('edit');
    };

    const addTask = () => {
        setForm(p => ({
            ...p,
            tasks: [...p.tasks, { title: '', description: '', assignedRole: 'HR', order: p.tasks.length + 1 }]
        }));
    };

    const removeTask = (idx: number) => {
        setForm(p => ({
            ...p,
            tasks: p.tasks.filter((_, i) => i !== idx).map((t, i) => ({ ...t, order: i + 1 }))
        }));
    };

    const updateTask = (idx: number, field: keyof TemplateTask, value: string | number) => {
        setForm(p => ({
            ...p,
            tasks: p.tasks.map((t, i) => i === idx ? { ...t, [field]: value } : t)
        }));
    };

    const handleSave = async () => {
        if (!form.name) { toast.error(t('templateNameRequired')); return; }
        if (form.tasks.some(t => !t.title)) { toast.error(t('taskTitleRequired')); return; }
        setSaving(true);
        try {
            if (modal === 'create') {
                await api.post('/onboarding/templates', form);
                toast.success(t('templateCreated'));
            } else {
                await api.put(`/onboarding/templates/${selected.id}`, form);
                toast.success(t('templateUpdated'));
            }
            setModal(null);
            fetchTemplates();
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('saveError'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await api.delete(`/onboarding/templates/${selected.id}`);
            toast.success(t('templateDeleted'));
            setDeleteModal(false);
            fetchTemplates();
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('deleteError'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-600/10"><ClipboardList className="h-7 w-7 text-emerald-600" /></div>
                        {t('title')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('subtitle')}</p>
                </div>
                <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 gap-2 shrink-0">
                    <Plus className="h-4 w-4" /> {t('newTemplate')}
                </Button>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
            ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                    <ClipboardList className="h-12 w-12 text-slate-200" />
                    <p className="font-medium">{t('noTemplates')}</p>
                    <p className="text-xs text-center max-w-sm">{t('noTemplatesDesc')}</p>
                    <Button size="sm" variant="outline" onClick={openCreate} className="mt-2">
                        <Plus className="h-4 w-4 mr-1" /> {t('createTemplate')}
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map(tpl => {
                        const tasks = Array.isArray(tpl.tasks) ? tpl.tasks : [];
                        return (
                            <Card key={tpl.id} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <CardTitle className="text-base">{tpl.name}</CardTitle>
                                            <CardDescription className="text-xs mt-1">
                                                {t('taskCount', { count: tasks.length })}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => openEdit(tpl)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => { setSelected(tpl); setDeleteModal(true); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-1.5">
                                        {tasks.slice(0, 4).map((task: TemplateTask, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                                                <CheckSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                <span className="truncate">{task.title}</span>
                                            </div>
                                        ))}
                                        {tasks.length > 4 && (
                                            <p className="text-xs text-slate-400 pl-5">{t('otherTasks', { count: tasks.length - 4 })}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal creation/edit */}
            <Dialog open={modal !== null} onOpenChange={v => !v && setModal(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{modal === 'create' ? t('newTemplateModal') : t('editTemplateModal')}</DialogTitle>
                        <DialogDescription>{t('modalDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-2">
                        <div className="space-y-1.5">
                            <Label>{t('templateName')} <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder={t('templateNamePlaceholder')}
                                value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>{t('tasks', { count: form.tasks.length })}</Label>
                                <Button type="button" size="sm" variant="outline" onClick={addTask} className="gap-1.5">
                                    <Plus className="h-3.5 w-3.5" /> {t('addTask')}
                                </Button>
                            </div>

                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                                {form.tasks.map((task, idx) => (
                                    <div key={idx} className="flex gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                                        <div className="shrink-0 mt-2 text-slate-300">
                                            <GripVertical className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex gap-3">
                                                <div className="flex-1 space-y-1.5">
                                                    <Label className="text-xs">{t('taskTitle')} <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        placeholder={t('taskTitlePlaceholder')}
                                                        value={task.title}
                                                        onChange={e => updateTask(idx, 'title', e.target.value)}
                                                        className="h-9 text-sm"
                                                    />
                                                </div>
                                                <div className="w-32 space-y-1.5">
                                                    <Label className="text-xs">{t('responsible')}</Label>
                                                    <select
                                                        value={task.assignedRole}
                                                        onChange={e => updateTask(idx, 'assignedRole', e.target.value)}
                                                        className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background"
                                                    >
                                                        <option value="HR">RH</option>
                                                        <option value="ADMIN">Admin</option>
                                                        <option value="MANAGER">Manager</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">{t('descriptionOptional')}</Label>
                                                <Textarea
                                                    placeholder="..."
                                                    rows={2}
                                                    className="resize-none text-sm"
                                                    value={task.description}
                                                    onChange={e => updateTask(idx, 'description', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeTask(idx)}
                                            className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                {form.tasks.length === 0 && (
                                    <div className="flex flex-col items-center py-8 text-slate-400 border border-dashed rounded-xl">
                                        <ClipboardList className="h-8 w-8 mb-2 text-slate-300" />
                                        <p className="text-sm">{t('noTasks')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModal(null)}>{tc('cancel')}</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : modal === 'create' ? t('createBtn') : tc('save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete modal */}
            <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">{t('deleteTemplate')}</DialogTitle>
                        <DialogDescription>
                            {t('deleteConfirm', { name: selected?.name || '' })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModal(false)}>{tc('cancel')}</Button>
                        <Button onClick={handleDelete} disabled={saving} variant="destructive">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tc('delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
