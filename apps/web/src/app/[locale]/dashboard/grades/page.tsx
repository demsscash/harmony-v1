'use client';

import * as React from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Award, Plus, Edit, Trash2, Loader2, RefreshCw, Users,
    CheckSquare, Square, Tag, Percent, TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function GradesPage() {
    const t = useTranslations('grades');
    const tc = useTranslations('common');
    const [grades, setGrades] = React.useState<any[]>([]);
    const [advantages, setAdvantages] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const [gradeModal, setGradeModal] = React.useState<'create' | 'edit' | null>(null);
    const [deleteGradeModal, setDeleteGradeModal] = React.useState(false);
    const [selectedGrade, setSelectedGrade] = React.useState<any>(null);
    const [gradeForm, setGradeForm] = React.useState({ name: '', level: '1', description: '' });
    const [selectedAdvIds, setSelectedAdvIds] = React.useState<Record<string, string | null>>({});

    const [advModal, setAdvModal] = React.useState<'create' | 'edit' | null>(null);
    const [deleteAdvModal, setDeleteAdvModal] = React.useState(false);
    const [selectedAdv, setSelectedAdv] = React.useState<any>(null);
    const [advForm, setAdvForm] = React.useState({ name: '', type: 'PRIME', amount: '', isPercentage: false, isTaxable: true, description: '' });

    const [saving, setSaving] = React.useState(false);

    const ADV_TYPE_LABEL: Record<string, string> = {
        PRIME: t('prime'),
        INDEMNITE: t('indemnite'),
        AVANTAGE_NATURE: t('avantageNature'),
    };

    const ADV_TYPE_COLOR: Record<string, string> = {
        PRIME: 'bg-blue-100 text-blue-700',
        INDEMNITE: 'bg-violet-100 text-violet-700',
        AVANTAGE_NATURE: 'bg-emerald-100 text-emerald-700',
    };

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const [gr, adv] = await Promise.all([
                api.get('/grades').catch(() => ({ data: { data: [] } })),
                api.get('/advantages').catch(() => ({ data: { data: [] } })),
            ]);
            setGrades(Array.isArray(gr.data?.data) ? gr.data.data : []);
            setAdvantages(Array.isArray(adv.data?.data) ? adv.data.data : []);
        } catch {
            toast.error(t('loadError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    React.useEffect(() => { fetchData(); }, [fetchData]);

    const openCreateGrade = () => {
        setGradeForm({ name: '', level: '1', description: '' });
        setSelectedAdvIds({});
        setGradeModal('create');
    };

    const openEditGrade = async (grade: any) => {
        setSelectedGrade(grade);
        setGradeForm({ name: grade.name, level: String(grade.level), description: grade.description || '' });
        try {
            const res = await api.get(`/grades/${grade.id}`);
            const detail = res.data?.data;
            const ids: Record<string, string | null> = {};
            (detail?.advantages || []).forEach((ga: any) => {
                ids[ga.advantageId] = ga.customAmount ? String(ga.customAmount) : null;
            });
            setSelectedAdvIds(ids);
        } catch {
            setSelectedAdvIds({});
        }
        setGradeModal('edit');
    };

    const toggleAdvantage = (advId: string) => {
        setSelectedAdvIds(prev => {
            if (advId in prev) {
                const next = { ...prev };
                delete next[advId];
                return next;
            }
            return { ...prev, [advId]: null };
        });
    };

    const buildAdvantagesPayload = () =>
        Object.entries(selectedAdvIds).map(([advantageId, customAmount]) => ({
            advantageId,
            customAmount: customAmount ? Number(customAmount) : undefined,
        }));

    const handleSaveGrade = async () => {
        if (!gradeForm.name) { toast.error(t('gradeNameRequired')); return; }
        setSaving(true);
        try {
            const payload = {
                name: gradeForm.name,
                level: Number(gradeForm.level),
                description: gradeForm.description || undefined,
                advantages: buildAdvantagesPayload(),
            };
            if (gradeModal === 'create') {
                await api.post('/grades', payload);
                toast.success(t('gradeCreated'));
            } else {
                await api.put(`/grades/${selectedGrade.id}`, payload);
                toast.success(t('gradeUpdated'));
            }
            setGradeModal(null);
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('saveError'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGrade = async () => {
        if (!selectedGrade) return;
        setSaving(true);
        try {
            await api.delete(`/grades/${selectedGrade.id}`);
            toast.success(t('gradeDeleted'));
            setDeleteGradeModal(false);
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('deleteError'));
        } finally {
            setSaving(false);
        }
    };

    const openCreateAdv = () => {
        setAdvForm({ name: '', type: 'PRIME', amount: '', isPercentage: false, isTaxable: true, description: '' });
        setAdvModal('create');
    };

    const openEditAdv = (adv: any) => {
        setSelectedAdv(adv);
        setAdvForm({
            name: adv.name,
            type: adv.type,
            amount: adv.amount ? String(adv.amount) : '',
            isPercentage: adv.isPercentage,
            isTaxable: adv.isTaxable,
            description: adv.description || '',
        });
        setAdvModal('edit');
    };

    const handleSaveAdv = async () => {
        if (!advForm.name) { toast.error(t('advNameRequired')); return; }
        setSaving(true);
        try {
            const payload = {
                name: advForm.name,
                type: advForm.type,
                amount: advForm.amount ? Number(advForm.amount) : null,
                isPercentage: advForm.isPercentage,
                isTaxable: advForm.isTaxable,
                description: advForm.description || undefined,
            };
            if (advModal === 'create') {
                await api.post('/advantages', payload);
                toast.success(t('advCreated'));
            } else {
                await api.put(`/advantages/${selectedAdv.id}`, payload);
                toast.success(t('advUpdated'));
            }
            setAdvModal(null);
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('saveError'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAdv = async () => {
        if (!selectedAdv) return;
        setSaving(true);
        try {
            await api.delete(`/advantages/${selectedAdv.id}`);
            toast.success(t('advDeleted'));
            setDeleteAdvModal(false);
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('deleteError'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10"><Award className="h-7 w-7 text-amber-600" /></div>
                    {t('title')}
                </h1>
                <p className="text-slate-500 mt-1">{t('subtitle')}</p>
            </motion.div>

            <Tabs defaultValue="grades">
                <TabsList className="bg-slate-100 border border-slate-200">
                    <TabsTrigger value="grades" className="data-[state=active]:bg-white">
                        <TrendingUp className="h-4 w-4 mr-2" /> {t('gradesTab', { count: grades.length })}
                    </TabsTrigger>
                    <TabsTrigger value="advantages" className="data-[state=active]:bg-white">
                        <Tag className="h-4 w-4 mr-2" /> {t('advantagesTab', { count: advantages.length })}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="grades" className="mt-4">
                    <div className="flex justify-end mb-4">
                        <Button onClick={openCreateGrade} className="bg-amber-600 hover:bg-amber-700 gap-2">
                            <Plus className="h-4 w-4" /> {t('newGrade')}
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
                    ) : grades.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                            <Award className="h-12 w-12 text-slate-200" />
                            <p className="font-medium">{t('noGrades')}</p>
                            <Button size="sm" variant="outline" onClick={openCreateGrade}>{t('createFirstGrade')}</Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {grades.sort((a, b) => a.level - b.level).map(grade => (
                                <Card key={grade.id} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                                        {t('level', { level: grade.level })}
                                                    </span>
                                                </div>
                                                <CardTitle className="text-base mt-2">{grade.name}</CardTitle>
                                                {grade.description && <CardDescription className="text-xs mt-1">{grade.description}</CardDescription>}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => openEditGrade(grade)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => { setSelectedGrade(grade); setDeleteGradeModal(true); }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5" />
                                                {t('employeeCount', { count: grade._count?.employees || 0 })}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="advantages" className="mt-4">
                    <div className="flex justify-end mb-4">
                        <Button onClick={openCreateAdv} className="bg-blue-600 hover:bg-blue-700 gap-2">
                            <Plus className="h-4 w-4" /> {t('newAdvantage')}
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
                    ) : advantages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                            <Tag className="h-12 w-12 text-slate-200" />
                            <p className="font-medium">{t('noAdvantages')}</p>
                            <Button size="sm" variant="outline" onClick={openCreateAdv}>{t('createFirstAdvantage')}</Button>
                        </div>
                    ) : (
                        <Card className="border-slate-200/60 shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="text-left px-5 py-3 font-semibold text-slate-500">{t('nameCol')}</th>
                                            <th className="text-left px-5 py-3 font-semibold text-slate-500">{t('typeCol')}</th>
                                            <th className="text-left px-5 py-3 font-semibold text-slate-500">{t('amountCol')}</th>
                                            <th className="text-left px-5 py-3 font-semibold text-slate-500">{t('taxableCol')}</th>
                                            <th className="text-right px-5 py-3 font-semibold text-slate-500">{t('actionsCol')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {advantages.map(adv => (
                                            <tr key={adv.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-slate-800">{adv.name}</p>
                                                    {adv.description && <p className="text-xs text-slate-400 mt-0.5">{adv.description}</p>}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${ADV_TYPE_COLOR[adv.type]}`}>
                                                        {ADV_TYPE_LABEL[adv.type] || adv.type}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 font-semibold text-slate-800">
                                                    {adv.amount ? (adv.isPercentage ? `${adv.amount}%` : `${Number(adv.amount).toLocaleString('fr-FR')} MRU`) : <span className="text-slate-400 italic text-xs">{t('variable')}</span>}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-xs font-semibold ${adv.isTaxable ? 'text-red-600' : 'text-emerald-600'}`}>
                                                        {adv.isTaxable ? t('yes') : t('no')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => openEditAdv(adv)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => { setSelectedAdv(adv); setDeleteAdvModal(true); }}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Grade Modal */}
            <Dialog open={gradeModal !== null} onOpenChange={v => !v && setGradeModal(null)}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{gradeModal === 'create' ? t('newGradeModal') : t('editGradeModal')}</DialogTitle>
                        <DialogDescription>{t('gradeModalDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                <Label>{t('gradeName')} <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder={t('gradeNamePlaceholder')}
                                    value={gradeForm.name}
                                    onChange={e => setGradeForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                <Label>{t('hierarchicalLevel')} <span className="text-red-500">*</span></Label>
                                <Input
                                    type="number" min="1"
                                    placeholder="1"
                                    value={gradeForm.level}
                                    onChange={e => setGradeForm(p => ({ ...p, level: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('description')}</Label>
                            <Textarea
                                placeholder="..."
                                rows={2}
                                className="resize-none"
                                value={gradeForm.description}
                                onChange={e => setGradeForm(p => ({ ...p, description: e.target.value }))}
                            />
                        </div>

                        {advantages.length > 0 && (
                            <div className="space-y-3">
                                <Label>{t('associatedAdvantages')}</Label>
                                <div className="border rounded-xl divide-y divide-slate-100 max-h-64 overflow-y-auto">
                                    {advantages.map(adv => {
                                        const checked = adv.id in selectedAdvIds;
                                        return (
                                            <div key={adv.id} className={`flex items-center gap-3 px-4 py-3 ${checked ? 'bg-blue-50/50' : 'hover:bg-slate-50'} transition-colors`}>
                                                <button type="button" onClick={() => toggleAdvantage(adv.id)} className="shrink-0">
                                                    {checked
                                                        ? <CheckSquare className="h-5 w-5 text-blue-600" />
                                                        : <Square className="h-5 w-5 text-slate-300" />
                                                    }
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800">{adv.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {ADV_TYPE_LABEL[adv.type]} · {adv.amount ? (adv.isPercentage ? `${adv.amount}%` : `${Number(adv.amount).toLocaleString()} MRU`) : t('variable')}
                                                    </p>
                                                </div>
                                                {checked && (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            placeholder={t('customAmount')}
                                                            className="w-32 h-8 text-xs"
                                                            value={selectedAdvIds[adv.id] ?? ''}
                                                            onChange={e => setSelectedAdvIds(prev => ({ ...prev, [adv.id]: e.target.value || null }))}
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                        <span className="text-xs text-slate-400">MRU</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-slate-400">{t('customAmountHint')}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGradeModal(null)}>{tc('cancel')}</Button>
                        <Button onClick={handleSaveGrade} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : gradeModal === 'create' ? tc('create') : tc('save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Advantage Modal */}
            <Dialog open={advModal !== null} onOpenChange={v => !v && setAdvModal(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{advModal === 'create' ? t('newAdvantageModal') : t('editAdvantageModal')}</DialogTitle>
                        <DialogDescription>{t('advantageModalDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>{t('nameCol')} <span className="text-red-500">*</span></Label>
                            <Input placeholder={t('advNamePlaceholder')} value={advForm.name} onChange={e => setAdvForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>{t('advType')}</Label>
                                <Select value={advForm.type} onValueChange={v => setAdvForm(p => ({ ...p, type: v || '' }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PRIME">{t('prime')}</SelectItem>
                                        <SelectItem value="INDEMNITE">{t('indemnite')}</SelectItem>
                                        <SelectItem value="AVANTAGE_NATURE">{t('avantageNature')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>{t('advAmount')}</Label>
                                <Input
                                    type="number" min="0"
                                    placeholder={advForm.isPercentage ? t('percentPlaceholder') : t('amountPlaceholder')}
                                    value={advForm.amount}
                                    onChange={e => setAdvForm(p => ({ ...p, amount: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{t('percentageMode')}</p>
                                <p className="text-xs text-slate-500">{t('percentageModeDesc')}</p>
                            </div>
                            <Switch checked={advForm.isPercentage} onCheckedChange={v => setAdvForm(p => ({ ...p, isPercentage: v }))} className="data-[state=checked]:bg-blue-600" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{t('taxableMode')}</p>
                                <p className="text-xs text-slate-500">{t('taxableModeDesc')}</p>
                            </div>
                            <Switch checked={advForm.isTaxable} onCheckedChange={v => setAdvForm(p => ({ ...p, isTaxable: v }))} className="data-[state=checked]:bg-red-500" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('description')}</Label>
                            <Textarea
                                placeholder="..."
                                rows={2}
                                className="resize-none"
                                value={advForm.description}
                                onChange={e => setAdvForm(p => ({ ...p, description: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdvModal(null)}>{tc('cancel')}</Button>
                        <Button onClick={handleSaveAdv} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : advModal === 'create' ? tc('create') : tc('save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Grade Modal */}
            <Dialog open={deleteGradeModal} onOpenChange={setDeleteGradeModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">{t('deleteGrade')}</DialogTitle>
                        <DialogDescription>
                            {t('deleteGradeConfirm', { name: selectedGrade?.name || '' })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteGradeModal(false)}>{tc('cancel')}</Button>
                        <Button onClick={handleDeleteGrade} disabled={saving} variant="destructive">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tc('delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Advantage Modal */}
            <Dialog open={deleteAdvModal} onOpenChange={setDeleteAdvModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">{t('deleteAdvantage')}</DialogTitle>
                        <DialogDescription>
                            {t('deleteAdvantageConfirm', { name: selectedAdv?.name || '' })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteAdvModal(false)}>{tc('cancel')}</Button>
                        <Button onClick={handleDeleteAdv} disabled={saving} variant="destructive">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tc('delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
