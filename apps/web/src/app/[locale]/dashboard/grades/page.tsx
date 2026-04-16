'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { DataTable, type Column } from '@/components/DataTable';
import {
    Banknote, Plus, Edit, Trash2, Loader2, Percent, Tag,
} from 'lucide-react';

const TYPE_LABEL: Record<string, string> = {
    PRIME: 'Prime',
    INDEMNITE: 'Indemnité',
    AVANTAGE_NATURE: 'Avantage en nature',
};

const TYPE_COLOR: Record<string, string> = {
    PRIME: 'bg-blue-50 text-blue-700 border-blue-200',
    INDEMNITE: 'bg-violet-50 text-violet-700 border-violet-200',
    AVANTAGE_NATURE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function PrimesPage() {
    const t = useTranslations('grades');
    const tc = useTranslations('common');

    const [primes, setPrimes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: '',
        type: 'PRIME',
        amount: '',
        isPercentage: false,
        isTaxable: true,
        description: '',
    });

    const fetchPrimes = async () => {
        try {
            const res = await api.get('/advantages');
            setPrimes(res.data?.data || []);
        } catch { /* silent */ }
        setLoading(false);
    };

    useEffect(() => { fetchPrimes(); }, []);

    const resetForm = () => {
        setForm({ name: '', type: 'PRIME', amount: '', isPercentage: false, isTaxable: true, description: '' });
        setEditingId(null);
        setShowDialog(false);
    };

    const openCreate = () => { resetForm(); setShowDialog(true); };

    const openEdit = (item: any) => {
        setForm({
            name: item.name,
            type: item.type,
            amount: String(Number(item.amount || 0)),
            isPercentage: item.isPercentage,
            isTaxable: item.isTaxable,
            description: item.description || '',
        });
        setEditingId(item.id);
        setShowDialog(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) return;
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                type: form.type,
                amount: form.amount ? parseFloat(form.amount) : null,
                isPercentage: form.isPercentage,
                isTaxable: form.isTaxable,
                description: form.description || undefined,
            };
            if (editingId) {
                await api.put(`/advantages/${editingId}`, payload);
                toast.success(t('updateSuccess'));
            } else {
                await api.post('/advantages', payload);
                toast.success(t('createSuccess'));
            }
            resetForm();
            fetchPrimes();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/advantages/${deleteId}`);
            toast.success(t('deleteSuccess'));
            setDeleteId(null);
            fetchPrimes();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'name',
            header: tc('name'),
            accessor: (row) => row.name,
            render: (row) => (
                <div>
                    <p className="font-semibold text-slate-800">{row.name}</p>
                    {row.description && <p className="text-xs text-slate-400 truncate max-w-[250px]">{row.description}</p>}
                </div>
            ),
        },
        {
            key: 'type',
            header: t('typeCol'),
            accessor: (row) => row.type,
            render: (row) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TYPE_COLOR[row.type] || ''}`}>
                    {TYPE_LABEL[row.type] || row.type}
                </span>
            ),
        },
        {
            key: 'amount',
            header: t('amountCol'),
            className: 'text-right',
            headerClassName: 'text-right',
            accessor: (row) => Number(row.amount || 0),
            render: (row) => (
                <span className="font-bold text-slate-800">
                    {row.isPercentage
                        ? `${Number(row.amount || 0)}%`
                        : `${Number(row.amount || 0).toLocaleString()} MRU`
                    }
                </span>
            ),
        },
        {
            key: 'taxable',
            header: t('taxableCol'),
            className: 'text-center',
            headerClassName: 'text-center',
            render: (row) => (
                <span className={`text-xs font-semibold ${row.isTaxable ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {row.isTaxable ? t('taxable') : t('nonTaxable')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: tc('actions'),
            className: 'text-right',
            headerClassName: 'text-right',
            render: (row) => (
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            ),
        },
    ];

    // KPIs
    const totalPrimes = primes.filter(p => p.type === 'PRIME').length;
    const totalIndemnites = primes.filter(p => p.type === 'INDEMNITE').length;
    const totalAvantages = primes.filter(p => p.type === 'AVANTAGE_NATURE').length;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-5 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-md">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Banknote className="h-6 w-6 text-blue-600" />
                        {t('primesTitle')}
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">{t('primesSubtitle')}</p>
                </div>
                <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                    <Plus className="h-4 w-4" /> {t('addPrime')}
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Card className="border-blue-200 bg-blue-50/40"><CardContent className="pt-4 pb-4">
                    <div className="text-2xl font-black text-blue-600">{totalPrimes}</div>
                    <div className="text-xs font-semibold text-slate-500">Primes</div>
                </CardContent></Card>
                <Card className="border-violet-200 bg-violet-50/40"><CardContent className="pt-4 pb-4">
                    <div className="text-2xl font-black text-violet-600">{totalIndemnites}</div>
                    <div className="text-xs font-semibold text-slate-500">Indemnités</div>
                </CardContent></Card>
                <Card className="border-emerald-200 bg-emerald-50/40"><CardContent className="pt-4 pb-4">
                    <div className="text-2xl font-black text-emerald-600">{totalAvantages}</div>
                    <div className="text-xs font-semibold text-slate-500">Avantages en nature</div>
                </CardContent></Card>
            </div>

            <DataTable
                data={primes}
                columns={columns}
                rowKey={(row) => row.id}
                loading={loading}
                rowClassName="group"
                searchPlaceholder={tc('search')}
                searchFields={[(row) => row.name, (row) => row.description || '']}
                emptyState={
                    <div className="flex flex-col items-center py-8">
                        <Banknote className="h-10 w-10 text-slate-300 mb-3" />
                        <p className="font-medium text-slate-500">{t('noPrimes')}</p>
                        <p className="text-xs text-slate-400 mt-1">{t('noPrimesDesc')}</p>
                    </div>
                }
            />

            {/* Create / Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); }}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? t('editPrime') : t('addPrime')}</DialogTitle>
                        <DialogDescription>{t('primesSubtitle')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>{tc('name')} *</Label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Prime de logement, Prime de transport..." required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>{t('typeCol')} *</Label>
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none shadow-sm">
                                    <option value="PRIME">Prime</option>
                                    <option value="INDEMNITE">Indemnité</option>
                                    <option value="AVANTAGE_NATURE">Avantage en nature</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>{t('amountCol')} {form.isPercentage ? '(%)' : '(MRU)'}</Label>
                                <Input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isPercentage} onChange={e => setForm({ ...form, isPercentage: e.target.checked })} className="rounded" />
                                <span className="text-sm text-slate-700 flex items-center gap-1"><Percent className="h-3.5 w-3.5" /> {t('isPercentage')}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isTaxable} onChange={e => setForm({ ...form, isTaxable: e.target.checked })} className="rounded" />
                                <span className="text-sm text-slate-700 flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {t('isTaxable')}</span>
                            </label>
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('descriptionLabel')}</Label>
                            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description optionnelle..." />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={resetForm}>{tc('cancel')}</Button>
                            <Button type="submit" disabled={saving || !form.name} className="bg-blue-600 hover:bg-blue-700 text-white">
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
                        <DialogDescription>{t('deletePrimeConfirm')}</DialogDescription>
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
