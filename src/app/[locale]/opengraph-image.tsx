import { ImageResponse } from 'next/og';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import en from '../../../messages/en.json';
import es from '../../../messages/es.json';

export const alt = 'Karlo Sebastián Cadena Cota · kscc.tech';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const messages = { es, en };

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const hero = messages[locale].Hero;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px 88px',
          background: '#000000',
          color: '#f5f5f7',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, color: '#2997ff' }}>kscc.tech</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 84, lineHeight: 1.05, letterSpacing: '-0.02em' }}>{hero.name}</div>
          <div style={{ display: 'flex', marginTop: 32, fontSize: 36, lineHeight: 1.3, color: '#f5f5f7' }}>{hero.role}</div>
          <div style={{ display: 'flex', fontSize: 36, lineHeight: 1.3, color: '#a1a1a6' }}>{hero.focus}</div>
        </div>
      </div>
    ),
    size,
  );
}
