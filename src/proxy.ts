import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Todo excepto /api, /_next, /_vercel y archivos con extensión (sitemap.xml, robots.txt, icon.svg…)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
