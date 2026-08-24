import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListingById } from '@/db/runtime';
import { BrandMark } from '@/components/BrandMark';

type PageProps = { params: Promise<{ id: string }> };

function amount(value: unknown, currency: unknown, market: unknown) {
  return new Intl.NumberFormat(market === 'br' ? 'pt-BR' : 'en-US', { style: 'currency', currency: String(currency), maximumFractionDigits: 0 }).format(Number(value) / 100);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return { title: 'Projeto não encontrado — Instabid' };
  const title = `${String(listing.name)} — Instabid`;
  const description = String(listing.description);
  return { title, description, openGraph: { title, description, type: 'website', images: [] }, twitter: { card: 'summary', title, description, images: [] } };
}

export default async function ParticipantPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();
  const isBr = listing.marketCode === 'br';
  return <main className="site-shell"><header className="topbar"><Link className="brand-plate" href="/"><BrandMark /></Link><nav className="desktop-nav"><Link href="/">Ranking</Link><Link href="/rules">Regras</Link><Link href="/about">Sobre</Link></nav><Link className="content-back" href="/">← {isBr ? 'Voltar' : 'Back'}</Link></header><article className="participant-page"><section className="participant-hero"><span className="participant-badge">{isBr ? 'Posição patrocinada' : 'Sponsored position'}</span><h1>{String(listing.name)}</h1><span className="participant-handle">{String(listing.handle)}</span><p className="participant-description">{String(listing.description)}</p><div className="participant-metrics"><div><small>{isBr ? 'boost confirmado' : 'confirmed boost'}</small><b>{amount(listing.totalMinor, listing.currency, listing.marketCode)}</b></div><div><small>{isBr ? 'cliques válidos' : 'valid clicks'}</small><b>{new Intl.NumberFormat(isBr ? 'pt-BR' : 'en-US').format(Number(listing.clicks))}</b></div></div><div className="participant-actions"><a href={`/go/${id}`} target="_blank" rel="sponsored noopener noreferrer">{isBr ? 'Visitar projeto ↗' : 'Visit project ↗'}</a><Link href="/#como-funciona">{isBr ? 'Entrar na disputa →' : 'Enter the race →'}</Link></div></section><p className="notice">{isBr ? 'O valor pago determina a posição; não representa recomendação editorial. Cliques repetidos e robôs conhecidos são filtrados.' : 'Paid amount determines rank; it is not an editorial endorsement. Repeat clicks and known bots are filtered.'}</p></article></main>;
}
