'use client';

import * as React from 'react';
import { useAuthStore } from '../store/authStore';
import { useRouter, usePathname } from '@/i18n/routing';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [hasMounted, setHasMounted] = React.useState(false);

    // Wait for client-side hydration before checking auth state
    React.useEffect(() => {
        setHasMounted(true);
    }, []);

    React.useEffect(() => {
        if (!hasMounted) return;

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
    }, [isAuthenticated, user, pathname, router, hasMounted]);

    return <>{children}</>;
}
