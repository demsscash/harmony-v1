'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import api, { API_BASE_URL } from '@/lib/api';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, FileText, PenTool, CheckCircle2, XCircle, Loader2, Download, Trash2 } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    AWAITING_ADMIN: 'bg-blue-100 text-blue-700',
    AWAITING_VALIDATION: 'bg-purple-100 text-purple-700',
    SIGNED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
};

export default function SignatureDetailPage() {
    const t = useTranslations('signatures');
    const tc = useTranslations('common');
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const id = params?.id as string;

    const [req, setReq] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [signing, setSigning] = useState(false);

    // Canvas refs
    const employeeCanvasRef = useRef<HTMLCanvasElement>(null);
    const adminCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const fetchRequest = () => {
        api.get(`/signatures/${id}`).then(res => setReq(res.data?.data)).catch(() => toast.error('Erreur')).finally(() => setLoading(false));
    };
    useEffect(() => { fetchRequest(); }, [id]);

    // Canvas setup
    const setupCanvas = (canvas: HTMLCanvasElement | null) => {
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
        ctx.lineJoin = 'round';
    };

    useEffect(() => {
        setupCanvas(employeeCanvasRef.current);
        setupCanvas(adminCanvasRef.current);
    }, [req]);

    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const touch = 'touches' in e ? e.touches[0] : e;
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        setIsDrawing(true);
        const pos = getPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        if (!isDrawing) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e, canvas);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const stopDraw = () => setIsDrawing(false);

    const clearCanvas = (canvas: HTMLCanvasElement | null) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const getCanvasData = (canvas: HTMLCanvasElement | null) => {
        if (!canvas) return null;
        return canvas.toDataURL('image/png');
    };

    // Admin sign (DUAL — both at once)
    const handleAdminSignBoth = async () => {
        const empSig = getCanvasData(employeeCanvasRef.current);
        const admSig = getCanvasData(adminCanvasRef.current);
        if (!admSig) { toast.error('Signature admin requise'); return; }
        setSigning(true);
        try {
            await api.post(`/signatures/${id}/admin-sign`, { adminSignature: admSig, employeeSignature: empSig });
            toast.success(t('signSuccess'));
            fetchRequest();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
        finally { setSigning(false); }
    };

    // Admin sign (after employee signed)
    const handleAdminSign = async () => {
        const admSig = getCanvasData(adminCanvasRef.current);
        if (!admSig) { toast.error('Signature admin requise'); return; }
        setSigning(true);
        try {
            await api.post(`/signatures/${id}/admin-sign`, { adminSignature: admSig });
            toast.success(t('signSuccess'));
            fetchRequest();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
        finally { setSigning(false); }
    };

    // Admin validate + sign (employee request)
    const handleValidate = async () => {
        const admSig = getCanvasData(adminCanvasRef.current);
        if (!admSig) { toast.error('Signature admin requise'); return; }
        setSigning(true);
        try {
            await api.post(`/signatures/${id}/validate`, { adminSignature: admSig });
            toast.success(t('validateSuccess'));
            fetchRequest();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
        finally { setSigning(false); }
    };

    const handleReject = async () => {
        try {
            await api.post(`/signatures/${id}/reject`, { reason: rejectReason });
            toast.success(t('rejectSuccess'));
            setShowReject(false);
            fetchRequest();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
    };

    const handleCancel = async () => {
        try {
            await api.post(`/signatures/${id}/cancel`);
            toast.success(t('cancelSuccess'));
            fetchRequest();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
    };

    const pdfUrl = `${API_BASE_URL}/signatures/${id}/pdf?tenant=${user?.tenantSubdomain || 'demo'}&token=${Cookies.get('accessToken') || ''}`;
    const signedPdfUrl = `${API_BASE_URL}/signatures/${id}/signed-pdf?tenant=${user?.tenantSubdomain || 'demo'}&token=${Cookies.get('accessToken') || ''}`;

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
    if (!req) return <p className="text-center py-12 text-slate-500">Demande introuvable</p>;

    const canAdminSign = req.signatureMode === 'DUAL' && (req.status === 'AWAITING_ADMIN' || req.status === 'PENDING');
    const canValidate = req.status === 'AWAITING_VALIDATION';
    const canCancel = !['SIGNED', 'CANCELLED'].includes(req.status);
    const isSigned = req.status === 'SIGNED';

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/signatures"><Button variant="outline" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-slate-900">{req.title}</h1>
                    <p className="text-sm text-slate-500">{req.employee?.firstName} {req.employee?.lastName} · {t(`docTypes.${req.documentType}`)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[req.status]}`}>{t(`statuses.${req.status}`)}</span>
            </div>

            {/* Info */}
            <Card>
                <CardContent className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-xs text-slate-400">Mode</p><p className="font-semibold">{req.signatureMode === 'DUAL' ? t('modeDual') : req.signatureMode === 'ADMIN_ONLY' ? t('modeAdminOnly') : t('modeEmployeeOnly')}</p></div>
                    <div><p className="text-xs text-slate-400">Initié par</p><p className="font-semibold">{req.initiatedBy === 'EMPLOYEE' ? 'Employé' : 'Admin'}</p></div>
                    <div><p className="text-xs text-slate-400">{t('requestedOn')}</p><p className="font-semibold">{new Date(req.requestedAt).toLocaleDateString('fr-FR')}</p></div>
                    {req.expiresAt && <div><p className="text-xs text-slate-400">{t('expiresAt')}</p><p className="font-semibold">{new Date(req.expiresAt).toLocaleDateString('fr-FR')}</p></div>}
                </CardContent>
            </Card>

            {/* PDF Preview */}
            {req.pdfData && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" /> {t('viewPdf')}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => window.open(pdfUrl, '_blank')} className="gap-1.5"><FileText className="h-4 w-4" /> {t('viewPdf')}</Button>
                            {isSigned && <Button onClick={() => window.open(signedPdfUrl, '_blank')} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"><Download className="h-4 w-4" /> {t('downloadSigned')}</Button>}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Signature Zones */}
            {(canAdminSign || canValidate) && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><PenTool className="h-4 w-4" /> {t('sign')}</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {/* DUAL: both signatures side by side */}
                        {req.signatureMode === 'DUAL' && req.status === 'PENDING' && (
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-sm font-semibold mb-2 block">{t('signEmployee')}</Label>
                                    <canvas
                                        ref={employeeCanvasRef}
                                        className="w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-crosshair bg-white"
                                        onMouseDown={e => startDraw(e, employeeCanvasRef.current!)}
                                        onMouseMove={e => draw(e, employeeCanvasRef.current!)}
                                        onMouseUp={stopDraw} onMouseLeave={stopDraw}
                                        onTouchStart={e => startDraw(e, employeeCanvasRef.current!)}
                                        onTouchMove={e => draw(e, employeeCanvasRef.current!)}
                                        onTouchEnd={stopDraw}
                                    />
                                    <Button variant="ghost" size="sm" onClick={() => clearCanvas(employeeCanvasRef.current)} className="mt-1 text-xs">{t('clearSignature')}</Button>
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold mb-2 block">{t('signAdmin')}</Label>
                                    <canvas
                                        ref={adminCanvasRef}
                                        className="w-full h-32 border-2 border-dashed border-indigo-300 rounded-xl cursor-crosshair bg-white"
                                        onMouseDown={e => startDraw(e, adminCanvasRef.current!)}
                                        onMouseMove={e => draw(e, adminCanvasRef.current!)}
                                        onMouseUp={stopDraw} onMouseLeave={stopDraw}
                                        onTouchStart={e => startDraw(e, adminCanvasRef.current!)}
                                        onTouchMove={e => draw(e, adminCanvasRef.current!)}
                                        onTouchEnd={stopDraw}
                                    />
                                    <Button variant="ghost" size="sm" onClick={() => clearCanvas(adminCanvasRef.current)} className="mt-1 text-xs">{t('clearSignature')}</Button>
                                </div>
                            </div>
                        )}

                        {/* DUAL: admin signs after employee */}
                        {req.signatureMode === 'DUAL' && req.status === 'AWAITING_ADMIN' && (
                            <div>
                                <div className="flex items-center gap-2 mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm text-emerald-700">{t('signEmployee')} — {t('signedOn')} {new Date(req.employeeSignedAt).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <Label className="text-sm font-semibold mb-2 block">{t('signAdmin')}</Label>
                                <canvas
                                    ref={adminCanvasRef}
                                    className="w-full h-32 border-2 border-dashed border-indigo-300 rounded-xl cursor-crosshair bg-white"
                                    onMouseDown={e => startDraw(e, adminCanvasRef.current!)}
                                    onMouseMove={e => draw(e, adminCanvasRef.current!)}
                                    onMouseUp={stopDraw} onMouseLeave={stopDraw}
                                    onTouchStart={e => startDraw(e, adminCanvasRef.current!)}
                                    onTouchMove={e => draw(e, adminCanvasRef.current!)}
                                    onTouchEnd={stopDraw}
                                />
                                <Button variant="ghost" size="sm" onClick={() => clearCanvas(adminCanvasRef.current)} className="mt-1 text-xs">{t('clearSignature')}</Button>
                            </div>
                        )}

                        {/* ADMIN_ONLY: validate employee request */}
                        {canValidate && (
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">{t('signAdmin')}</Label>
                                <canvas
                                    ref={adminCanvasRef}
                                    className="w-full h-32 border-2 border-dashed border-indigo-300 rounded-xl cursor-crosshair bg-white"
                                    onMouseDown={e => startDraw(e, adminCanvasRef.current!)}
                                    onMouseMove={e => draw(e, adminCanvasRef.current!)}
                                    onMouseUp={stopDraw} onMouseLeave={stopDraw}
                                    onTouchStart={e => startDraw(e, adminCanvasRef.current!)}
                                    onTouchMove={e => draw(e, adminCanvasRef.current!)}
                                    onTouchEnd={stopDraw}
                                />
                                <Button variant="ghost" size="sm" onClick={() => clearCanvas(adminCanvasRef.current)} className="mt-1 text-xs">{t('clearSignature')}</Button>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2 justify-end pt-2">
                            {req.signatureMode === 'DUAL' && req.status === 'PENDING' && (
                                <Button onClick={handleAdminSignBoth} disabled={signing} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                                    {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenTool className="h-4 w-4" />} {t('signBoth')}
                                </Button>
                            )}
                            {req.signatureMode === 'DUAL' && req.status === 'AWAITING_ADMIN' && (
                                <Button onClick={handleAdminSign} disabled={signing} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                                    {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenTool className="h-4 w-4" />} {t('confirmSign')}
                                </Button>
                            )}
                            {canValidate && (
                                <>
                                    <Button variant="outline" onClick={() => setShowReject(true)} className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
                                        <XCircle className="h-4 w-4" /> {t('reject')}
                                    </Button>
                                    <Button onClick={handleValidate} disabled={signing} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                                        {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {t('validate')}
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Signed status */}
            {isSigned && (
                <Card className="border-emerald-200 bg-emerald-50">
                    <CardContent className="p-5 flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        <div>
                            <p className="font-bold text-emerald-800">Document signé</p>
                            <p className="text-sm text-emerald-600">
                                {req.employeeSignedAt && `Employé: ${new Date(req.employeeSignedAt).toLocaleDateString('fr-FR')}`}
                                {req.adminSignedAt && ` · Admin: ${new Date(req.adminSignedAt).toLocaleDateString('fr-FR')}`}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Cancel button */}
            {canCancel && (
                <div className="flex justify-end">
                    <Button variant="outline" onClick={handleCancel} className="gap-1.5 text-slate-500 hover:text-red-600 hover:border-red-200">
                        <Trash2 className="h-4 w-4" /> {t('cancel')}
                    </Button>
                </div>
            )}

            {/* Reject Dialog */}
            <Dialog open={showReject} onOpenChange={setShowReject}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('reject')}</DialogTitle>
                        <DialogDescription>{t('rejectReason')}</DialogDescription>
                    </DialogHeader>
                    <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Motif..." />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReject(false)}>{tc('cancel')}</Button>
                        <Button variant="destructive" onClick={handleReject}>{t('reject')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
