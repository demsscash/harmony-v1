'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, FileSpreadsheet } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────
export interface ExportColumn {
    header: string;
    accessor: (row: any) => string | number;
}

export interface ExportButtonsProps {
    /** Data to export */
    data: any[];
    /** Columns definition for export */
    columns: ExportColumn[];
    /** File name (without extension) */
    filename: string;
    /** Button label for CSV */
    csvLabel?: string;
    /** Button label for Excel */
    excelLabel?: string;
    /** Show CSV button (default: true) */
    showCSV?: boolean;
    /** Show Excel button (default: true) */
    showExcel?: boolean;
    /** Additional className */
    className?: string;
}

// ─── CSV Export ────────────────────────────────────────
function exportToCSV(data: any[], columns: ExportColumn[], filename: string) {
    const headers = columns.map(c => c.header);
    const rows = data.map(row =>
        columns.map(c => {
            const val = c.accessor(row);
            return `"${String(val ?? '').replace(/"/g, '""')}"`;
        }).join(',')
    );
    const csv = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);
}

// ─── Excel Export (XLSX via simple XML spreadsheet) ────
function exportToExcel(data: any[], columns: ExportColumn[], filename: string) {
    // Generate a simple HTML table that Excel can open
    const headerRow = columns.map(c => `<th style="background:#f1f5f9;font-weight:bold;border:1px solid #e2e8f0;padding:8px">${escapeHtml(c.header)}</th>`).join('');
    const bodyRows = data.map(row =>
        '<tr>' + columns.map(c => {
            const val = c.accessor(row);
            const isNum = typeof val === 'number';
            return `<td style="border:1px solid #e2e8f0;padding:6px;${isNum ? 'mso-number-format:General;' : ''}">${escapeHtml(String(val ?? ''))}</td>`;
        }).join('') + '</tr>'
    ).join('');

    const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Data</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body><table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    downloadBlob(blob, `${filename}.xls`);
}

// ─── Helpers ───────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── Component ─────────────────────────────────────────
export function ExportButtons({
    data,
    columns,
    filename,
    csvLabel = 'CSV',
    excelLabel = 'Excel',
    showCSV = true,
    showExcel = true,
    className,
}: ExportButtonsProps) {
    if (data.length === 0) return null;

    return (
        <div className={`flex items-center gap-1.5 ${className || ''}`}>
            {showCSV && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCSV(data, columns, filename)}
                    aria-label="Export CSV"
                    className="gap-1.5 text-slate-600 border-slate-200 hover:bg-slate-50 h-8 text-xs"
                >
                    <FileDown className="h-3.5 w-3.5" />
                    {csvLabel}
                </Button>
            )}
            {showExcel && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToExcel(data, columns, filename)}
                    aria-label="Export Excel"
                    className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-8 text-xs"
                >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    {excelLabel}
                </Button>
            )}
        </div>
    );
}
