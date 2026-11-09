import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Contact } from '@/components/Contact';
import { Education } from '@/components/Education';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { RevealObserver } from '@/components/RevealObserver';
import { Tools } from '@/components/Tools';
import { Where } from '@/components/Where';
import { site } from '@/lib/site';

type Props = {
  params: Promise<{ locale: string }>;
};

type ToolGroups = Record<string, { title: string; items: string[] }>;

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tPerson = await getTranslations('Person');
  const tMeta = await getTranslations('Metadata');
  const tTools = await getTranslations('Tools');
  const groups = tTools.raw('groups') as ToolGroups;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${site.url}/#person`,
    name: site.name,
    givenName: site.givenName,
    familyName: site.familyName,
    url: `${site.url}/${locale}`,
    email: `mailto:${site.email}`,
    jobTitle: tPerson('jobTitle'),
    description: tMeta('description'),
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Guadalajara',
      addressRegion: 'Jalisco',
      addressCountry: 'MX',
    },
    affiliation: {
      '@type': 'CollegeOrUniversity',
      name: 'Tecnológico de Monterrey',
      url: 'https://tec.mx',
    },
    award: tPerson('award'),
    knowsLanguage: [
      { '@type': 'Language', name: 'Spanish', alternateName: 'es' },
      { '@type': 'Language', name: 'English', alternateName: 'en' },
    ],
    knowsAbout: Object.values(groups).flatMap((group) => group.items),
    sameAs: [site.github, site.linkedin],
  };

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Where />
        <Tools />
        <Education />
        <Contact />
      </main>
      <Footer />
      <RevealObserver />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </>
  );
}
