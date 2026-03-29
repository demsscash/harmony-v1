'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const toggleLocale = () => {
        const next = locale === 'fr' ? 'ar' : 'fr';
        router.replace(pathname, { locale: next });
    };

    return (
        <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-full text-xs font-bold transition-all text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 bg-slate-900"
            title={locale === 'fr' ? 'العربية' : 'Français'}
        >
            <Globe className="h-3.5 w-3.5" />
            <span>{locale === 'fr' ? 'عر' : 'FR'}</span>
        </button>
    );
}
