'use client';

import * as React from 'react';
import api, { API_BASE_URL } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, FileText, Download, Plus, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function MyAttestationsPage() {
    const { user } = useAuthStore();
    const t = useTranslations('employeePortal');
    const tc = useTranslations('common');
    const [documents, setDocuments] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showModal, setShowModal] = React.useState(false);
    const [reason, setReason] = React.useState('');
    const [generating, setGenerating] = React.useState(false);

    const fetchDocs = React.useCallback(async () => {
        if (!user?.employeeId) { setLoading(false); return; }
        try {
            const res = await api.get(`/employees/${user.employeeId}`);
            const emp = res.data?.data;
            const docs = Array.isArray(emp?.documents) ? emp.documents : [];
            setDocuments(docs.filter((d: any) => d.type === 'ATTESTATION'));
        } catch {
            toast.error(t('errorLoadingAttestations'));
        } finally {
            setLoading(false);
        }
    }, [user?.employeeId, t]);

    React.useEffect(() => { fetchDocs(); }, [fetchDocs]);

    const handleGenerate = async () => {
        if (!user?.employeeId) return;
        setGenerating(true);
        try {
            const base = API_BASE_URL;
            const tenantSubdomain = user.tenantSubdomain || window.location.hostname.split('.')[0];
            const token = useAuthStore.getState().token;
            window.open(`${base}/employees/${user.employeeId}/attestation?tenant=${tenantSubdomain}&token=${token}`, '_blank');
            toast.success(t('attestationSuccess'));
            setShowModal(false);
            setReason('');
            setTimeout(fetchDocs, 1500);
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('attestationError'));
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = (doc: any) => {
        const base = API_BASE_URL;
        const tenantSubdomain = user?.tenantSubdomain || window.location.hostname.split('.')[0];
        const token = useAuthStore.getState().token;
        if (doc.url) {
            window.open(doc.url, '_blank');
        } else if (user?.employeeId) {
            window.open(`${base}/employees/${user.employeeId}/attestation?tenant=${tenantSubdomain}&token=${token}`, '_blank');
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-600/10"><FileText className="h-7 w-7 text-violet-600" /></div>
                        {t('myAttestations')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('myAttestationsSubtitle')}</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="bg-violet-600 hover:bg-violet-700 gap-2 shrink-0">
                    <Plus className="h-4 w-4" />{` `}{t('newAttestation')}
                </Button>
            </motion.div>

            {/* Info card */}
            <Card className="bg-violet-50 border-violet-200">
                <CardContent className="p-5 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-violet-900 text-sm">{t('autoAttestation')}</p>
                        <p className="text-xs text-violet-700 mt-0.5">
                            {t('autoAttestationDesc')}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Liste des attestations */}
            <Card className="border-slate-200/60 shadow-sm bg-white/90">
                <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-base">{t('generatedAttestations')}</CardTitle>
                    <CardDescription>{t('attestationHistory')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                            <FileText className="h-12 w-12 text-slate-200" />
                            <div className="text-center">
                                <p className="font-medium">{t('noAttestation')}</p>
                                <p className="text-xs mt-1">{t('noAttestationDesc')}</p>
                            </div>
                            <Button
                                size="sm" variant="outline"
                                className="border-violet-200 text-violet-700 hover:bg-violet-50 mt-2"
                                onClick={() => setShowModal(true)}
                            >
                                <Plus className="h-4 w-4 mr-1" />{` `}{t('generateNow')}
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {documents.map((doc, idx) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                                            <FileText className="h-5 w-5 text-violet-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{doc.name || 'Attestation de travail'}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Clock className="h-3 w-3 text-slate-400" />
                                                <span className="text-xs text-slate-500">
                                                    {doc.generatedAt
                                                        ? new Date(doc.generatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                                                        : new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm" variant="outline"
                                        className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
                                        onClick={() => handleDownload(doc)}
                                    >
                                        <Download className="h-3.5 w-3.5" /> PDF
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal génération */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('requestAttestation')}</DialogTitle>
                        <DialogDescription>
                            {t('attestationAutoDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 space-y-1 border border-slate-100">
                            <p><strong>{t('document')} :</strong> {t('workAttestation')}</p>
                            <p><strong>{t('format')} :</strong> {t('signedPdf')}</p>
                            <p><strong>{t('availability')} :</strong> {t('immediate')}</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm">{t('reasonOptional')}</Label>
                            <Textarea
                                placeholder={t('reasonAttPlaceholder')}
                                rows={3}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>{tc('cancel')}</Button>
                        <Button onClick={handleGenerate} disabled={generating} className="bg-violet-600 hover:bg-violet-700">
                            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                            {t('generateAndDownload')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
