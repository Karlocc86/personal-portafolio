import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // `next dev` genera AGENTS.md para agentes de IA; no es parte del proyecto.
  agentRules: false,
};

export default withNextIntl(nextConfig);
