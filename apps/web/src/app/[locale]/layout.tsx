import { Plus_Jakarta_Sans, Outfit, Noto_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { AuthProvider } from "@/components/providers";
import { Toaster } from "sonner";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const fontClass = locale === 'ar'
    ? `${notoArabic.variable} ${plusJakarta.variable} ${outfit.variable}`
    : `${plusJakarta.variable} ${outfit.variable}`;

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${fontClass} antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
            <Toaster
              position={dir === 'rtl' ? 'top-left' : 'top-right'}
              richColors
              closeButton
              toastOptions={{
                style: { fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-sans)' },
              }}
            />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
