import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      'https://instabid-mvp.lucasbgn-affiliate.chatgpt.site',
  ),
  title: 'Instabid — Dispute atenção. Suba no ranking.',
  description: 'O ranking patrocinado onde negócios, produtos e creators disputam atenção com lances transparentes.',
  openGraph: {
    title: 'Instabid — Dispute atenção. Suba no ranking.',
    description: 'O ranking patrocinado onde negócios, produtos e creators disputam atenção com lances transparentes.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Instabid — Dispute atenção. Suba no ranking.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Instabid — Dispute atenção. Suba no ranking.',
    description: 'O ranking patrocinado onde negócios, produtos e creators disputam atenção com lances transparentes.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
