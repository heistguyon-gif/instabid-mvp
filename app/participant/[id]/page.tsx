import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getListingById } from '@/db/runtime';
import { BrandMark } from '@/components/BrandMark';
import { ShareButton } from '@/components/ShareButton';

type PageProps = { params: Promise<{ id: string }> };

function amount(value: unknown, currency: unknown, market: unknown) {
  return new Intl.NumberFormat(market === 'br' ? 'pt-BR' : 'en-US', { style: 'currency', currency: String(currency), maximumFractionDigits: 0 }).format(Number(value) / 100);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!/^[a-z0-9-]{1,64}$/i.test(id)) return { title: 'Projeto não encontrado — Instabid' };
  const listing = await getListingById(id);
  if (!listing) return { title: 'Projeto não encontrado — Instabid' };
  const title = `${String(listing.handle)} — Instabid`;
  const description = String(listing.description);
  const imageUrl = listing.imageUrl ? String(listing.imageUrl) : null;
  return { title, description, openGraph: { title, description, type: 'website', images: imageUrl ? [{ url: imageUrl, alt: `Foto de ${String(listing.handle)}` }] : [] }, twitter: { card: imageUrl ? 'summary_large_image' : 'summary', title, description, images: imageUrl ? [imageUrl] : [] } };
}

export default async function ParticipantPage({ params }: PageProps) {
  const { id } = await params;
  if (!/^[a-z0-9-]{1,64}$/i.test(id)) notFound();
  const listing = await getListingById(id);
  if (!listing) notFound();
  const isBr = listing.marketCode === 'br';
  const hasConfirmedBid = Number(listing.totalMinor) > 0;
  return <main className="site-shell"><header className="topbar"><Link className="brand-plate" href="/br"><BrandMark /></Link><nav className="desktop-nav"><Link href="/br">Ranking</Link><Link href="/rules">Regras</Link><Link href="/about">Sobre</Link></nav><Link className="content-back" href="/br">← {isBr ? 'Voltar' : 'Back'}</Link></header><article className="participant-page"><section className="participant-hero"><span className="participant-badge">{hasConfirmedBid ? (isBr ? 'Posição patrocinada' : 'Sponsored position') : (isBr ? 'Perfil convidado' : 'Guest profile')}</span>{Boolean(listing.imageUrl) && <Image className="participant-avatar" src={String(listing.imageUrl)} alt={`Foto de ${String(listing.handle)}`} width={94} height={94} unoptimized />}<h1>{String(listing.handle)}</h1><span className="participant-handle">{String(listing.name)}</span><p className="participant-description">{String(listing.description)}</p><div className="participant-metrics"><div><small>{hasConfirmedBid ? (isBr ? 'lance confirmado' : 'confirmed bid') : (isBr ? 'status' : 'status')}</small><b>{hasConfirmedBid ? amount(listing.totalMinor, listing.currency, listing.marketCode) : (isBr ? 'Lance inaugural' : 'First bid open')}</b></div><div><small>{isBr ? 'cliques válidos' : 'valid clicks'}</small><b>{new Intl.NumberFormat(isBr ? 'pt-BR' : 'en-US').format(Number(listing.clicks))}</b></div></div><div className="participant-actions"><a href={`/go/${id}`} target="_blank" rel="sponsored noopener noreferrer">{isBr ? 'Visitar perfil ↗' : 'Visit profile ↗'}</a><Link href="/br#como-funciona">{isBr ? 'Entrar na disputa →' : 'Enter the race →'}</Link><ShareButton label={isBr ? 'Compartilhar ↗' : 'Share ↗'} text={`${String(listing.handle)} está no ranking do Instabid.`} title={`${String(listing.handle)} — Instabid`} /></div></section><p className="notice">{hasConfirmedBid ? (isBr ? 'O valor pago determina a posição; não representa recomendação editorial. Cliques repetidos e robôs conhecidos são filtrados.' : 'Paid amount determines rank; it is not an editorial endorsement. Repeat clicks and known bots are filtered.') : (isBr ? 'Perfil convidado para o lançamento. Ainda não há lance confirmado; qualquer valor exibido após a compra será real e auditável.' : 'Guest launch profile. No bid has been confirmed yet; any amount shown after purchase will be real and auditable.')}</p></article></main>;
}
