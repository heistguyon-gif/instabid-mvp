import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';

export function InfoPage({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead: string; children: ReactNode }) {
  return <main className="site-shell"><header className="topbar"><Link className="brand-plate" href="/br"><BrandMark /></Link><nav className="desktop-nav"><Link href="/br">Ranking</Link><Link href="/rules">Regras</Link><Link href="/privacy">Privacidade</Link></nav><Link className="content-back" href="/br">← Voltar</Link></header><article className="content-page"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lead">{lead}</p>{children}</article></main>;
}
