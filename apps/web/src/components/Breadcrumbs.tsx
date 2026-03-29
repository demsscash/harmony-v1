'use client';

import { usePathname } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
    dashboard: 'home',
    employees: 'employees',
    directory: 'directory',
    organization: 'orgChart',
    leaves: 'leaves',
    calendar: 'teamCalendar',
    attendance: 'attendance',
    overtime: 'overtime',
    advances: 'advances',
    expenses: 'expenses',
    payroll: 'payslips',
    onboarding: 'onboarding',
    signatures: 'signatures',
    users: 'users',
    grades: 'gradesAdvantages',
    reports: 'reports',
    evaluations: 'evaluations',
    settings: 'settings',
    tenants: 'instances',
    monitoring: 'monitoring',
    billing: 'billing',
    notifications: 'notifications',
    import: 'excelImport',
    dgi: 'taxDeclarations',
    summary: 'summary',
};

export function Breadcrumbs() {
    const pathname = usePathname();
    const t = useTranslations('nav');

    const segments = pathname.split('/').filter(Boolean);

    // Don't show breadcrumbs on the dashboard root
    if (segments.length <= 1) return null;

    // Build crumbs: skip "dashboard" as first segment, show from 2nd onward
    const crumbs: { label: string; href: string }[] = [];
    let path = '';

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        path += '/' + seg;

        if (i === 0 && seg === 'dashboard') continue; // skip root

        // Check if it's a UUID-like segment (detail page)
        const isUUID = /^[0-9a-f-]{20,}$/i.test(seg);
        if (isUUID) {
            crumbs.push({ label: 'Détails', href: path });
        } else {
            const labelKey = ROUTE_LABELS[seg];
            const label = labelKey ? t(labelKey) : seg;
            crumbs.push({ label, href: path });
        }
    }

    if (crumbs.length === 0) return null;

    return (
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-slate-700 transition-colors">
                <Home className="h-3.5 w-3.5" />
            </Link>
            {crumbs.map((crumb, i) => (
                <span key={crumb.href} className="flex items-center gap-1.5">
                    <ChevronRight className="h-3 w-3 text-slate-300" />
                    {i === crumbs.length - 1 ? (
                        <span className="font-medium text-slate-700">{crumb.label}</span>
                    ) : (
                        <Link href={crumb.href} className="hover:text-slate-700 transition-colors">
                            {crumb.label}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    );
}
