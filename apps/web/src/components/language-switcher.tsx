'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Globe } from 'lucide-react';

const languages = [
    { code: 'fr', label: 'FR', name: 'Français' },
    { code: 'ar', label: 'عر', name: 'العربية' },
    { code: 'zh', label: '中', name: '中文' },
] as const;

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const current = languages.find((l) => l.code === locale) ?? languages[0];

    const switchLocale = (code: string) => {
        router.replace(pathname, { locale: code });
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-full text-xs font-bold transition-all text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 bg-slate-900"
                title={current.name}
            >
                <Globe className="h-3.5 w-3.5" />
                <span>{current.label}</span>
            </button>
            {open && (
                <div className="absolute right-0 mt-1 w-36 rounded-lg border border-slate-700 bg-slate-900 shadow-lg z-50 py-1">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => switchLocale(lang.code)}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-800 transition-colors ${
                                locale === lang.code
                                    ? 'text-white font-semibold'
                                    : 'text-slate-400'
                            }`}
                        >
                            <span>{lang.name}</span>
                            <span className="text-xs opacity-60">{lang.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
