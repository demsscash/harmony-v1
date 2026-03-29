'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TablePaginationProps {
    page: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
}

export function TablePagination({
    page,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 15, 25, 50],
}: TablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const start = Math.min((page - 1) * pageSize + 1, totalItems);
    const end = Math.min(page * pageSize, totalItems);

    if (totalItems <= pageSize) return null;

    return (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
            <div className="flex items-center gap-2">
                <span>Affichage {start}–{end} sur {totalItems} lignes</span>
                {onPageSizeChange && (
                    <select
                        value={pageSize}
                        onChange={e => onPageSizeChange(Number(e.target.value))}
                        className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600"
                    >
                        {pageSizeOptions.map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                )}
            </div>
            <div className="flex items-center gap-1">
                <button
                    disabled={page <= 1}
                    onClick={() => onPageChange(1)}
                    className="h-7 w-7 rounded-md border border-slate-200 bg-white flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                    <ChevronsLeft className="h-3 w-3" />
                </button>
                <button
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="h-7 w-7 rounded-md border border-slate-200 bg-white flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                    <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="px-2 font-medium text-slate-700">{page} / {totalPages}</span>
                <button
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="h-7 w-7 rounded-md border border-slate-200 bg-white flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                    <ChevronRight className="h-3 w-3" />
                </button>
                <button
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(totalPages)}
                    className="h-7 w-7 rounded-md border border-slate-200 bg-white flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                    <ChevronsRight className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}

/** Paginate an array client-side */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
    return items.slice((page - 1) * pageSize, page * pageSize);
}
