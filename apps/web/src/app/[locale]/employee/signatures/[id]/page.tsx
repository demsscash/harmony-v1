'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import api, { API_BASE_URL } from '@/lib/api';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, PenTool, CheckCircle2, Loader2, Download, XCircle } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    AWAITING_ADMIN: 'bg-blue-100 text-blue-700',
    AWAITING_VALIDATION: 'bg-purple-100 text-purple-700',
    SIGNED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
};

export default function EmployeeSignatureDetailPage() {
    const t = useTranslations('signatures');
    const params = useParams();
    const { user } = useAuthStore();
    const id = params?.id as string;

    const [req, setReq] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const fetchRequest = () => {
        api.get(`/signatures/${id}`).then(res => setReq(res.data?.data)).catch(() => toast.error('Erreur')).finally(() => setLoading(false));
    };
    useEffect(() => { fetchRequest(); }, [id]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
    }, [req]);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const touch = 'touches' in e ? e.touches[0] : e;
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        setIsDrawing(true);
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const stopDraw = () => setIsDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleSign = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const signatureData = canvas.toDataURL('image/png');
        setSigning(true);
        try {
            await api.post(`/signatures/${id}/employee-sign`, { signatureData });
            toast.success(t('signSuccess'));
            fetchRequest();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
        finally { setSigning(false); }
    };

    const pdfUrl = `${API_BASE_URL}/signatures/${id}/pdf?tenant=${user?.tenantSubdomain || 'demo'}&token=${Cookies.get('accessToken') || ''}`;
    const signedPdfUrl = `${API_BASE_URL}/signatures/${id}/signed-pdf?tenant=${user?.tenantSubdomain || 'demo'}&token=${Cookies.get('accessToken') || ''}`;

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
    if (!req) return <p className="text-center py-12 text-slate-500">Demande introuvable</p>;

    const canSign = req.status === 'PENDING' && req.initiatedBy === 'ADMIN';
    const isSigned = req.status === 'SIGNED';
    const isRejected = req.status === 'REJECTED';

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/employee/signatures"><Button variant="outline" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-slate-900">{req.title}</h1>
                    <p className="text-sm text-slate-500">{t(`docTypes.${req.documentType}`)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[req.status]}`}>{t(`statuses.${req.status}`)}</span>
            </div>

            {/* Info */}
            <Card>
                <CardContent className="p-4 text-sm space-y-1">
                    {req.description && <p className="text-slate-600">{req.description}</p>}
                    <p className="text-xs text-slate-400">{t('requestedOn')} {new Date(req.requestedAt).toLocaleDateString('fr-FR')}</p>
                    {req.expiresAt && <p className="text-xs text-slate-400">{t('expiresAt')}: {new Date(req.expiresAt).toLocaleDateString('fr-FR')}</p>}
                </CardContent>
            </Card>

            {/* PDF Preview */}
            {req.pdfData && (
                <Card>
                    <CardContent className="p-4">
                        <Button variant="outline" onClick={() => window.open(pdfUrl, '_blank')} className="gap-1.5">
                            <FileText className="h-4 w-4" /> {t('viewPdf')}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Sign canvas */}
            {canSign && (
                <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><PenTool className="h-4 w-4" /> {t('drawSignature')}</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-crosshair bg-white touch-none"
                            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                        />
                        <div className="flex justify-between">
                            <Button variant="ghost" size="sm" onClick={clearCanvas}>{t('clearSignature')}</Button>
                            <Button onClick={handleSign} disabled={signing} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                                {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenTool className="h-4 w-4" />}
                                {t('confirmSign')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Signed */}
            {isSigned && (
                <Card className="border-emerald-200 bg-emerald-50">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            <div>
                                <p className="font-bold text-emerald-800">Document signé</p>
                                <p className="text-sm text-emerald-600">{t('signedOn')} {new Date(req.employeeSignedAt || req.adminSignedAt || req.updatedAt).toLocaleDateString('fr-FR')}</p>
                            </div>
                        </div>
                        {req.pdfData && (
                            <Button onClick={() => window.open(signedPdfUrl, '_blank')} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                                <Download className="h-4 w-4" /> {t('downloadSigned')}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Rejected */}
            {isRejected && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-5 flex items-center gap-3">
                        <XCircle className="h-6 w-6 text-red-600" />
                        <div>
                            <p className="font-bold text-red-800">Demande rejetée</p>
                            {req.rejectionReason && <p className="text-sm text-red-600">{req.rejectionReason}</p>}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Awaiting admin */}
            {req.status === 'AWAITING_ADMIN' && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-5 flex items-center gap-3">
                        <PenTool className="h-6 w-6 text-blue-600" />
                        <p className="text-sm text-blue-700">Votre signature a été enregistrée. En attente de la signature de l'employeur.</p>
                    </CardContent>
                </Card>
            )}

            {req.status === 'AWAITING_VALIDATION' && (
                <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-5 flex items-center gap-3">
                        <PenTool className="h-6 w-6 text-purple-600" />
                        <p className="text-sm text-purple-700">Votre demande a été envoyée. En attente de validation par l'administration.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
