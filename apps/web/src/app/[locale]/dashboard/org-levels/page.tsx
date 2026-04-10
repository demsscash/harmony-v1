'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { Network, Plus, Edit, Trash2, Loader2, Users, ChevronRight, ArrowUpDown } from 'lucide-react';
import api from '@/lib/api';

export default function OrgLevelsPage() {
    const t = useTranslations('orgLevels');
    const tc = useTranslations('common');

    const [levels, setLevels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', rank: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchLevels = async () => {
        try {
            const res = await api.get('/org-levels');
            setLevels(res.data?.data || []);
        } catch { /* silent */ }
        setLoading(false);
    };

    useEffect(() => { fetchLevels(); }, []);

    const resetForm = () => { setForm({ name: '', rank: '', description: '' }); setEditingId(null); setShowDialog(false); };

    const openCreate = () => {
        const nextRank = levels.length > 0 ? Math.max(...levels.map(l => l.rank)) + 1 : 1;
        setForm({ name: '', rank: String(nextRank), description: '' });
        setEditingId(null);
        setShowDialog(true);
    };

    const openEdit = (level: any) => {
        setForm({ name: level.name, rank: String(level.rank), description: level.description || '' });
        setEditingId(level.id);
        setShowDialog(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

    // Group by rank
    const groupedByRank = React.useMemo(() => {
        const map = new Map<number, any[]>();
        for (const l of levels) {
            if (!map.has(l.rank)) map.set(l.rank, []);
            map.get(l.rank)!.push(l);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a - b);
    }, [levels]);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-5 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-md">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Network className="h-6 w-6 text-indigo-600" />
                        {t('title')}
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">{t('subtitle')}</p>
                </div>
                <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                    <Plus className="h-4 w-4" /> {t('addLevel')}
                </Button>
            </div>

            {/* Visual hierarchy */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
            ) : levels.length === 0 ? (
                <Card className="border-2 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Network className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-lg font-semibold text-slate-500">{t('noLevels')}</p>
                        <p className="text-sm text-slate-400 mt-1 text-center max-w-md">{t('noLevelsDesc')}</p>
                        <p className="text-xs text-slate-400 mt-3 italic">{t('examples')}</p>
                        <Button onClick={openCreate} className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                            <Plus className="h-4 w-4" /> {t('addLevel')}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {groupedByRank.map(([rank, rankLevels], groupIdx) => (
                        <React.Fragment key={rank}>
                            {groupIdx > 0 && (
                                <div className="flex justify-center">
                                    <div className="w-0.5 h-6 bg-slate-200" />
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-1">
                                <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                                    {rank}
                                </div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rang {rank}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {rankLevels.map((level: any) => (
                                    <Card key={level.id} className="border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all group">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{level.name}</h3>
                                                    {level.description && (
                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{level.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-1.5 mt-2">
                                                        <Users className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="text-xs text-slate-500">{t('employeeCount', { count: level._count?.employees || 0 })}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                                                    <button onClick={() => openEdit(level)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button onClick={() => setDeleteId(level.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? t('editLevel') : t('addLevel')}</DialogTitle>
                        <DialogDescription>{t('subtitle')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>{t('name')} *</Label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('namePlaceholder')} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('rank')} *</Label>
                            <Input type="number" min="1" value={form.rank} onChange={e => setForm({ ...form, rank: e.target.value })} required />
                            <p className="text-xs text-slate-400">{t('rankHint')}</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('description')}</Label>
                            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={t('descriptionPlaceholder')} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={resetForm}>{tc('cancel')}</Button>
                            <Button type="submit" disabled={saving || !form.name || !form.rank} className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
