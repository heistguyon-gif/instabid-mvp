import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function InfoPage({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead: string; children: ReactNode }) {
  return <main className="site-shell"><header className="topbar"><Link className="brand-plate" href="/"><span className="brand-emblem"><Image src="/logo-emblem.png" alt="" width={57} height={57} /></span><span className="brand-name">Instabid</span></Link><nav className="desktop-nav"><Link href="/">Ranking</Link><Link href="/rules">Regras</Link><Link href="/privacy">Privacidade</Link></nav><Link className="content-back" href="/">← Voltar</Link></header><article className="content-page"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lead">{lead}</p>{children}</article></main>;
}
