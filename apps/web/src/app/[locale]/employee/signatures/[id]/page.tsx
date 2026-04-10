'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    PenTool, Loader2, CheckCircle2, Clock, XCircle, AlertTriangle,
    Eraser, Send, ArrowLeft, User, FileText, Calendar, Download, Eye
} from 'lucide-react';
import Cookies from 'js-cookie';
import Link from 'next/link';

interface SignatureRequest {
    id: string;
    title: string;
    description?: string;
    documentType: string;
    status: 'PENDING' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
    createdAt: string;
    signedAt?: string;
    expiresAt?: string;
    signatureData?: string;
    employee?: { id: string; firstName: string; lastName: string };
    requestedBy?: { email: string };
}

const STATUS_CONFIG = {
    PENDING: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    SIGNED: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    EXPIRED: { color: 'bg-red-100 text-red-600 border-red-200', icon: AlertTriangle },
    CANCELLED: { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle },
};

export default function EmployeeSignatureDetailPage() {
    const t = useTranslations('signatures');
    const tc = useTranslations('common');
    const params = useParams();
    const id = params.id as string;

    const [request, setRequest] = useState<SignatureRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [showPdfPreview, setShowPdfPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    const fetchRequest = useCallback(async () => {
        try {
            const res = await api.get(`/signatures/${id}`);
            if (res.data.success) setRequest(res.data.data);
        } catch {
            toast.error(t('errorLoading'));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchRequest(); }, [fetchRequest]);

    // PDF URL builder
    const getPdfUrl = useCallback((endpoint: string) => {
        const token = Cookies.get('accessToken');
        const subdomain = useAuthStore.getState().user?.tenantSubdomain || 'demo';
        return `${API_BASE_URL}/signatures/${id}/${endpoint}?token=${token}&tenant=${subdomain}`;
    }, [id]);

    const handlePreviewPdf = () => {
        setPdfUrl(getPdfUrl('pdf'));
        setShowPdfPreview(true);
    };

    const handleDownloadSignedPdf = () => {
        window.open(getPdfUrl('signed-pdf'), '_blank');
    };

    // Canvas setup
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
    }, [request]);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) e.preventDefault();
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        if ('touches' in e) e.preventDefault();
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setHasDrawn(true);
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height);
        setHasDrawn(false);
    };

    const handleSign = async () => {
        if (!hasDrawn) { toast.error(t('signatureRequired')); return; }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const signatureData = canvas.toDataURL('image/png');
        setSigning(true);
        try {
            await api.post(`/signatures/${id}/sign`, { signatureData });
            toast.success(t('signatureSuccess'));
            setShowPdfPreview(false);
            fetchRequest();
        } catch (err: any) {
            toast.error(err.response?.data?.error || tc('error'));
        } finally {
            setSigning(false);
        }
    };

    const docTypeLabel = (type: string) => {
        const map: Record<string, string> = { CONTRACT: t('contract'), ATTESTATION: t('attestation'), PAYSLIP: t('payslip'), OTHER: t('other') };
        return map[type] || type;
    };

    const statusLabel = (status: string) => {
        const map: Record<string, string> = { PENDING: t('pending'), SIGNED: t('signed'), EXPIRED: t('expired'), CANCELLED: t('cancelled') };
        return map[status] || status;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-slate-500">{t('loading')}</span>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-4">
                <PenTool className="h-12 w-12 text-slate-200" />
                <p className="font-medium">{t('errorLoading')}</p>
                <Link href="/employee/signatures">
                    <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> {tc('back')}</Button>
                </Link>
            </div>
        );
    }

    const cfg = STATUS_CONFIG[request.status];
    const StatusIcon = cfg.icon;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Back + title */}
            <div className="flex items-center gap-3">
                <Link href="/employee/signatures">
                    <Button variant="outline" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" /> {tc('back')}</Button>
                </Link>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <PenTool className="h-5 w-5 text-blue-600" /> {t('detail')}
                </h1>
            </div>

            {/* Document info */}
            <Card className="border-slate-200/60 shadow-sm bg-white/90">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-lg">{request.title}</CardTitle>
                            {request.description && <p className="text-sm text-slate-500 mt-1">{request.description}</p>}
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.color}`}>
                            <StatusIcon className="h-3.5 w-3.5" /> {statusLabel(request.status)}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center"><FileText className="h-4 w-4 text-slate-500" /></div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase">{t('documentType')}</p>
                                <p className="text-sm font-medium text-slate-800">{docTypeLabel(request.documentType)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center"><Calendar className="h-4 w-4 text-slate-500" /></div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase">{t('requestedDate')}</p>
                                <p className="text-sm font-medium text-slate-800">
                                    {new Date(request.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-slate-500" /></div>
                            <div>
                                {request.signedAt ? (
                                    <>
                                        <p className="text-xs font-semibold text-slate-400 uppercase">{t('signedDate')}</p>
                                        <p className="text-sm font-medium text-emerald-700">
                                            {new Date(request.signedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs font-semibold text-slate-400 uppercase">{t('expiresAt')}</p>
                                        <p className="text-sm text-slate-400">
                                            {request.expiresAt ? new Date(request.expiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '\u2014'}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Document actions */}
                    <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={handlePreviewPdf} className="gap-2">
                            <Eye className="h-4 w-4" /> {t('viewDocument')}
                        </Button>
                        {request.status === 'SIGNED' && (
                            <Button onClick={handleDownloadSignedPdf} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                                <Download className="h-4 w-4" /> {t('downloadSignedPdf')}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* PDF Preview */}
            {showPdfPreview && pdfUrl && (
                <Card className="border-slate-200/60 shadow-sm">
                    <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" /> {t('documentPreview')}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setShowPdfPreview(false)}>
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <iframe src={pdfUrl} className="w-full border-0 rounded-b-lg" style={{ height: '600px' }} title={t('pdfDocument')} />
                    </CardContent>
                </Card>
            )}

            {/* Signature pad — PENDING only */}
            {request.status === 'PENDING' && (
                <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
                    <CardHeader className="border-b border-blue-100 pb-3">
                        <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                            <PenTool className="h-4 w-4" /> {t('signDocument')}
                        </CardTitle>
                        <p className="text-sm text-blue-600 mt-0.5">{t('drawSignature')}</p>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="bg-white rounded-xl border-2 border-dashed border-blue-200 overflow-hidden">
                            <canvas
                                ref={canvasRef}
                                className="w-full cursor-crosshair touch-none"
                                style={{ height: '200px' }}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Button type="button" variant="outline" onClick={clearCanvas} className="gap-2 border-slate-200">
                                <Eraser className="h-4 w-4" /> {t('clearSignature')}
                            </Button>
                            <Button onClick={handleSign} disabled={signing || !hasDrawn} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                                {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                {t('signDocument')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Signed preview */}
            {request.status === 'SIGNED' && request.signatureData && (
                <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
                    <CardHeader className="border-b border-emerald-100 pb-3">
                        <CardTitle className="text-base text-emerald-800 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> {t('signaturePreview')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="bg-white rounded-xl border border-emerald-200 p-4 flex items-center justify-center">
                            <img src={request.signatureData} alt="Signature" className="max-h-40 object-contain" />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
