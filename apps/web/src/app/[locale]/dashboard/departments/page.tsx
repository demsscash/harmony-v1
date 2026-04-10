'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Network, Plus, Edit, Trash2, Loader2, Users, ChevronRight, UserCircle, Building2 } from 'lucide-react';
import api from '@/lib/api';

export default function DepartmentsPage() {
    const t = useTranslations('departments');
    const tc = useTranslations('common');

    const [units, setUnits] = useState<any[]>([]);
    const [orgLevels, setOrgLevels] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        description: '',
        orgLevelId: '',
        parentId: '',
        managerId: '',
    });
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            const [deptRes, levelsRes, empRes] = await Promise.all([
                api.get('/departments'),
                api.get('/org-levels'),
                api.get('/employees'),
            ]);
            setUnits(deptRes.data?.data || []);
            setOrgLevels(levelsRes.data?.data || []);
            setEmployees(empRes.data?.data || []);
        } catch { /* silent */ }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setForm({ name: '', description: '', orgLevelId: '', parentId: '', managerId: '' });
        setEditingId(null);
        setShowDialog(false);
    };

    const openCreate = () => { resetForm(); setShowDialog(true); };

    const openEdit = (unit: any) => {
        setForm({
            name: unit.name,
            description: unit.description || '',
            orgLevelId: unit.orgLevelId || '',
            parentId: unit.parentId || '',
            managerId: unit.managerId || '',
        });
        setEditingId(unit.id);
        setShowDialog(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) return;
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                description: form.description || undefined,
                orgLevelId: form.orgLevelId || null,
                parentId: form.parentId || null,
                managerId: form.managerId || null,
            };
            if (editingId) {
                await api.put(`/departments/${editingId}`, payload);
                toast.success(t('updateSuccess'));
            } else {
                await api.post('/departments', payload);
                toast.success(t('createSuccess'));
            }
            resetForm();
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/departments/${deleteId}`);
            toast.success(t('deleteSuccess'));
            setDeleteId(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    // Possible parents: units with a lower or equal rank than the selected orgLevel
    const possibleParents = useMemo(() => {
        if (!form.orgLevelId) return [];
        const selectedLevel = orgLevels.find(l => l.id === form.orgLevelId);
        if (!selectedLevel) return [];
        // Parents must have a lower rank number (higher in hierarchy)
        return units.filter(u =>
            u.orgLevel && u.orgLevel.rank < selectedLevel.rank && u.id !== editingId
        );
    }, [form.orgLevelId, units, orgLevels, editingId]);

    // Build tree for display
    const tree = useMemo(() => {
        const rootUnits = units.filter(u => !u.parentId);
        const getChildren = (parentId: string): any[] => {
            return units
                .filter(u => u.parentId === parentId)
                .map(u => ({ ...u, children: getChildren(u.id) }));
        };
        return rootUnits.map(u => ({ ...u, children: getChildren(u.id) }));
    }, [units]);

    const levelColor = (rank: number) => {
        if (rank <= 1) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        if (rank <= 2) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (rank <= 3) return 'bg-cyan-100 text-cyan-700 border-cyan-200';
        if (rank <= 4) return 'bg-teal-100 text-teal-700 border-teal-200';
        return 'bg-slate-100 text-slate-600 border-slate-200';
    };

    function UnitCard({ unit, depth = 0 }: { unit: any; depth?: number }) {
        return (
            <div style={{ marginLeft: depth * 24 }}>
                <Card className="border-slate-200 hover:border-blue-200 hover:shadow-md transition-all group mb-2">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            {/* Level badge */}
                            {unit.orgLevel && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${levelColor(unit.orgLevel.rank)} shrink-0`}>
                                    {unit.orgLevel.name}
                                </span>
                            )}

                            {/* Name + description */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{unit.name}</h3>
                                {unit.description && <p className="text-xs text-slate-500 truncate">{unit.description}</p>}
                            </div>

                            {/* Manager */}
                            {unit.manager && (
                                <div className="hidden sm:flex items-center gap-2 shrink-0 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                                    {unit.manager.photo ? (
                                        <img src={unit.manager.photo} alt="" className="h-6 w-6 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                                            {unit.manager.firstName?.[0]}{unit.manager.lastName?.[0]}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-700">{unit.manager.firstName} {unit.manager.lastName}</p>
                                        <p className="text-[10px] text-slate-400">{t('manager')}</p>
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{unit._count?.employees || 0}</span>
                                {(unit._count?.children || 0) > 0 && (
                                    <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{unit._count.children}</span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button onClick={() => openEdit(unit)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setDeleteId(unit.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Parent info */}
                        {unit.parent && (
                            <p className="text-[10px] text-slate-400 mt-1.5 ml-0.5">
                                ↑ {unit.parent.name}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Children */}
                {unit.children?.map((child: any) => (
                    <UnitCard key={child.id} unit={child} depth={depth + 1} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-5 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-md">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Network className="h-6 w-6 text-blue-600" />
                        {t('title')}
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">{t('subtitle')}</p>
                </div>
                <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                    <Plus className="h-4 w-4" /> {t('addUnit')}
                </Button>
            </div>

            {/* Tree view */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : tree.length === 0 ? (
                <Card className="border-2 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Network className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-lg font-semibold text-slate-500">{t('noUnits')}</p>
                        <p className="text-sm text-slate-400 mt-1">{t('noUnitsDesc')}</p>
                        <Button onClick={openCreate} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                            <Plus className="h-4 w-4" /> {t('addUnit')}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div>
                    {tree.map(unit => (
                        <UnitCard key={unit.id} unit={unit} />
                    ))}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); }}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? t('editUnit') : t('addUnit')}</DialogTitle>
                        <DialogDescription>{t('subtitle')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>{t('name')} *</Label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('namePlaceholder')} required />
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('description')}</Label>
                            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={t('descriptionPlaceholder')} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>{t('level')} *</Label>
                                <select
                                    value={form.orgLevelId}
                                    onChange={e => setForm({ ...form, orgLevelId: e.target.value, parentId: '' })}
                                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none shadow-sm"
                                    required
                                >
                                    <option value="">{t('selectLevel')}</option>
                                    {orgLevels.map(level => (
                                        <option key={level.id} value={level.id}>{level.name} (Rang {level.rank})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label>{t('parent')}</Label>
                                <select
                                    value={form.parentId}
                                    onChange={e => setForm({ ...form, parentId: e.target.value })}
                                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none shadow-sm"
                                    disabled={!form.orgLevelId || possibleParents.length === 0}
                                >
                                    <option value="">{t('noParent')}</option>
                                    {possibleParents.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.orgLevel?.name ? `[${p.orgLevel.name}] ` : ''}{p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('manager')}</Label>
                            <select
                                value={form.managerId}
                                onChange={e => setForm({ ...form, managerId: e.target.value })}
                                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none shadow-sm"
                            >
                                <option value="">{t('noManager')}</option>
                                {employees.filter(e => e.status === 'ACTIVE').map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName} — {emp.position}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={resetForm}>{tc('cancel')}</Button>
                            <Button type="submit" disabled={saving || !form.name || !form.orgLevelId} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                {editingId ? tc('save') : tc('create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{tc('delete')}</DialogTitle>
                        <DialogDescription>{t('deleteConfirm')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>{tc('cancel')}</Button>
                        <Button variant="destructive" onClick={handleDelete}>{tc('delete')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
