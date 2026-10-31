import { absoluteUrl } from '@/lib/links';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/login'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
