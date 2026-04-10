'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ClipboardCheck, Plus, Trash2, Play, Lock, Eye, Star, Users, ChevronDown, ChevronUp, X } from 'lucide-react';
import { TablePagination, paginate } from '@/components/TablePagination';
import api from '@/lib/api';

const STATUS_STYLES: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    CLOSED: 'bg-red-100 text-red-700',
};

const EVAL_STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
};

export default function EvaluationsPage() {
    const t = useTranslations('evaluations');
    const tc = useTranslations('common');

    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [showLaunchModal, setShowLaunchModal] = useState(false);
    const [showEvalModal, setShowEvalModal] = useState<any>(null);

    // Form
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formStart, setFormStart] = useState('');
    const [formEnd, setFormEnd] = useState('');
    const [formCriteria, setFormCriteria] = useState<{ name: string; weight: string; description: string }[]>([
        { name: '', weight: '25', description: '' },
    ]);
    const [saving, setSaving] = useState(false);

    // Launch modal
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

    // Eval modal
    const [evalScores, setEvalScores] = useState<Record<string, { score: string; comment: string }>>({});
    const [evalStrengths, setEvalStrengths] = useState('');
    const [evalImprovements, setEvalImprovements] = useState('');
    const [evalObjectives, setEvalObjectives] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 15;

    const fetchCampaigns = async () => {
        try {
            const res = await api.get('/evaluations/campaigns');
            setCampaigns(res.data?.data || []);
        } catch { /* silent */ }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data?.data || []);
        } catch { /* silent */ }
    };

    useEffect(() => {
        Promise.all([fetchCampaigns(), fetchEmployees()]).then(() => setLoading(false));
    }, []);

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitle || !formStart || !formEnd) return;
        const criteria = formCriteria.filter(c => c.name).map(c => ({
            name: c.name,
            weight: parseInt(c.weight) || 0,
            description: c.description || undefined,
        }));
        const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
        if (totalWeight !== 100) {
            toast.error(t('weightsError'));
            return;
        }
        setSaving(true);
        try {
            await api.post('/evaluations/campaigns', {
                title: formTitle,
                description: formDesc || undefined,
                startDate: formStart,
                endDate: formEnd,
                criteria,
            });
            toast.success(tc('save'));
            setShowForm(false);
            resetForm();
            fetchCampaigns();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormTitle('');
        setFormDesc('');
        setFormStart('');
        setFormEnd('');
        setFormCriteria([{ name: '', weight: '25', description: '' }]);
    };

    const addCriterion = () => setFormCriteria([...formCriteria, { name: '', weight: '0', description: '' }]);
    const removeCriterion = (idx: number) => setFormCriteria(formCriteria.filter((_, i) => i !== idx));
    const updateCriterion = (idx: number, field: string, value: string) => {
        const updated = [...formCriteria];
        (updated[idx] as any)[field] = value;
        setFormCriteria(updated);
    };

    const openCampaignDetail = async (campaign: any) => {
        setSelectedCampaign(campaign);
        setPage(1);
        try {
            const [evalRes, statsRes] = await Promise.all([
                api.get('/evaluations', { params: { campaignId: campaign.id } }),
                api.get(`/evaluations/campaigns/${campaign.id}/stats`),
            ]);
            setEvaluations(evalRes.data?.data || []);
            setStats(statsRes.data?.data || null);
        } catch { /* silent */ }
    };

    const handleLaunch = async () => {
        if (selectedEmployeeIds.length === 0) return;
        try {
            await api.post(`/evaluations/campaigns/${selectedCampaign.id}/launch`, { employeeIds: selectedEmployeeIds });
            toast.success(t('launched'));
            setShowLaunchModal(false);
            setSelectedEmployeeIds([]);
            openCampaignDetail(selectedCampaign);
            fetchCampaigns();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const handleClose = async (id: string) => {
        try {
            await api.post(`/evaluations/campaigns/${id}/close`);
            toast.success(t('closed'));
            fetchCampaigns();
            if (selectedCampaign?.id === id) {
                openCampaignDetail({ ...selectedCampaign, status: 'CLOSED' });
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(tc('confirm'))) return;
        try {
            await api.delete(`/evaluations/campaigns/${id}`);
            toast.success(tc('delete'));
            fetchCampaigns();
            if (selectedCampaign?.id === id) {
                setSelectedCampaign(null);
                setEvaluations([]);
                setStats(null);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const openEvalModal = (evaluation: any) => {
        setShowEvalModal(evaluation);
        const criteria = (evaluation.campaign?.criteria || []) as any[];
        const existingScores = (evaluation.scores || []) as any[];
        const scoreMap: Record<string, { score: string; comment: string }> = {};
        criteria.forEach((c: any) => {
            const existing = existingScores.find((s: any) => s.criterionName === c.name);
            scoreMap[c.name] = {
                score: existing ? String(existing.score) : '5',
                comment: existing?.comment || '',
            };
        });
        setEvalScores(scoreMap);
        setEvalStrengths(evaluation.strengths || '');
        setEvalImprovements(evaluation.improvements || '');
        setEvalObjectives(evaluation.objectives || '');
    };

    const handleSubmitEval = async () => {
        if (!showEvalModal) return;
        const scores = Object.entries(evalScores).map(([criterionName, data]) => ({
            criterionName,
            score: parseFloat(data.score) || 0,
            comment: data.comment || undefined,
        }));
        try {
            await api.put(`/evaluations/${showEvalModal.id}/submit`, {
                scores,
                strengths: evalStrengths || undefined,
                improvements: evalImprovements || undefined,
                objectives: evalObjectives || undefined,
            });
            toast.success(t('evalSubmitted'));
            setShowEvalModal(null);
            if (selectedCampaign) openCampaignDetail(selectedCampaign);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const toggleAllEmployees = () => {
        if (selectedEmployeeIds.length === employees.length) {
            setSelectedEmployeeIds([]);
        } else {
            setSelectedEmployeeIds(employees.map(e => e.id));
        }
    };

    const currentWeight = formCriteria.reduce((s, c) => s + (parseInt(c.weight) || 0), 0);

    if (loading) {
        return <div className="py-20 text-center text-sm text-slate-500">{tc('loading')}</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-5 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
                    <p className="text-slate-500 font-medium mt-1">{t('subtitle')}</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2">
                    <Plus className="h-4 w-4" />
                    {t('createCampaign')}
                </Button>
            </div>

            {/* Create Campaign Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('createCampaign')}</DialogTitle>
                        <DialogDescription>{t('subtitle')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateCampaign} className="space-y-4 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>{t('campaignTitle')}</Label>
                                <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder={t('campaignTitlePlaceholder')} required />
                            </div>
                            <div className="space-y-1.5">
                                <Label>{t('description')}</Label>
                                <Input value={formDesc} onChange={e => setFormDesc(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>{t('startDate')}</Label>
                                <Input type="date" value={formStart} onChange={e => setFormStart(e.target.value)} required />
                            </div>
                            <div className="space-y-1.5">
                                <Label>{t('endDate')}</Label>
                                <Input type="date" value={formEnd} onChange={e => setFormEnd(e.target.value)} required />
                            </div>
                        </div>

                        {/* Criteria */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="font-bold">{t('criteria')}</Label>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-medium ${currentWeight === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {t('totalWeight')}: {currentWeight}/100
                                    </span>
                                    <Button type="button" variant="outline" size="sm" onClick={addCriterion} className="gap-1.5">
                                        <Plus className="h-3.5 w-3.5" /> {t('addCriterion')}
                                    </Button>
                                </div>
                            </div>
                            {formCriteria.map((c, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input className="flex-1 h-9" placeholder={t('criterionName')} value={c.name} onChange={e => updateCriterion(idx, 'name', e.target.value)} />
                                    <Input className="w-20 h-9" type="number" min="0" max="100" placeholder="%" value={c.weight} onChange={e => updateCriterion(idx, 'weight', e.target.value)} />
                                    <Input className="flex-1 h-9" placeholder={t('criterionDesc')} value={c.description} onChange={e => updateCriterion(idx, 'description', e.target.value)} />
                                    {formCriteria.length > 1 && (
                                        <button type="button" onClick={() => removeCriterion(idx)} className="p-1 text-slate-400 hover:text-red-500" aria-label={tc('delete')}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{tc('cancel')}</Button>
                            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">{tc('save')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campaign List */}
                <div className="lg:col-span-1 space-y-3">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('campaigns')}</h2>
                    {campaigns.length === 0 ? (
                        <Card className="p-8 text-center">
                            <ClipboardCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">{t('noCampaigns')}</p>
                        </Card>
                    ) : campaigns.map(c => (
                        <Card
                            key={c.id}
                            className={`p-4 cursor-pointer transition-all hover:shadow-md ${selectedCampaign?.id === c.id ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}`}
                            onClick={() => openCampaignDetail(c)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 text-sm truncate">{c.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {new Date(c.startDate).toLocaleDateString('fr')} — {new Date(c.endDate).toLocaleDateString('fr')}
                                    </p>
                                </div>
                                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLES[c.status] || ''}`}>
                                    {t(c.status.toLowerCase())}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c._count?.evaluations || 0} {t('evaluations')}</span>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Campaign Detail */}
                <div className="lg:col-span-2">
                    {!selectedCampaign ? (
                        <Card className="p-12 text-center">
                            <Eye className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">{t('selectCampaign')}</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {/* Campaign Header */}
                            <Card className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">{selectedCampaign.title}</h2>
                                        {selectedCampaign.description && (
                                            <p className="text-sm text-slate-500 mt-1">{selectedCampaign.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedCampaign.status !== 'CLOSED' && (
                                            <Button size="sm" onClick={() => setShowLaunchModal(true)} className="gap-1.5">
                                                <Play className="h-3.5 w-3.5" /> {t('addEmployees')}
                                            </Button>
                                        )}
                                        {selectedCampaign.status === 'ACTIVE' && (
                                            <Button size="sm" variant="outline" onClick={() => handleClose(selectedCampaign.id)} className="gap-1.5">
                                                <Lock className="h-3.5 w-3.5" /> {t('close')}
                                            </Button>
                                        )}
                                        {selectedCampaign.status !== 'ACTIVE' && (
                                            <Button size="sm" variant="outline" onClick={() => handleDelete(selectedCampaign.id)} className="gap-1.5 text-red-600 hover:text-red-700">
                                                <Trash2 className="h-3.5 w-3.5" /> {tc('delete')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            {/* Stats */}
                            {stats && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <Card className="p-4 text-center border border-slate-200 bg-slate-50 shadow-sm">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">{t('total')}</p>
                                        <p className="text-xl font-bold text-slate-900 mt-1">{stats.total}</p>
                                    </Card>
                                    <Card className="p-4 text-center border border-emerald-200 bg-emerald-50 shadow-sm">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">{t('completed')}</p>
                                        <p className="text-xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
                                    </Card>
                                    <Card className="p-4 text-center border border-amber-200 bg-amber-50 shadow-sm">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">{t('pending')}</p>
                                        <p className="text-xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                                    </Card>
                                    <Card className="p-4 text-center border border-blue-200 bg-blue-50 shadow-sm">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">{t('avgScore')}</p>
                                        <p className="text-xl font-bold text-blue-600 mt-1">{stats.avgScore}/10</p>
                                    </Card>
                                </div>
                            )}

                            {/* Evaluations List */}
                            <Card>
                                <CardContent className="p-0">
                                    {evaluations.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-slate-500">{t('noEvaluations')}</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <caption className="sr-only">{t('evaluations')}</caption>
                                                <thead className="bg-slate-50 border-b">
                                                    <tr className="text-left text-slate-500">
                                                        <th scope="col" className="px-4 py-3 font-semibold">{t('employee')}</th>
                                                        <th scope="col" className="px-4 py-3 font-semibold">{t('evaluator')}</th>
                                                        <th scope="col" className="px-4 py-3 font-semibold text-center">{t('score')}</th>
                                                        <th scope="col" className="px-4 py-3 font-semibold text-center">{tc('status')}</th>
                                                        <th scope="col" className="px-4 py-3 font-semibold text-center">{tc('actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {paginate(evaluations, page, PAGE_SIZE).map(ev => (
                                                        <tr key={ev.id} className="hover:bg-slate-50/50">
                                                            <td className="px-4 py-3">
                                                                <p className="font-medium">{ev.employee?.firstName} {ev.employee?.lastName}</p>
                                                                <p className="text-xs text-slate-400">{ev.employee?.position} {ev.employee?.department?.name ? `• ${ev.employee.department.name}` : ''}</p>
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600">
                                                                {ev.evaluator ? `${ev.evaluator.firstName} ${ev.evaluator.lastName}` : '—'}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {ev.overallScore != null ? (
                                                                    <span className="inline-flex items-center gap-1 font-semibold">
                                                                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                                                        {Number(ev.overallScore).toFixed(1)}
                                                                    </span>
                                                                ) : '—'}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${EVAL_STATUS_STYLES[ev.status] || ''}`}>
                                                                    {t(ev.status === 'IN_PROGRESS' ? 'inProgress' : ev.status.toLowerCase())}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {ev.status !== 'COMPLETED' && selectedCampaign.status !== 'CLOSED' ? (
                                                                    <Button size="sm" variant="outline" onClick={() => openEvalModal(ev)} className="gap-1.5 text-xs">
                                                                        <Star className="h-3 w-3" /> {t('evaluate')}
                                                                    </Button>
                                                                ) : ev.status === 'COMPLETED' ? (
                                                                    <Button size="sm" variant="ghost" onClick={() => openEvalModal(ev)} className="gap-1.5 text-xs">
                                                                        <Eye className="h-3 w-3" /> {t('view')}
                                                                    </Button>
                                                                ) : null}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    <TablePagination page={page} totalItems={evaluations.length} pageSize={PAGE_SIZE} onPageChange={setPage} texts={{ showing: tc('showing'), of: tc('of'), rows: tc('rows') }} />
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Launch Modal — Select employees */}
            {showLaunchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <Card className="w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{t('addEmployees')}</CardTitle>
                                <button onClick={() => setShowLaunchModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 overflow-y-auto">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-slate-500">{selectedEmployeeIds.length} {t('selected')}</span>
                                <Button variant="outline" size="sm" onClick={toggleAllEmployees}>
                                    {selectedEmployeeIds.length === employees.length ? t('deselectAll') : t('selectAll')}
                                </Button>
                            </div>
                            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                                {employees.filter(e => e.status === 'ACTIVE').map(emp => (
                                    <label key={emp.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedEmployeeIds.includes(emp.id)}
                                            onChange={() => {
                                                setSelectedEmployeeIds(prev =>
                                                    prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id]
                                                );
                                            }}
                                            className="rounded border-slate-300"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">{emp.firstName} {emp.lastName}</p>
                                            <p className="text-xs text-slate-400">{emp.position} {emp.department?.name ? `• ${emp.department.name}` : ''}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </CardContent>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowLaunchModal(false)}>{tc('cancel')}</Button>
                            <Button onClick={handleLaunch} disabled={selectedEmployeeIds.length === 0}>{t('launch')}</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Evaluation Modal — Score form */}
            {showEvalModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <Card className="w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">
                                        {showEvalModal.employee?.firstName} {showEvalModal.employee?.lastName}
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 mt-0.5">{showEvalModal.employee?.position}</p>
                                </div>
                                <button onClick={() => setShowEvalModal(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 overflow-y-auto space-y-5">
                            {/* Criteria scores */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-700">{t('criteria')}</h3>
                                {((showEvalModal.campaign?.criteria || []) as any[]).map((c: any) => (
                                    <div key={c.name} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm">{c.name} <span className="text-slate-400 text-xs">({c.weight}%)</span></Label>
                                            <span className="text-sm font-bold text-blue-600">{evalScores[c.name]?.score || 0}/10</span>
                                        </div>
                                        {c.description && <p className="text-xs text-slate-400">{c.description}</p>}
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="0.5"
                                            value={evalScores[c.name]?.score || '5'}
                                            onChange={e => setEvalScores(prev => ({ ...prev, [c.name]: { ...prev[c.name], score: e.target.value } }))}
                                            className="w-full accent-blue-600"
                                            disabled={showEvalModal.status === 'COMPLETED'}
                                        />
                                        <Input
                                            placeholder={t('comment')}
                                            value={evalScores[c.name]?.comment || ''}
                                            onChange={e => setEvalScores(prev => ({ ...prev, [c.name]: { ...prev[c.name], comment: e.target.value } }))}
                                            className="h-8 text-xs"
                                            disabled={showEvalModal.status === 'COMPLETED'}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Text fields */}
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label>{t('strengths')}</Label>
                                    <textarea
                                        value={evalStrengths}
                                        onChange={e => setEvalStrengths(e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                                        disabled={showEvalModal.status === 'COMPLETED'}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{t('improvements')}</Label>
                                    <textarea
                                        value={evalImprovements}
                                        onChange={e => setEvalImprovements(e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                                        disabled={showEvalModal.status === 'COMPLETED'}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{t('objectives')}</Label>
                                    <textarea
                                        value={evalObjectives}
                                        onChange={e => setEvalObjectives(e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                                        disabled={showEvalModal.status === 'COMPLETED'}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowEvalModal(null)}>{tc('close')}</Button>
                            {showEvalModal.status !== 'COMPLETED' && (
                                <Button onClick={handleSubmitEval} className="gap-1.5">
                                    <Star className="h-3.5 w-3.5" /> {t('submitEval')}
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
