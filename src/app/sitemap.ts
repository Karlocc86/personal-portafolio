import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

const alternates = {
  languages: {
    es: `${site.url}/es`,
    en: `${site.url}/en`,
    'x-default': site.url,
  },
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${site.url}/es`, lastModified, changeFrequency: 'monthly', priority: 1, alternates },
    { url: `${site.url}/en`, lastModified, changeFrequency: 'monthly', priority: 0.9, alternates },
  ];
}
