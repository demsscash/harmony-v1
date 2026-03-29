'use client';

import * as React from 'react';
import api from '@/lib/api';
import { Loader2, Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface ImportResult {
    success: boolean;
    row: number;
    name: string;
    error?: string;
}

export default function ImportExportPage() {
    const t = useTranslations('employees');
    const tc = useTranslations('common');
    const [file, setFile] = React.useState<File | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [importing, setImporting] = React.useState(false);
    const [results, setResults] = React.useState<ImportResult[]>([]);
    const [exporting, setExporting] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && (dropped.name.endsWith('.xlsx') || dropped.name.endsWith('.csv'))) {
            setFile(dropped);
        } else {
            toast.error(t('fileTypeError'));
        }
    };

    const handleImport = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        setImporting(true);
        setResults([]);
        try {
            const res = await api.post('/employees/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResults(res.data.results || []);
            const successCount = (res.data.results || []).filter((r: ImportResult) => r.success).length;
            toast.success(t('importSuccessCount', { count: successCount }));
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('importError'));
        } finally {
            setImporting(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await api.get('/employees/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `employees_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(t('exportDownloaded'));
        } catch {
            toast.error(t('exportError'));
        } finally {
            setExporting(false);
        }
    };

    const downloadTemplate = async () => {
        try {
            const res = await api.get('/employees/import-template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'template_import_employes.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch {
            toast.error(t('templateError'));
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{t('importExport')}</h1>
                <p className="text-slate-500 text-sm mt-1">{t('importExportDesc')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                                <Download className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">{t('exportEmployees')}</CardTitle>
                                <CardDescription>{t('exportEmployeesDesc')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 mb-4">{t('exportDesc')}</p>
                        <Button onClick={handleExport} disabled={exporting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                            {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                            {t('downloadExcel')}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">{t('importTemplate')}</CardTitle>
                                <CardDescription>{t('importTemplateDesc')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 mb-4">{t('importTemplateText')}</p>
                        <Button variant="outline" onClick={downloadTemplate} className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            {t('downloadTemplate')}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
                            <Upload className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <CardTitle className="text-base">{t('importEmployees')}</CardTitle>
                            <CardDescription>{t('importEmployeesDesc')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div
                        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${isDragging ? 'border-violet-400 bg-violet-50' : file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}`}
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.csv"
                            className="hidden"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                        />
                        {file ? (
                            <div>
                                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                                <p className="font-bold text-emerald-700">{file.name}</p>
                                <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                <button onClick={e => { e.stopPropagation(); setFile(null); setResults([]); }}
                                    className="mt-2 text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 mx-auto">
                                    <X className="h-3 w-3" /> {tc('remove')}
                                </button>
                            </div>
                        ) : (
                            <div>
                                <Upload className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <p className="font-semibold text-slate-600">{t('dropFileHere')}</p>
                                <p className="text-sm text-slate-400 mt-1">{t('orClickBrowse')}</p>
                                <p className="text-xs text-slate-400 mt-3">{t('supportedFormats')}</p>
                            </div>
                        )}
                    </div>

                    <Button onClick={handleImport} disabled={!file || importing} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                        {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        {importing ? t('importInProgress') : t('startImport')}
                    </Button>

                    {results.length > 0 && (
                        <div className="rounded-xl border border-slate-200 overflow-hidden mt-4">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                                <p className="font-bold text-slate-700 text-sm">{t('importResults')}</p>
                                <p className="text-xs text-slate-500">
                                    {results.filter(r => r.success).length} {t('successLabel')} · {results.filter(r => !r.success).length} {t('errorsLabel')}
                                </p>
                            </div>
                            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                                {results.map((r, i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                                        {r.success
                                            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                            : <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                                        }
                                        <span className="text-slate-500 text-xs w-10">L.{r.row}</span>
                                        <span className={`font-medium flex-1 ${r.success ? 'text-slate-800' : 'text-rose-700'}`}>{r.name}</span>
                                        {r.error && <span className="text-xs text-rose-500 truncate max-w-[180px]">{r.error}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
