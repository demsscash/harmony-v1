'use client';

import * as React from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/store/authStore';
import { useTranslations, useLocale } from 'next-intl';
import {
    Home, Users, Calendar, Settings, LogOut,
    Menu, Bell, Search, Briefcase, CreditCard, Banknote, Network, ChevronDown, FileSpreadsheet,
    BookOpen, Award, ClipboardList, MapPin, UserCog, ShieldCheck, Activity, PenTool, Clock, Timer, Wallet,
    Receipt, BarChart3, ClipboardCheck, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Breadcrumbs } from '@/components/Breadcrumbs';

import api from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logoutState, tenantLogo, tenantName, setTenantLogo, setTenantName } = useAuthStore();
    const pathname = usePathname();
    const router = useRouter();
    const t = useTranslations('nav');
    const td = useTranslations('navDesc');
    const tc = useTranslations('common');
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [isMobileOpen, setMobileOpen] = React.useState(false);
    const [notifCount, setNotifCount] = React.useState(0);
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => { setMounted(true); }, []);
    const isSuperAdminLayout = user?.role === 'SUPER_ADMIN';

    // Search state
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<any>(null);
    const [searchOpen, setSearchOpen] = React.useState(false);
    const searchRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const searchTimerRef = React.useRef<NodeJS.Timeout>(undefined);

    // Debounced search
    React.useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults(null);
            setSearchOpen(false);
            return;
        }
        searchTimerRef.current = setTimeout(async () => {
            try {
                const res = await api.get('/search', { params: { q: searchQuery } });
                setSearchResults(res.data?.data || null);
                setSearchOpen(true);
            } catch { setSearchResults(null); }
        }, 300);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [searchQuery]);

    // Close search on click outside
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Cmd+K / Ctrl+K shortcut to focus search
    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const navigateFromSearch = (href: string) => {
        setSearchOpen(false);
        setSearchQuery('');
        router.push(href);
    };

    React.useEffect(() => {
        if (isSuperAdminLayout) return;
        api.get('/notifications/inbox')
            .then(res => setNotifCount(res.data?.count || 0))
            .catch(() => {});
    }, [isSuperAdminLayout]);

    // Fetch tenant info into Zustand (only if not already loaded)
    React.useEffect(() => {
        if (isSuperAdminLayout) return;
        api.get('/settings/tenant')
            .then(res => {
                const tenant = res.data?.data || res.data;
                if (tenant?.logo) setTenantLogo(tenant.logo);
                if (tenant?.name) setTenantName(tenant.name);
            })
            .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuperAdminLayout]);

    // Helper to build trigger's active state
    const isGroupActive = (hrefs: string[]) => hrefs.some(h => pathname === h || pathname.startsWith(h + '/'));

    const handleLogout = () => {
        document.cookie = 'accessToken=; Max-Age=0; path=/;';
        logoutState();
        window.location.href = '/login';
    };

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    // Super Admin menu
    const superAdminMenu = [
        { label: t('globalView'), href: '/dashboard', icon: Home },
        { label: t('instances'), href: '/dashboard/tenants', icon: Briefcase },
        { label: t('monitoring'), href: '/dashboard/monitoring', icon: Activity },
        { label: t('billing'), href: '/dashboard/billing', icon: CreditCard },
        { label: t('settings'), href: '/dashboard/settings', icon: Settings },
    ];

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR';

    // HR nav groups — logically separated
    const hrNavGroups = [
        {
            label: t('employees'),
            icon: Users,
            items: [
                { label: t('employeeList'), href: '/dashboard/employees', icon: Users, desc: td('employeeList') },
                { label: t('departments'), href: '/dashboard/departments', icon: Briefcase, desc: td('departments') },
                { label: t('directory'), href: '/dashboard/directory', icon: MapPin, desc: td('directory') },
                { label: t('orgChart'), href: '/dashboard/organization', icon: Network, desc: td('orgChart') },
                { label: t('excelImport'), href: '/dashboard/employees/import', icon: FileSpreadsheet, desc: td('excelImport') },
            ]
        },
        {
            label: t('hr'),
            icon: Calendar,
            items: [
                { label: t('leaves'), href: '/dashboard/leaves', icon: Calendar, desc: td('leaves') },
                { label: t('teamCalendar'), href: '/dashboard/leaves/calendar', icon: Calendar, desc: td('teamCalendar') },
                { label: t('attendance'), href: '/dashboard/attendance', icon: Clock, desc: td('attendance') },
                { label: t('expenses'), href: '/dashboard/expenses', icon: Receipt, desc: td('expenses') },
                { label: t('evaluations'), href: '/dashboard/evaluations', icon: ClipboardCheck, desc: td('evaluations') },
                { label: t('sanctions'), href: '/dashboard/sanctions', icon: AlertTriangle, desc: td('sanctions') },
                { label: t('onboarding'), href: '/dashboard/onboarding', icon: ClipboardList, desc: td('onboarding') },
                { label: t('signatures'), href: '/dashboard/signatures', icon: PenTool, desc: td('signatures') },
            ]
        },
        {
            label: t('payroll'),
            icon: Banknote,
            items: [
                { label: t('payslips'), href: '/dashboard/payroll', icon: Banknote, desc: td('payslips') },
                { label: t('overtime'), href: '/dashboard/overtime', icon: Timer, desc: td('overtime') },
                { label: t('advances'), href: '/dashboard/advances', icon: Wallet, desc: td('advances') },
                { label: t('taxDeclarations'), href: '/dashboard/payroll/dgi', icon: BookOpen, desc: td('taxDeclarations') },
            ]
        },
        {
            label: t('administration'),
            icon: ShieldCheck,
            items: [
                { label: t('users'), href: '/dashboard/users', icon: UserCog, desc: td('users') },
                { label: t('gradesAdvantages'), href: '/dashboard/grades', icon: Award, desc: td('gradesAdvantages') },
                { label: t('reports'), href: '/dashboard/reports', icon: BarChart3, desc: td('reports') },
                ...(user?.role === 'ADMIN' || user?.permissions?.includes('settings') ? [{ label: t('settings'), href: '/dashboard/settings', icon: Settings, desc: td('settings') }] : []),
            ]
        },
    ];

    // Flat list for mobile drawer
    const hrMenuFlat = hrNavGroups.flatMap(g => g.items);
    const menuItems = isSuperAdmin ? superAdminMenu : [{ label: t('home'), href: '/dashboard', icon: Home }, ...hrMenuFlat];

    if (!mounted) {
        return (
            <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col">
                <header className="sticky top-0 z-50 w-full bg-slate-950 text-slate-300 border-b border-slate-800 shadow-xl h-16" />
                <main className="flex-1 overflow-x-hidden p-4 md:p-8">
                    <div className="max-w-7xl mx-auto w-full" />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col">
            {/* Skip to content — accessibility */}
            <a href="#main-content" className="skip-to-content">{tc('skipToContent')}</a>

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full bg-slate-950 text-slate-300 border-b border-slate-800 shadow-xl" role="banner">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">

                        {/* Logo & Brand */}
                        <div className="flex items-center gap-6">
                            <Link href="/dashboard" className="flex items-center gap-2 group">
                                {tenantLogo ? (
                                    <img src={tenantLogo} alt={tenantName} className="h-8 w-8 rounded-lg object-cover group-hover:scale-105 transition-transform shadow-lg shadow-blue-500/20" />
                                ) : (
                                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform shadow-lg shadow-blue-500/20">
                                        H
                                    </div>
                                )}
                                <span className="font-bold text-lg text-white tracking-tight hidden sm:block">{tenantName}</span>
                            </Link>

                            {/* Desktop Nav */}
                            <nav className="hidden md:flex items-center space-x-1" aria-label={tc('mainNav')}>
                                {/* Home link */}
                                <Link
                                    href="/dashboard"
                                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all ${pathname === '/dashboard' ? 'bg-blue-600/10 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    <Home className={`h-4 w-4 ${isRTL ? 'ms-1.5' : 'me-1.5'}`} />
                                    {t('home')}
                                </Link>

                                {/* HR grouped dropdowns */}
                                {!isSuperAdmin && hrNavGroups.map((group) => {
                                    const active = isGroupActive(group.items.map(i => i.href));
                                    return (
                                        <DropdownMenu key={group.label}>
                                            <DropdownMenuTrigger asChild>
                                                <div
                                                    role="button"
                                                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-semibold gap-1.5 transition-all cursor-pointer ${active ? 'bg-blue-600/10 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                        }`}
                                                >
                                                    <group.icon className={`h-4 w-4 ${active ? 'text-blue-400' : ''}`} />
                                                    {group.label}
                                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                                </div>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="start"
                                                className="min-w-[220px] bg-slate-950 text-white border-slate-800 p-1.5 shadow-2xl rounded-xl"
                                            >
                                                <DropdownMenuGroup>
                                                    {group.items.map(item => {
                                                        const itemActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                                        return (
                                                            <DropdownMenuItem
                                                                key={item.href}
                                                                className="cursor-pointer rounded-lg p-0 focus:bg-transparent focus:text-inherit data-highlighted:bg-transparent"
                                                            >
                                                                <Link href={item.href} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors ${itemActive ? 'bg-blue-500/10' : 'hover:bg-slate-800/80'}`}>
                                                                    <div className={`p-1.5 rounded-md shrink-0 ${itemActive ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                                                                        <item.icon className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <p className={`text-sm font-semibold leading-none ${itemActive ? 'text-blue-300' : 'text-white'}`}>{item.label}</p>
                                                                        <p className="text-xs text-slate-400 mt-1 leading-none">{item.desc}</p>
                                                                    </div>
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        );
                                                    })}
                                                </DropdownMenuGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    );
                                })}

                                {/* Super Admin direct links */}
                                {isSuperAdmin && superAdminMenu.map((item) => (
                                    item.href !== '/dashboard' && (
                                        <Link key={item.href} href={item.href}
                                            className={`flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all ${pathname.startsWith(item.href) ? 'bg-blue-600/10 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                }`}
                                        >
                                            <item.icon className={`h-4 w-4 mr-1.5 ${pathname.startsWith(item.href) ? 'text-blue-500' : ''}`} />
                                            {item.label}
                                        </Link>
                                    )
                                ))}
                            </nav>
                        </div>

                        {/* Right Header Actions */}
                        <div className="flex items-center gap-3">
                            {/* Expandable Search */}
                            <div ref={searchRef} className="hidden lg:block relative">
                                <div
                                    onClick={() => searchInputRef.current?.focus()}
                                    className="flex items-center px-3 py-2 bg-slate-900 hover:bg-slate-800 rounded-full border border-slate-800 focus-within:bg-slate-950 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all group w-10 focus-within:w-64 cursor-text overflow-hidden"
                                >
                                    <Search className="h-4 w-4 text-slate-500 group-hover:text-slate-300 mix-blend-screen shrink-0 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => searchResults && setSearchOpen(true)}
                                        placeholder={isSuperAdmin ? t('searchInstance') : t('searchEmployee')}
                                        className="bg-transparent border-none outline-none text-sm text-slate-300 w-full placeholder:text-slate-500 placeholder:italic ml-2 opacity-0 group-focus-within:opacity-100 transition-opacity"
                                    />
                                    <kbd className="hidden group-focus-within:hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-medium text-slate-400 shrink-0 ml-auto">⌘K</kbd>
                                </div>

                                {/* Search Results Dropdown */}
                                {searchOpen && searchResults && (
                                    <div className="absolute top-full right-0 mt-2 w-80 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-[100]">
                                        {/* SUPER_ADMIN: tenants */}
                                        {searchResults.tenants?.length > 0 && (
                                            <div>
                                                <p className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('instances')}</p>
                                                {searchResults.tenants.map((tn: any) => (
                                                    <button key={tn.id} onClick={() => navigateFromSearch(`/dashboard/tenants`)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/60 transition-colors text-left">
                                                        <div className="h-8 w-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">{tn.name[0]}</div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-white truncate">{tn.name}</p>
                                                            <p className="text-xs text-slate-500">{tn.subdomain} {!tn.isActive && '• ' + tc('inactive')}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* ADMIN/HR: employees */}
                                        {searchResults.employees?.length > 0 && (
                                            <div>
                                                <p className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('employees')}</p>
                                                {searchResults.employees.map((e: any) => (
                                                    <button key={e.id} onClick={() => navigateFromSearch(`/dashboard/employees/${e.id}`)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/60 transition-colors text-left">
                                                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs shrink-0 border border-slate-700">
                                                            {e.firstName?.[0]}{e.lastName?.[0]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-white truncate">{e.firstName} {e.lastName}</p>
                                                            <p className="text-xs text-slate-500 truncate">{e.position} {e.department?.name ? `• ${e.department.name}` : ''}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* ADMIN/HR: leaves */}
                                        {searchResults.leaves?.length > 0 && (
                                            <div>
                                                <p className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-t border-slate-800">{t('leaves')}</p>
                                                {searchResults.leaves.map((l: any) => (
                                                    <button key={l.id} onClick={() => navigateFromSearch(`/dashboard/leaves`)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/60 transition-colors text-left">
                                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${l.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : l.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                                                            {l.leaveType?.name?.[0] || 'C'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-white truncate">{l.employee?.firstName} {l.employee?.lastName} — {l.leaveType?.name}</p>
                                                            <p className="text-xs text-slate-500">{l.status === 'PENDING' ? tc('pending') : l.status === 'APPROVED' ? tc('approved') : tc('rejected')}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* No results */}
                                        {!searchResults.tenants?.length && !searchResults.employees?.length && !searchResults.leaves?.length && (
                                            <div className="px-4 py-6 text-center">
                                                <p className="text-sm text-slate-500">{tc('noResults', { query: searchQuery })}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Link href="/dashboard/notifications" aria-label={tc('notifications') || 'Notifications'} className="relative p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center">
                                <Bell className="h-4 w-4" />
                                {notifCount > 0 && (
                                    <span className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} h-4 w-4 rounded-full bg-red-500 border border-slate-900 text-[9px] font-bold text-white flex items-center justify-center`}>
                                        {notifCount > 9 ? '9+' : notifCount}
                                    </span>
                                )}
                            </Link>

                            <LanguageSwitcher />

                            {/* User Profile Dropdown Simulator */}
                            <div className={`hidden sm:flex items-center gap-3 ${isRTL ? 'pr-4 border-r' : 'pl-4 border-l'} border-slate-800`}>
                                <div className="text-right hidden xl:block">
                                    <p className="text-sm font-semibold text-white leading-none whitespace-nowrap">{user?.firstName} {user?.lastName}</p>
                                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
                                </div>
                                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 font-bold text-white shadow-sm ring-2 ring-slate-900">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors ml-1"
                                    title={tc('logout')}
                                    aria-label={tc('logout')}
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Mobile menu button */}
                            <button className="md:hidden p-2 text-slate-400 hover:text-white" onClick={() => setMobileOpen(!isMobileOpen)} aria-expanded={isMobileOpen} aria-label={tc('navMenu')}>
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.nav
                            initial={{ y: '-100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '-100%' }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                            className="fixed top-0 inset-x-0 bg-slate-950 text-slate-300 shadow-2xl z-50 flex flex-col pt-16 rounded-b-2xl border-b border-slate-800"
                            aria-label="Navigation mobile"
                        >
                            <div className="py-4 px-4 space-y-1">
                                {menuItems.map((item) => {
                                    const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== '/dashboard');
                                    return (
                                        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                                            <div className={`flex items-center px-4 py-3 rounded-xl mb-1 ${isActive ? 'bg-blue-600/10 text-white border border-blue-500/20' : 'hover:bg-slate-900'}`}>
                                                <item.icon className={`h-5 w-5 mr-3 shrink-0 ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
                                                <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                                            </div>
                                        </Link>
                                    );
                                })}

                                {/* Mobile HR Settings */}
                                {!isSuperAdmin && (
                                    <Link href="/dashboard/settings" onClick={() => setMobileOpen(false)}>
                                        <div className={`flex items-center px-4 py-3 rounded-xl mb-1 ${pathname.startsWith('/dashboard/settings') ? 'bg-blue-600/10 text-white border border-blue-500/20' : 'hover:bg-slate-900'}`}>
                                            <Settings className={`h-5 w-5 mr-3 shrink-0 ${pathname.startsWith('/dashboard/settings') ? 'text-blue-500' : 'text-slate-500'}`} />
                                            <span className={`text-sm ${pathname.startsWith('/dashboard/settings') ? 'font-bold' : 'font-medium'}`}>{t('settings')}</span>
                                        </div>
                                    </Link>
                                )}
                            </div>
                            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 font-bold text-white">
                                        {user?.firstName?.[0] || user?.email?.[0]}{user?.lastName?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{user?.firstName || tc('user')}</p>
                                        <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ').toLowerCase() || tc('member')}</p>
                                    </div>
                                </div>
                                <Button variant="destructive" size="icon" onClick={handleLogout} className="rounded-full h-10 w-10 shadow-lg">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>

            {/* Page Content */}
            <main id="main-content" className="flex-1 overflow-x-hidden p-4 md:p-8 select-text" role="main">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-7xl mx-auto w-full select-text"
                >
                    <Breadcrumbs />
                    {children}
                </motion.div>
            </main>
        </div>
    );
}
