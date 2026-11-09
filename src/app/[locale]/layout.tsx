import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { site, themeScript } from '@/lib/site';
import '../globals.css';

// Inter solo se descarga donde no existe San Francisco (Windows, Android, Linux).
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
});

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const title = t('title');
  const description = t('description');

  return {
    metadataBase: new URL(site.url),
    title,
    description,
    applicationName: site.domain,
    authors: [{ name: site.name, url: site.url }],
    creator: site.name,
    keywords: [site.name, 'kscc.tech', 'Computer Science', 'Full-stack', 'TypeScript', 'Next.js', 'Tecnológico de Monterrey', 'Guadalajara'],
    alternates: {
      canonical: `/${locale}`,
      languages: { es: '/es', en: '/en', 'x-default': '/' },
    },
    openGraph: {
      type: 'profile',
      url: `/${locale}`,
      siteName: site.domain,
      title,
      description,
      locale: locale === 'es' ? 'es_MX' : 'en_US',
      alternateLocale: locale === 'es' ? ['en_US'] : ['es_MX'],
      firstName: site.givenName,
      lastName: site.familyName,
      username: site.githubUser,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: { index: true, follow: true },
    formatDetection: { email: false, telephone: false, address: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-canvas text-ink antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
