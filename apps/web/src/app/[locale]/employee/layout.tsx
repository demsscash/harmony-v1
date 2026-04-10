'use client';

import * as React from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/store/authStore';
import { useTranslations, useLocale } from 'next-intl';
import {
    Home, LogOut,
    Menu, Bell, FileText, Plane, UserIcon, Banknote, Award, Search, PenTool, ChevronDown, FolderOpen, Wallet
} from 'lucide-react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const { user, logoutState, tenantLogo, tenantName, setTenantLogo, setTenantName } = useAuthStore();
    const pathname = usePathname();
    const routerNav = useRouter();
    const t = useTranslations('employeePortal');
    const tc = useTranslations('common');
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [isMobileOpen, setMobileOpen] = React.useState(false);
    const [notifCount, setNotifCount] = React.useState(0);
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => { setMounted(true); }, []);

    // Search state
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<any>(null);
    const [searchOpen, setSearchOpen] = React.useState(false);
    const searchRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const searchTimerRef = React.useRef<NodeJS.Timeout>(undefined);

    React.useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        if (!searchQuery || searchQuery.length < 2) { setSearchResults(null); setSearchOpen(false); return; }
        searchTimerRef.current = setTimeout(async () => {
            try {
                const res = await api.get('/search', { params: { q: searchQuery } });
                setSearchResults(res.data?.data || null);
                setSearchOpen(true);
            } catch { setSearchResults(null); }
        }, 300);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [searchQuery]);

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const navigateFromSearch = (href: string) => {
        setSearchOpen(false); setSearchQuery(''); routerNav.push(href);
    };

    React.useEffect(() => {
        api.get('/notifications/inbox')
            .then(res => setNotifCount(res.data?.count || 0))
            .catch(() => {});
    }, []);

    // Fetch tenant info into Zustand (only if not already loaded)
    React.useEffect(() => {
        api.get('/settings/tenant')
            .then(res => {
                const tenant = res.data?.data || res.data;
                if (tenant?.logo) setTenantLogo(tenant.logo);
                if (tenant?.name) setTenantName(tenant.name);
            })
            .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = () => {
        document.cookie = 'accessToken=; Max-Age=0; path=/;';
        logoutState();
        window.location.href = '/login';
    };

    const employeeMenu = [
        { label: t('myDashboard'), href: '/employee', icon: Home },
        { label: t('myLeaves'), href: '/employee/leaves', icon: Plane },
        { label: t('myAdvances'), href: '/employee/advances', icon: Wallet },
    ];

    const profileItem = { label: t('myProfile'), href: '/employee/profile', icon: UserIcon };

    const documentsMenu = [
        { label: t('myPayslips'), href: '/employee/payslips', icon: Banknote },
        { label: t('myCertificates'), href: '/employee/attestations', icon: Award },
        { label: t('myDocuments'), href: '/employee/documents', icon: FileText },
        { label: t('mySignatures'), href: '/employee/signatures', icon: PenTool },
    ];

    const isDocumentsActive = documentsMenu.some(item => pathname === item.href || pathname.startsWith(item.href + '/'));

    if (!mounted) {
        return (
            <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col">
                <header className="sticky top-0 z-50 w-full bg-slate-950 text-slate-300 border-b border-slate-800 shadow-xl h-16" />
                <main className="flex-1 overflow-x-hidden pt-8 pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
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
                            <Link href="/employee" className="flex items-center gap-2 group">
                                {tenantLogo ? (
                                    <img src={tenantLogo} alt={tenantName} className="h-8 w-8 rounded-lg object-cover group-hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20" />
                                ) : (
                                    <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20">
                                        H
                                    </div>
                                )}
                                <span className="font-bold text-lg text-white tracking-tight hidden sm:block">{tenantName}</span>
                            </Link>

                            {/* Desktop Nav */}
                            <nav className="hidden md:flex items-center space-x-1" aria-label={tc('mainNav')}>
                                {employeeMenu.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all ${pathname === item.href ? 'bg-emerald-600/10 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                            }`}
                                    >
                                        <item.icon className="h-4 w-4 mr-1.5" />
                                        {item.label}
                                    </Link>
                                ))}

                                {/* Documents dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className={`flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all ${isDocumentsActive ? 'bg-emerald-600/10 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                                            <FolderOpen className="h-4 w-4 mr-1.5" />
                                            {t('documents')}
                                            <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56 mt-2 p-2 rounded-xl border-slate-800 bg-slate-950 text-white shadow-2xl">
                                        {documentsMenu.map((item) => (
                                            <DropdownMenuItem key={item.href} onClick={() => routerNav.push(item.href)} className={`cursor-pointer rounded-lg p-2.5 ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'bg-emerald-600/10 text-emerald-400' : 'text-slate-300 focus:text-white focus:bg-slate-800'}`}>
                                                <item.icon className="mr-2.5 h-4 w-4" />
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Profile - last item */}
                                <Link
                                    href={profileItem.href}
                                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all ${pathname === profileItem.href ? 'bg-emerald-600/10 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                >
                                    <profileItem.icon className="h-4 w-4 mr-1.5" />
                                    {profileItem.label}
                                </Link>
                            </nav>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Search */}
                            <div ref={searchRef} className="hidden md:block relative">
                                <div
                                    onClick={() => searchInputRef.current?.focus()}
                                    className="flex items-center px-3 py-2 bg-slate-900 hover:bg-slate-800 rounded-full border border-slate-800 focus-within:bg-slate-950 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all group w-10 focus-within:w-56 cursor-text overflow-hidden"
                                >
                                    <Search className="h-4 w-4 text-slate-500 group-hover:text-slate-300 shrink-0 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => searchResults && setSearchOpen(true)}
                                        placeholder={t('myLeaves') + '...'}
                                        className="bg-transparent border-none outline-none text-sm text-slate-300 w-full placeholder:text-slate-500 placeholder:italic ml-2 opacity-0 group-focus-within:opacity-100 transition-opacity"
                                    />
                                </div>
                                {searchOpen && searchResults && (
                                    <div className="absolute top-full right-0 mt-2 w-72 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-[100]">
                                        {searchResults.leaves?.length > 0 ? (
                                            <div>
                                                <p className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('myLeaves')}</p>
                                                {searchResults.leaves.map((l: any) => (
                                                    <button key={l.id} onClick={() => navigateFromSearch('/employee/leaves')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/60 transition-colors text-left">
                                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${l.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : l.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                                                            {l.leaveType?.name?.[0] || 'C'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-white truncate">{l.leaveType?.name}</p>
                                                            <p className="text-xs text-slate-500">{l.status === 'PENDING' ? tc('pending') : l.status === 'APPROVED' ? tc('approved') : tc('rejected')}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-4 py-6 text-center">
                                                <p className="text-sm text-slate-500">{tc('noResults', { query: searchQuery })}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Link href="/employee/notifications" aria-label="Notifications" className="relative flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-full h-9 w-9 transition-colors">
                                <Bell className="h-4 w-4" />
                                {notifCount > 0 && (
                                    <span className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} h-4 w-4 rounded-full bg-red-500 border border-slate-950 text-[9px] font-bold text-white flex items-center justify-center`}>
                                        {notifCount > 9 ? '9+' : notifCount}
                                    </span>
                                )}
                            </Link>

                            <LanguageSwitcher />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 hover:text-emerald-400 border border-emerald-500/20 ring-2 ring-transparent focus-visible:ring-emerald-500/50 transition-all">
                                        <span className="text-sm font-bold uppercase">{user?.email?.charAt(0) || 'E'}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 mt-2 p-2 rounded-xl border-slate-800 bg-slate-950 text-slate-300 shadow-2xl">
                                    <div className="p-2 flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none text-white">{user?.firstName || t('employee')}</p>
                                        <p className="text-xs leading-none text-slate-500">{user?.email}</p>
                                    </div>
                                    <DropdownMenuSeparator className="bg-slate-800" />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-300 focus:bg-red-400/10 cursor-pointer rounded-lg p-2 mt-1">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>{tc('logout')}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button onClick={() => setMobileOpen(true)} variant="ghost" size="icon" className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800" aria-expanded={isMobileOpen} aria-label={tc('navMenu')}>
                                <Menu className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" />
                        <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.3 }} className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs bg-slate-950 border-r border-slate-800 p-6 shadow-2xl md:hidden overflow-y-auto" role="navigation" aria-label="Navigation mobile">
                            <div className="flex items-center gap-3 mb-8">
                                {tenantLogo ? (
                                    <img src={tenantLogo} alt={tenantName} className="h-10 w-10 rounded-xl object-cover shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                                ) : (
                                    <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                        H
                                    </div>
                                )}
                                <div>
                                    <span className="font-bold text-xl text-white block">{t('mySpace')}</span>
                                    <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-widest">{user?.tenantSubdomain || 'Harmony'}</span>
                                </div>
                            </div>

                            <nav className="space-y-1">
                                {employeeMenu.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                                            <item.icon className="h-5 w-5" />
                                            {item.label}
                                        </Link>
                                    );
                                })}

                                {/* Documents group */}
                                <div className="pt-3 mt-3 border-t border-slate-800/50">
                                    <p className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <FolderOpen className="h-3.5 w-3.5" />
                                        {t('documents')}
                                    </p>
                                    {documentsMenu.map((item) => {
                                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                        return (
                                            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                                                <item.icon className="h-5 w-5" />
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Profile */}
                                <div className="pt-3 mt-3 border-t border-slate-800/50">
                                    <Link href={profileItem.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${pathname === profileItem.href ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                                        <profileItem.icon className="h-5 w-5" />
                                        {profileItem.label}
                                    </Link>
                                </div>

                                <div className="pt-4 mt-4 border-t border-slate-800/50">
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-red-500 hover:text-red-400 hover:bg-red-500/10">
                                        <LogOut className="h-5 w-5" />
                                        {tc('logout')}
                                    </button>
                                </div>
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <main id="main-content" className="flex-1 overflow-x-hidden pt-8 pb-16" role="main">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
