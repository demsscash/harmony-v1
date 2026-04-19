'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PenTool, Plus, Loader2, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    AWAITING_ADMIN: 'bg-blue-100 text-blue-700',
    AWAITING_VALIDATION: 'bg-purple-100 text-purple-700',
    SIGNED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
};

export default function EmployeeSignaturesPage() {
    const t = useTranslations('signatures');
    const tc = useTranslations('common');
    const { user } = useAuthStore();

    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRequest, setShowRequest] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', documentType: 'ATTESTATION' });

    const fetchData = () => {
        api.get('/signatures', { params: { employeeId: user?.employeeId } })
            .then(res => setRequests(res.data?.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    };
    useEffect(() => { fetchData(); }, []);

    const handleRequestDoc = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title) return;
        setSaving(true);
        try {
            await api.post('/signatures/request-document', form);
            toast.success(t('requestSuccess'));
            setShowRequest(false);
            setForm({ title: '', description: '', documentType: 'ATTESTATION' });
            fetchData();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
        finally { setSaving(false); }
    };

    const pendingToSign = requests.filter(r => r.status === 'PENDING' && r.initiatedBy === 'ADMIN');
    const myRequests = requests.filter(r => r.initiatedBy === 'EMPLOYEE');
    const completed = requests.filter(r => r.status === 'SIGNED');

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><PenTool className="h-5 w-5 text-indigo-600" /> {t('title')}</h1>
                </div>
                <Button onClick={() => setShowRequest(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                    <Plus className="h-4 w-4" /> {t('requestDocument')}
                </Button>
            </div>

            {/* Pending to sign */}
            {pendingToSign.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" /> {t('pendingSignatures')} ({pendingToSign.length})
                    </h2>
                    <div className="space-y-2">
                        {pendingToSign.map(r => (
                            <Card key={r.id} className="border-amber-200 hover:shadow-md transition-all">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800">{r.title}</p>
                                        <p className="text-xs text-slate-500">{t(`docTypes.${r.documentType}`)} · {new Date(r.requestedAt).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                    <Link href={`/employee/signatures/${r.id}`}>
                                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5">
                                            <PenTool className="h-3.5 w-3.5" /> {t('sign')}
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* My document requests */}
            {myRequests.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Mes demandes de documents</h2>
                    <div className="space-y-2">
                        {myRequests.map(r => (
                            <Card key={r.id} className="hover:shadow-md transition-all">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800">{r.title}</p>
                                        <p className="text-xs text-slate-500">{t(`docTypes.${r.documentType}`)} · {new Date(r.requestedAt).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[r.status]}`}>{t(`statuses.${r.status}`)}</span>
                                        {r.status === 'SIGNED' && (
                                            <Link href={`/employee/signatures/${r.id}`}>
                                                <Button variant="outline" size="sm" className="gap-1"><FileText className="h-3.5 w-3.5" /> PDF</Button>
                                            </Link>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t('completedSignatures')} ({completed.length})
                    </h2>
                    <div className="space-y-2">
                        {completed.map(r => (
                            <Card key={r.id} className="border-emerald-100">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800">{r.title}</p>
                                        <p className="text-xs text-slate-500">{t(`docTypes.${r.documentType}`)} · {t('signedOn')} {new Date(r.employeeSignedAt || r.adminSignedAt || r.updatedAt).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                    <Link href={`/employee/signatures/${r.id}`}>
                                        <Button variant="outline" size="sm" className="gap-1"><FileText className="h-3.5 w-3.5" /> Voir</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {requests.length === 0 && (
                <div className="text-center py-16">
                    <PenTool className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-medium text-slate-500">{t('noRequests')}</p>
                </div>
            )}

            {/* Request Document Dialog */}
            <Dialog open={showRequest} onOpenChange={setShowRequest}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('requestDocTitle')}</DialogTitle>
                        <DialogDescription>{t('requestDocDesc')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRequestDoc} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>{t('docType')}</Label>
                            <select value={form.documentType} onChange={e => setForm({ ...form, documentType: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                                <option value="ATTESTATION">{t('docTypes.ATTESTATION')}</option>
                                <option value="CONTRACT">{t('docTypes.CONTRACT')}</option>
                                <option value="OTHER">{t('docTypes.OTHER')}</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('docTitle')} *</Label>
                            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Attestation de travail" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('description')}</Label>
                            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Précisions optionnelles..." />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowRequest(false)}>{tc('cancel')}</Button>
                            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                {tc('save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
