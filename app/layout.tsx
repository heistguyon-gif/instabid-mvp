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
  title: 'Instabid — A atenção está em disputa',
  description: 'Ranking patrocinado e transparente para negócios e creators disputarem atenção em tempo real.',
  openGraph: {
    title: 'Instabid — A atenção está em disputa',
    description: 'Ranking patrocinado e transparente para negócios e creators disputarem atenção em tempo real.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Instabid — A atenção está em disputa' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Instabid — A atenção está em disputa',
    description: 'Ranking patrocinado e transparente para negócios e creators disputarem atenção em tempo real.',
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
