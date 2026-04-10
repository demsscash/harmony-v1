import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const publicPages = ['/login', '/forgot-password', '/reset-password'];

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Strip locale prefix to get the actual path
    const locales = routing.locales as readonly string[];
    const pathnameWithoutLocale = locales.some(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`)
        ? pathname.replace(new RegExp(`^/(${locales.join('|')})`), '') || '/'
        : pathname;

    // Check if the page is public
    const isPublicPage = publicPages.some(p => pathnameWithoutLocale.startsWith(p));

    if (!isPublicPage) {
        // Check for accessToken cookie
        const token = request.cookies.get('accessToken')?.value;
        if (!token) {
            // Detect locale from path or use default
            const locale = locales.find(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) || routing.defaultLocale;
            const loginUrl = new URL(`/${locale}/login`, request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: ['/', '/(fr|ar|zh)/:path*', '/((?!_next|_vercel|api|.*\\..*).*)'],
};
