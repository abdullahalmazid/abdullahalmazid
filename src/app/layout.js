import Providers from '@/components/layout/Providers';
import seed from '@/data/seed';
import { fontsHref, modeBootScript, themeVars } from '@/lib/themes';
import { personJsonLd, SITE_URL } from '@/lib/seo';
import './globals.css';

const { site, person } = seed.config;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${site.title} · ${site.tagline}`, template: `%s | ${site.title}` },
  description: site.description,
  keywords: site.keywords,
  authors: [{ name: person.name, url: SITE_URL }],
  creator: person.name,
  icons: { icon: '/favicon.svg' },
  alternates: { canonical: '/', types: { 'application/rss+xml': [{ url: '/rss.xml', title: `${site.title} · Writing` }] } },
  openGraph: { type: 'website', siteName: site.title, title: `${site.title} · ${site.tagline}`, description: site.description, url: SITE_URL, images: person.photo ? [{ url: person.photo, alt: person.name }] : [] },
  twitter: { card: 'summary_large_image', title: site.title, description: site.description, images: person.photo ? [person.photo] : [] },
  robots: { index: true, follow: true },
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  // The bundled theme is written into the HTML so the first paint is already
  // styled; the saved theme replaces it as soon as it loads.
  return (
    <html lang={site.language || 'en'} style={themeVars(seed.config.theme)} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link id="aam-fonts" rel="stylesheet" href={fontsHref(seed.config.theme.fonts)} />
        {/* Dark-mode visitors get the dark theme before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: modeBootScript(seed.config.theme) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
