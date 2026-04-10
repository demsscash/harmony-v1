'use client';

import * as React from 'react';
import { useAuthStore } from '../store/authStore';
import { useRouter, usePathname } from '@/i18n/routing';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [hasHydrated, setHasHydrated] = React.useState(false);

    // Wait for Zustand persist to rehydrate from localStorage
    React.useEffect(() => {
        const unsub = useAuthStore.persist.onFinishHydration(() => {
            setHasHydrated(true);
        });
        // If already hydrated (fast path)
        if (useAuthStore.persist.hasHydrated()) {
            setHasHydrated(true);
        }
        return () => unsub();
    }, []);

    React.useEffect(() => {
        if (!hasHydrated) return;

        const publicPages = ['/login', '/forgot-password', '/reset-password'];
        const isPublicPage = publicPages.some(p => pathname.startsWith(p));

        if (!isAuthenticated && !isPublicPage) {
            router.push('/login');
        }

        if (isAuthenticated && pathname === '/login') {
            if (user?.role === 'EMPLOYEE') {
                router.push('/employee');
            } else {
                router.push('/dashboard');
            }
        }

        if (isAuthenticated && user?.role === 'EMPLOYEE' && pathname.startsWith('/dashboard')) {
            router.push('/employee');
        }

        if (isAuthenticated && user?.role !== 'EMPLOYEE' && pathname.startsWith('/employee')) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, user, pathname, router, hasHydrated]);

    // Block rendering until Zustand has rehydrated — prevents flash of protected content
    const publicPages = ['/login', '/forgot-password', '/reset-password'];
    const isPublicPage = publicPages.some(p => pathname.startsWith(p));

    if (!hasHydrated && !isPublicPage) {
        return (
            <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center">
                <div className="h-8 w-8 rounded-lg bg-blue-600 animate-pulse" />
            </div>
        );
    }

    return <>{children}</>;
}
