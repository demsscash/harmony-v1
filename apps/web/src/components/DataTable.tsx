'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Search, ChevronUp, ChevronDown, ChevronsUpDown,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────
export interface Column<T> {
    key: string;
    header: string;
    /** Render cell content. Receives the row data. */
    render?: (row: T) => React.ReactNode;
    /** Accessor for sorting/filtering. Returns a sortable value. */
    accessor?: (row: T) => string | number;
    /** Enable sorting on this column (default: true if accessor is provided) */
    sortable?: boolean;
    /** Custom className for <th> and <td> */
    className?: string;
    /** Header className override */
    headerClassName?: string;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    /** Unique key for each row */
    rowKey: (row: T) => string;
    /** Enable global search (default: true) */
    searchable?: boolean;
    /** Search placeholder text */
    searchPlaceholder?: string;
    /** Fields to search on (accessor functions). If empty, searches all columns with accessors. */
    searchFields?: ((row: T) => string)[];
    /** Number of rows per page. 0 = no pagination. (default: 15) */
    pageSize?: number;
    /** Page size options for selector */
    pageSizeOptions?: number[];
    /** Empty state component */
    emptyState?: React.ReactNode;
    /** Loading state */
    loading?: boolean;
    /** Loading component */
    loadingState?: React.ReactNode;
    /** Toolbar - rendered between search and table */
    toolbar?: React.ReactNode;
    /** Extra content rendered in the header row (right side, next to search) */
    headerExtra?: React.ReactNode;
    /** Row click handler */
    onRowClick?: (row: T) => void;
    /** Row className (can be dynamic) */
    rowClassName?: string | ((row: T) => string);
    /** Wrapper className */
    className?: string;
    /** Translations */
    texts?: {
        search?: string;
        noResults?: string;
        loading?: string;
        page?: string;
        of?: string;
        rows?: string;
        showing?: string;
        to?: string;
    };
}

type SortDir = 'asc' | 'desc' | null;

// ─── Component ─────────────────────────────────────────
export function DataTable<T>({
    data,
    columns,
    rowKey,
    searchable = true,
    searchPlaceholder,
    searchFields,
    pageSize: initialPageSize = 15,
    pageSizeOptions = [10, 15, 25, 50],
    emptyState,
    loading = false,
    loadingState,
    toolbar,
    headerExtra,
    onRowClick,
    rowClassName,
    className,
    texts = {},
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    // Reset page when search/sort/pageSize changes
    React.useEffect(() => { setPage(1); }, [search, sortKey, sortDir, pageSize]);

    // Filter
    const filtered = useMemo(() => {
        if (!search.trim()) return data;
        const q = search.toLowerCase();

        const fields = searchFields || columns
            .filter(c => c.accessor)
            .map(c => c.accessor!);

        return data.filter(row =>
            fields.some(fn => String(fn(row)).toLowerCase().includes(q))
        );
    }, [data, search, searchFields, columns]);

    // Sort
    const sorted = useMemo(() => {
        if (!sortKey || !sortDir) return filtered;
        const col = columns.find(c => c.key === sortKey);
        if (!col?.accessor) return filtered;

        return [...filtered].sort((a, b) => {
            const va = col.accessor!(a);
            const vb = col.accessor!(b);
            if (va === vb) return 0;
            const cmp = va < vb ? -1 : 1;
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sortKey, sortDir, columns]);

    // Paginate
    const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
    const paginated = pageSize > 0 ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;

    const handleSort = (key: string) => {
        if (sortKey === key) {
            if (sortDir === 'asc') setSortDir('desc');
            else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    return (
        <div className={className}>
            {/* Header: Search + Extra */}
            {(searchable || headerExtra) && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    {searchable && (
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder={searchPlaceholder || texts.search || 'Search...'}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 h-9 bg-white border-slate-200 shadow-sm"
                            />
                        </div>
                    )}
                    {headerExtra && <div className="flex items-center gap-2 flex-wrap">{headerExtra}</div>}
                </div>
            )}

            {/* Toolbar */}
            {toolbar && <div className="mb-4">{toolbar}</div>}

            {/* Table */}
            <div className="border border-slate-200/60 rounded-xl shadow-sm bg-white/90 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                {columns.map(col => {
                                    const isSortable = col.sortable !== false && !!col.accessor;
                                    const isActive = sortKey === col.key;
                                    return (
                                        <th
                                            key={col.key}
                                            className={`px-5 py-3 font-semibold text-xs uppercase tracking-wider ${isSortable ? 'cursor-pointer select-none hover:text-slate-700 transition-colors' : ''} ${col.headerClassName || col.className || ''}`}
                                            onClick={isSortable ? () => handleSort(col.key) : undefined}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {col.header}
                                                {isSortable && (
                                                    <span className="inline-flex flex-col">
                                                        {isActive && sortDir === 'asc' ? (
                                                            <ChevronUp className="h-3.5 w-3.5 text-slate-900" />
                                                        ) : isActive && sortDir === 'desc' ? (
                                                            <ChevronDown className="h-3.5 w-3.5 text-slate-900" />
                                                        ) : (
                                                            <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-5 py-16 text-center">
                                        {loadingState || (
                                            <div className="flex items-center justify-center gap-2 text-slate-400">
                                                <div className="h-5 w-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                                                {texts.loading || 'Loading...'}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-5 py-16 text-center text-slate-400">
                                        {emptyState || (texts.noResults || 'No results')}
                                    </td>
                                </tr>
                            ) : paginated.map(row => (
                                <tr
                                    key={rowKey(row)}
                                    className={`hover:bg-slate-50/80 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${typeof rowClassName === 'function' ? rowClassName(row) : rowClassName || ''}`}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                >
                                    {columns.map(col => (
                                        <td key={col.key} className={`px-5 py-3 ${col.className || ''}`}>
                                            {col.render
                                                ? col.render(row)
                                                : col.accessor
                                                    ? String(col.accessor(row))
                                                    : null}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pageSize > 0 && sorted.length > 0 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                            <span>
                                {texts.showing || 'Showing'} {Math.min((page - 1) * pageSize + 1, sorted.length)}–{Math.min(page * pageSize, sorted.length)} {texts.of || 'of'} {sorted.length} {texts.rows || 'rows'}
                            </span>
                            <select
                                value={pageSize}
                                onChange={e => setPageSize(Number(e.target.value))}
                                className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600"
                            >
                                {pageSizeOptions.map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline" size="icon-xs"
                                disabled={page <= 1}
                                onClick={() => setPage(1)}
                            >
                                <ChevronsLeft className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="outline" size="icon-xs"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <span className="px-2 font-medium text-slate-700">
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline" size="icon-xs"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <ChevronRight className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="outline" size="icon-xs"
                                disabled={page >= totalPages}
                                onClick={() => setPage(totalPages)}
                            >
                                <ChevronsRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
