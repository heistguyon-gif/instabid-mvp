'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { BrandMark } from '@/components/BrandMark';

type Market = 'br' | 'world';
type RankingPeriod = 'week' | 'today' | 'all';
type CategoryCode = 'All' | 'Creators' | 'Brands' | 'Tools' | 'Services';
type BoardItem = {
  id: string; rank: number; name: string; handle: string; description: string;
  destinationUrl: string; category: string; bid: string; clicks: string;
  totalMinor: number; currency: string; tone: string;
};
type BoardMeta = { activeListings: number; totalClicks: number; generatedAt: string; dataMode: 'demo' | 'pilot' };
type PaymentView = {
  id: string; status: string; amountMinor: number; currency: string;
  pixCopyPaste: string | null; expiresAt: string | null;
};
type CheckoutPreview = { name: string; handle: string; amountMinor: number };

const fallbackBoards: Record<Market, BoardItem[]> = {
  br: [
    { id: 'br-nexoflow', rank: 1, name: 'NexoFlow', handle: '@nexoflow.app', description: 'Publique e acompanhe conteúdo profissional em escala.', destinationUrl: 'https://instagram.com/nexoflow.app', category: 'Tools', bid: 'R$ 480', clicks: '1.284', totalMinor: 48000, currency: 'BRL', tone: 'sunset' },
    { id: 'br-atlas', rank: 2, name: 'Clube Atlas', handle: '@clubeatlas.br', description: 'Comunidade para creators construindo negócios digitais.', destinationUrl: 'https://instagram.com/clubeatlas.br', category: 'Creators', bid: 'R$ 390', clicks: '946', totalMinor: 39000, currency: 'BRL', tone: 'violet' },
    { id: 'br-marca', rank: 3, name: 'Marca em Jogo', handle: '@marcaemjogo', description: 'Estratégia de marca para quem vende pela internet.', destinationUrl: 'https://instagram.com/marcaemjogo', category: 'Services', bid: 'R$ 270', clicks: '721', totalMinor: 27000, currency: 'BRL', tone: 'pink' },
    { id: 'br-creatoros', rank: 4, name: 'CreatorOS', handle: '@creatoros.br', description: 'Operação simples para creators profissionais.', destinationUrl: 'https://instagram.com/creatoros.br', category: 'Tools', bid: 'R$ 190', clicks: '508', totalMinor: 19000, currency: 'BRL', tone: 'blue' },
    { id: 'br-neblina', rank: 5, name: 'Loja Neblina', handle: '@loj_neblina', description: 'Produtos autorais em pequenas coleções.', destinationUrl: 'https://instagram.com/loj_neblina', category: 'Brands', bid: 'R$ 120', clicks: '364', totalMinor: 12000, currency: 'BRL', tone: 'orange' },
  ],
  world: [
    { id: 'world-orbit', rank: 1, name: 'Orbit Tools', handle: '@orbit.tools', description: 'Tiny tools for ambitious internet businesses.', destinationUrl: 'https://instagram.com/orbit.tools', category: 'Tools', bid: '$320', clicks: '1,108', totalMinor: 32000, currency: 'USD', tone: 'sunset' },
    { id: 'world-luna', rank: 2, name: 'Made by Luna', handle: '@madebyluna', description: 'A creator-led studio for thoughtful digital products.', destinationUrl: 'https://instagram.com/madebyluna', category: 'Creators', bid: '$255', clicks: '879', totalMinor: 25500, currency: 'USD', tone: 'violet' },
    { id: 'world-tiny', rank: 3, name: 'Tiny Launch', handle: '@tinylaunch', description: 'Launch small products with a focused audience.', destinationUrl: 'https://instagram.com/tinylaunch', category: 'Products', bid: '$180', clicks: '644', totalMinor: 18000, currency: 'USD', tone: 'pink' },
    { id: 'world-prompt', rank: 4, name: 'Prompt Club', handle: '@promptclub', description: 'Practical AI workflows for creative teams.', destinationUrl: 'https://instagram.com/promptclub', category: 'Communities', bid: '$96', clicks: '401', totalMinor: 9600, currency: 'USD', tone: 'blue' },
    { id: 'world-north', rank: 5, name: 'North Studio', handle: '@northstudio', description: 'Brand and web work for independent founders.', destinationUrl: 'https://instagram.com/northstudio', category: 'Services', bid: '$72', clicks: '295', totalMinor: 7200, currency: 'USD', tone: 'orange' },
  ],
};

const copy = {
  br: {
    nav: ['Ranking', 'Regras', 'Como funciona'], projects: 'projetos no ranking', measured: 'cliques mensurados', updated: 'atualizado agora',
    demo: 'Ambiente demonstrativo: projetos e números atuais são exemplos. Dados reais entram no piloto.',
    claim: 'Assuma o #1 por', spots: 'Novas posições começam em R$ 19.', explainer: 'Um valor menor ainda coloca você na melhor posição que ele alcançar.',
    input: 'URL do produto ou @perfil', choose: 'Escolha uma categoria', action: 'Entrar na disputa',
    already: 'Já está na lista? Use o mesmo perfil e adicione apenas o boost que quiser.',
    periods: { week: 'Esta semana', today: 'Últimas 24h', all: 'Histórico' }, categories: { All: 'Todos', Creators: 'Criadores', Brands: 'Marcas', Tools: 'Ferramentas', Services: 'Serviços' },
    clicks: 'cliques válidos', details: 'ver detalhes', rulesTitle: 'Ranking verificável, não caixa-preta',
    rule1: 'Só pagamento confirmado altera posição.', rule2: 'Empate favorece quem chegou primeiro.', rule3: 'Cliques repetidos e robôs não entram na contagem.',
    sponsored: 'posição patrocinada', visit: 'Visitar projeto', challenge: 'Superar esta posição', page: 'Abrir página pública', close: 'Fechar',
    modalTitle: 'Entre no ranking em 2 passos.', modalBody: 'Primeiro escolha como seu perfil aparece. Depois informe apenas os dados necessários para gerar o Pix.',
    name: 'Nome do projeto', handle: 'Perfil do Instagram', description: 'Descrição curta', url: 'Link de destino', email: 'E-mail de contato', category: 'Categoria', intended: 'Boost pretendido (R$)',
    submit: 'Gerar Pix', sending: 'Gerando Pix…', successTitle: 'Pagamento confirmado.', successBody: 'Seu boost entrou no ranking. A nova posição já está sendo atualizada.',
    previewTitle: 'Este é o preview da Vercel.', previewBody: 'A inscrição não foi salva aqui. Use a versão funcional do Sites enquanto conectamos um banco compartilhado.',
    error: 'Não foi possível enviar. Use URL https, evite encurtadores e confira todos os campos.', empty: 'Nenhum projeto nesta categoria ainda.',
    footer: 'Posições patrocinadas. Cliques filtrados. Sem promessa de vendas, seguidores ou retorno financeiro.', legal: ['Regras', 'Privacidade', 'Sobre'],
  },
  world: {
    nav: ['Leaderboard', 'Rules', 'How it works'], projects: 'projects on the board', measured: 'measured clicks', updated: 'updated now',
    demo: 'Demo environment: current projects and numbers are examples. Real data starts with the pilot.',
    claim: 'Claim #1 for', spots: 'New spots start at $5.', explainer: 'A smaller amount still lands at the best position it can reach.',
    input: 'Your product URL or @handle', choose: 'Choose a category', action: 'Enter the race',
    already: 'Already listed? Use the same profile; after verification, you pay only the increment.',
    periods: { week: 'This week', today: 'Last 24h', all: 'All-time' }, categories: { All: 'All', Creators: 'Creators', Brands: 'Brands', Tools: 'Tools', Services: 'Services' },
    clicks: 'valid clicks', details: 'see details', rulesTitle: 'A verifiable board, not a black box',
    rule1: 'Only confirmed payments change rank.', rule2: 'Ties favor whoever got there first.', rule3: 'Repeat clicks and bots are not counted.',
    sponsored: 'sponsored position', visit: 'Visit project', challenge: 'Beat this position', page: 'Open public page', close: 'Close',
    modalTitle: 'Put your project in the race.', modalBody: 'During the pilot, submit your project and intended amount. We review ownership and destination before charging anything.',
    name: 'Project name', handle: 'Instagram profile', description: 'Short description', url: 'Destination link', email: 'Contact email', category: 'Category', intended: 'Intended boost ($)',
    submit: 'Submit for review', sending: 'Sending…', successTitle: 'Project received.', successBody: 'We will verify the profile and link. No payment has been charged.',
    previewTitle: 'This is the Vercel preview.', previewBody: 'This submission was not saved. Use the functional Sites version while we connect a shared database.',
    error: 'We could not submit it. Use an https URL, avoid shorteners, and check every field.', empty: 'No project in this category yet.',
    footer: 'Sponsored positions. Filtered clicks. No promise of sales, followers, or financial return.', legal: ['Rules', 'Privacy', 'About'],
  },
};

const tones = ['sunset', 'violet', 'pink', 'blue', 'orange'];
const categoryCodes: CategoryCode[] = ['All', 'Creators', 'Brands', 'Tools', 'Services'];
const categoryAliases: Record<string, string> = { Criadores: 'Creators', Marcas: 'Brands', Ferramentas: 'Tools', Serviços: 'Services', Comunidades: 'Communities', Produtos: 'Products' };

function currency(amountMinor: number, code: string, market: Market) {
  return new Intl.NumberFormat(market === 'br' ? 'pt-BR' : 'en-US', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(amountMinor / 100);
}

function localizedCategory(category: string, market: Market) {
  if (market === 'world') return categoryAliases[category] ?? category;
  return ({ Creators: 'Criadores', Brands: 'Marcas', Tools: 'Ferramentas', Products: 'Produtos', Services: 'Serviços', Communities: 'Comunidades' } as Record<string, string>)[categoryAliases[category] ?? category] ?? category;
}

export default function Home() {
  const [market, setMarket] = useState<Market>('br');
  const [period, setPeriod] = useState<RankingPeriod>('week');
  const [category, setCategory] = useState<CategoryCode>('All');
  const [remoteBoards, setRemoteBoards] = useState<Record<string, BoardItem[]>>({});
  const [boardMeta, setBoardMeta] = useState<Record<string, BoardMeta>>({});
  const [selected, setSelected] = useState<BoardItem | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [submission, setSubmission] = useState<'idle' | 'sending' | 'payment' | 'paid' | 'success' | 'preview' | 'error'>('idle');
  const [payment, setPayment] = useState<PaymentView | null>(null);
  const [qrImage, setQrImage] = useState('');
  const [copied, setCopied] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [quickInput, setQuickInput] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [formSeed, setFormSeed] = useState({ handle: '', url: '', category: '', boostMajor: 19, requestKey: '' });
  const [bidMinor, setBidMinor] = useState(49000);
  const text = copy[market];
  const boardKey = `${market}:${period}`;
  const board = remoteBoards[boardKey] ?? fallbackBoards[market];
  const meta = boardMeta[boardKey] ?? { activeListings: board.length, totalClicks: board.reduce((sum, item) => sum + Number(item.clicks.replace(/\D/g, '')), 0), generatedAt: '', dataMode: 'demo' as const };
  const incrementMinor = market === 'br' ? 1000 : 100;
  const minBoostMinor = market === 'br' ? 1900 : 500;
  const visibleBoard = useMemo(() => category === 'All' ? board : board.filter((item) => (categoryAliases[item.category] ?? item.category) === category), [board, category]);
  const paymentId = payment?.id;
  const paymentStatus = payment?.status;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/leaderboard?market=${market}&period=${period}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ listings: Array<Record<string, unknown>>; meta: BoardMeta }> : Promise.reject())
      .then((payload) => {
        const items = payload.listings.map((item, index) => ({
          id: String(item.id), rank: index + 1, name: String(item.name), handle: String(item.handle), description: String(item.description),
          destinationUrl: String(item.destinationUrl), category: String(item.category), totalMinor: Number(item.totalMinor), currency: String(item.currency),
          bid: currency(Number(item.totalMinor), String(item.currency), market), clicks: new Intl.NumberFormat(market === 'br' ? 'pt-BR' : 'en-US').format(Number(item.clicks)), tone: tones[index % tones.length],
        }));
        if (items.length) setRemoteBoards((current) => ({ ...current, [boardKey]: items }));
        setBoardMeta((current) => ({ ...current, [boardKey]: payload.meta }));
        if (items.length) setBidMinor(Math.max(market === 'br' ? 1900 : 500, items[0].totalMinor + (market === 'br' ? 1000 : 100)));
      }).catch(() => undefined);
    return () => controller.abort();
  }, [market, period, boardKey, refreshNonce]);

  useEffect(() => {
    if (!payment?.pixCopyPaste) return;
    let active = true;
    QRCode.toDataURL(payment.pixCopyPaste, { width: 260, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#17185b', light: '#ffffff' } })
      .then((url) => { if (active) setQrImage(url); })
      .catch(() => setQrImage(''));
    return () => { active = false; };
  }, [payment?.pixCopyPaste]);

  useEffect(() => {
    if (submission !== 'payment' || !paymentId || paymentStatus !== 'pending') return;
    let active = true;
    const check = async () => {
      const response = await fetch(`/api/payments/${encodeURIComponent(paymentId)}`, { cache: 'no-store' }).catch(() => null);
      if (!response?.ok || !active) return;
      const payload = await response.json() as { payment?: PaymentView };
      if (!payload.payment) return;
      setPayment(payload.payment);
      if (payload.payment.status === 'confirmed') {
        setSubmission('paid');
        setRemoteBoards({});
        setRefreshNonce((value) => value + 1);
      }
    };
    const timer = window.setInterval(check, 4_000);
    void check();
    return () => { active = false; window.clearInterval(timer); };
  }, [submission, paymentId, paymentStatus]);

  function chooseMarket(next: Market) {
    const nextIncrement = next === 'br' ? 1000 : 100;
    setMarket(next); setBidMinor(fallbackBoards[next][0].totalMinor + nextIncrement); setSelected(null); setSubmission('idle'); setPayment(null); setCheckoutStep(1); setCategory('All'); setQuickCategory('');
  }

  function openJoin(targetMinor = bidMinor) {
    const value = quickInput.trim();
    const isHandle = value.startsWith('@');
    const handle = isHandle ? value : '';
    const url = isHandle ? `https://instagram.com/${value.slice(1)}` : value.startsWith('https://') ? value : '';
    setFormSeed({ handle, url, category: quickCategory, boostMajor: targetMinor / 100, requestKey: crypto.randomUUID() });
    setPayment(null); setQrImage(''); setCopied(false); setCheckoutStep(1); setCheckoutPreview(null); setErrorMessage(''); setSubmission('idle'); setJoinOpen(true);
  }

  function continueToPayment(form: HTMLFormElement) {
    const fields = [...form.querySelectorAll('[data-checkout-step="project"] input, [data-checkout-step="project"] select')];
    for (const field of fields) {
      if ((field instanceof HTMLInputElement || field instanceof HTMLSelectElement) && !field.reportValidity()) return;
    }
    const data = new FormData(form);
    const amountMinor = Math.round(Number(data.get('requestedBoostMajor')) * 100);
    setCheckoutPreview({ name: String(data.get('name') ?? ''), handle: String(data.get('handle') ?? ''), amountMinor });
    setErrorMessage('');
    setCheckoutStep(2);
    window.setTimeout(() => form.querySelector<HTMLInputElement>('[name="buyerName"]')?.focus(), 0);
  }

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmission('sending');
    const form = new FormData(event.currentTarget);
    const requestedBoostMinor = Math.round(Number(form.get('requestedBoostMajor')) * 100);
    const fields = Object.fromEntries(form.entries());
    const rawHandle = String(form.get('handle') ?? '').trim();
    const normalizedHandle = rawHandle.replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, '').split(/[/?#]/)[0].replace(/^@/, '');
    const destinationUrl = `https://instagram.com/${normalizedHandle}`;
    const projectName = String(form.get('name') ?? '').trim();
    const description = `Conheça ${projectName} (@${normalizedHandle}) no Instagram.`;
    const endpoint = market === 'br' ? '/api/checkout/pix' : '/api/listings';
    const urlParams = new URLSearchParams(window.location.search);
    const tracking = Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ttclid', 'gclid', 'src', 'sck']
      .flatMap((key) => urlParams.get(key) ? [[key, urlParams.get(key) as string]] : []));
    const body = market === 'br'
      ? {
          ...fields,
          market,
          handle: `@${normalizedHandle}`,
          destinationUrl,
          description,
          requestedBoostMinor,
          idempotencyKey: formSeed.requestKey,
          contactEmail: form.get('contactEmail'),
          buyer: { name: form.get('buyerName'), email: form.get('contactEmail'), document: form.get('document') },
          tracking,
        }
      : { market, ...fields, requestedBoostMinor };
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
    const payload = await response?.json().catch(() => ({})) as { error?: string; listing?: { status?: string }; payment?: PaymentView } | undefined;
    if (!response?.ok) {
      const messages: Record<string, string> = {
        invalid_fields: 'Revise o @perfil, o CPF e o e-mail informado.',
        duplicate_handle: 'Esse perfil já está no ranking. Em breve você poderá adicionar um novo boost pelo próprio card.',
        rate_limited: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.',
        payment_provider_unavailable: 'A BravoPay não conseguiu gerar o Pix agora. Tente novamente em instantes.',
      };
      setErrorMessage(messages[payload?.error ?? ''] ?? 'Não foi possível gerar o Pix agora. Tente novamente.');
      setSubmission('error');
      return;
    }
    if (market === 'br' && payload?.payment) {
      setPayment(payload.payment);
      setSubmission(payload.payment.status === 'confirmed' ? 'paid' : 'payment');
      return;
    }
    setSubmission(payload?.listing?.status === 'preview_only' ? 'preview' : 'success');
  }

  async function copyPix() {
    if (!payment?.pixCopyPaste) return;
    try {
      await navigator.clipboard.writeText(payment.pixCopyPaste);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="site-shell" id="top">
      <header className="topbar">
        <a className="brand-plate" href="#top" aria-label="Instabid home"><BrandMark /></a>
        <nav className="desktop-nav" aria-label="Navegação principal"><a href="#ranking">{text.nav[0]}</a><a href="/rules">{text.nav[1]}</a><a href="#como-funciona">{text.nav[2]}</a></nav>
        <div className="market-switch" aria-label="Escolha o mercado"><button className={market === 'br' ? 'active' : ''} onClick={() => chooseMarket('br')} type="button">BR</button><button className={market === 'world' ? 'active' : ''} onClick={() => chooseMarket('world')} type="button">WORLD</button></div>
      </header>

      <div className="page-column">
        <section className="live-summary"><span className="online-dot" /><strong>{meta.activeListings} {text.projects}</strong><span>·</span><span>{new Intl.NumberFormat(market === 'br' ? 'pt-BR' : 'en-US').format(meta.totalClicks)} {text.measured}</span><a href="#ranking">{text.updated} ↻</a></section>
        {meta.dataMode === 'demo' && <p className="demo-disclosure">{text.demo}</p>}

        <section className="bid-hero" id="como-funciona">
          <div className="period-switch" aria-label="Período do ranking">{(['week', 'today', 'all'] as RankingPeriod[]).map((value) => <button className={period === value ? 'active' : ''} key={value} onClick={() => setPeriod(value)} type="button">{value === 'week' && '♛ '}{text.periods[value]}</button>)}</div>
          <div className="claim-line"><h1>{text.claim}</h1><button aria-label="Diminuir lance" onClick={() => setBidMinor((value) => Math.max(minBoostMinor, value - incrementMinor))} type="button">−</button><strong>{currency(bidMinor, market === 'br' ? 'BRL' : 'USD', market)}</strong><button aria-label="Aumentar lance" onClick={() => setBidMinor((value) => value + incrementMinor)} type="button">+</button></div>
          <p><b>{text.spots}</b> {text.explainer}</p>
          <div className="quick-entry"><label><span>◎</span><input aria-label={text.input} onChange={(event) => setQuickInput(event.target.value)} placeholder={text.input} value={quickInput} /></label><label><span>◇</span><select aria-label={text.choose} onChange={(event) => setQuickCategory(event.target.value)} value={quickCategory}><option value="" disabled>{text.choose}</option><option value="Creators">{localizedCategory('Creators', market)}</option><option value="Brands">{localizedCategory('Brands', market)}</option><option value="Tools">{localizedCategory('Tools', market)}</option><option value="Products">{localizedCategory('Products', market)}</option><option value="Services">{localizedCategory('Services', market)}</option></select></label><button onClick={() => openJoin()} type="button">{text.action}<span>↗</span></button></div>
          <small>{text.already}</small>
        </section>

        <section className="ranking" id="ranking">
          <div className="category-tabs" id="categorias">{categoryCodes.map((code, index) => <button className={category === code ? 'active' : ''} key={code} onClick={() => setCategory(code)} type="button"><i>{['▦', '◉', '◆', '⌁', '✦'][index]}</i>{text.categories[code]}</button>)}</div>
          <div className="ranking-list">
            {!visibleBoard.length && <p className="empty-board">{text.empty}</p>}
            {visibleBoard.map((item, index) => <article className={`ranking-card ${index < 3 ? `podium podium-${index + 1}` : 'compact'}`} key={item.id} onClick={() => setSelected(item)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') setSelected(item); }}><div className="rank-chip">#{item.rank}</div><div className={`avatar ${item.tone}`}>{item.name.slice(0, 1)}</div><div className="project-copy"><strong>{item.name}</strong><p>{item.description}</p><div className="meta-line"><span>{item.handle}</span><span>◇ {localizedCategory(item.category, market)}</span><b><i /> {item.clicks} {text.clicks}</b></div></div><div className="bid-value">{item.bid}</div><button className="detail-trigger" onClick={(event) => { event.stopPropagation(); setSelected(item); }} type="button">{text.details} →</button><button className="rank-challenge" onClick={(event) => { event.stopPropagation(); openJoin(item.totalMinor + incrementMinor); }} type="button">{market === 'br' ? 'Superar por' : 'Beat for'} {currency(item.totalMinor + incrementMinor, item.currency, market)}</button></article>)}
          </div>
        </section>

        <section className="rules-strip" aria-label={text.rulesTitle}><div><b>01</b><span>{text.rule1}</span></div><div><b>02</b><span>{text.rule2}</span></div><div><b>03</b><span>{text.rule3}</span></div><a href="/rules">{text.rulesTitle} →</a></section>

        <section className="final-cta"><span className="cta-emblem"><Image src="/logo-emblem.png" alt="" width={92} height={92} /></span><div><small>{text.sponsored}</small><h2>{market === 'br' ? 'Seu projeto pode liderar a próxima temporada.' : 'Your project could lead the next season.'}</h2></div><button onClick={() => openJoin()} type="button">{text.action} ↗</button></section>
      </div>

      <footer><a className="footer-brand" href="#top">Instabid</a><p>{text.footer}</p><nav><a href="/rules">{text.legal[0]}</a><a href="/privacy">{text.legal[1]}</a><a href="/about">{text.legal[2]}</a></nav></footer>

      {selected && <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}><aside className="detail-panel" aria-label={selected.name}><button className="close-button" onClick={() => setSelected(null)} type="button">{text.close} ×</button><div className={`detail-avatar ${selected.tone}`}>{selected.name.slice(0, 1)}</div><p className="detail-rank">#{selected.rank} · {localizedCategory(selected.category, market)}</p><h3>{selected.name}</h3><span className="detail-handle">{selected.handle}</span><p>{selected.description}</p><div className="detail-stats"><div><small>boost</small><b>{selected.bid}</b></div><div><small>{text.clicks}</small><b>{selected.clicks}</b></div></div><p className="sponsor-disclosure">◎ {text.sponsored}</p><a className="detail-link" href={`/go/${selected.id}`} target="_blank" rel="sponsored noopener noreferrer">{text.visit}<span>↗</span></a><a className="public-page-link" href={`/participant/${selected.id}`}>{text.page}<span>→</span></a><button className="detail-challenge" onClick={() => { setSelected(null); openJoin(selected.totalMinor + incrementMinor); }} type="button">{text.challenge}<span>→</span></button></aside></div>}

      {joinOpen && <div className="overlay form-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setJoinOpen(false); }}>
        <section className="join-modal" aria-modal="true" role="dialog" aria-labelledby="join-title">
          <button className="close-button" onClick={() => setJoinOpen(false)} type="button">{text.close} ×</button>
          {submission === 'paid' || submission === 'success' || submission === 'preview' ? <div className="success-state">
            <span>{submission === 'preview' ? '!' : '✓'}</span>
            <h3 id="join-title">{submission === 'preview' ? text.previewTitle : text.successTitle}</h3>
            <p>{submission === 'preview' ? text.previewBody : text.successBody}</p>
            <button onClick={() => { setJoinOpen(false); if (submission === 'paid') window.location.hash = 'ranking'; }} type="button">{submission === 'paid' ? 'Ver ranking' : 'OK'}</button>
          </div> : submission === 'payment' && payment ? <div className="pix-state">
            <p className={`payment-status ${payment.status}`}>{payment.status === 'failed' ? 'Pix expirado' : '● Aguardando confirmação'}</p>
            <h3 id="join-title">Pague {currency(payment.amountMinor, 'BRL', 'br')}</h3>
            <p className="modal-intro">Escaneie o QR Code ou copie o código Pix. Sua posição entra automaticamente após a confirmação.</p>
            {payment.status === 'failed' ? <div className="pix-expired">Esta cobrança expirou. Gere um novo Pix para entrar na disputa.</div> : <>
              <div className="pix-qr">{qrImage ? <Image src={qrImage} alt="QR Code Pix para pagamento" width={260} height={260} unoptimized /> : <span>Gerando QR Code…</span>}</div>
              <div className="pix-copy"><span>{payment.pixCopyPaste}</span><button onClick={copyPix} type="button">{copied ? 'Copiado!' : 'Copiar Pix'}</button></div>
              <small className="pix-note">Confirmação automática e segura pela BravoPay. Não feche esta tela até o pagamento ser reconhecido.</small>
            </>}
            <button className="pix-back" onClick={() => { setPayment(null); setSubmission('idle'); setFormSeed((current) => ({ ...current, requestKey: crypto.randomUUID() })); }} type="button">{payment.status === 'failed' ? 'Gerar novo Pix' : 'Voltar e revisar'}</button>
          </div> : <>
            <p className="modal-kicker">{market === 'br' ? 'BR · PIX · BRAVOPAY' : 'WORLD · USD'} · {text.sponsored}</p>
            <h3 id="join-title">{text.modalTitle}</h3>
            <p className="modal-intro">{text.modalBody}</p>
            <form className="checkout-form" key={`${formSeed.handle}:${formSeed.url}:${formSeed.category}:${formSeed.boostMajor}:${formSeed.requestKey}`} onSubmit={submitListing}>
              {market === 'br' ? <>
                <div className="checkout-progress full" aria-label={`Etapa ${checkoutStep} de 2`}><span className={checkoutStep === 1 ? 'active' : 'done'}><b>1</b> Perfil e lance</span><i /><span className={checkoutStep === 2 ? 'active' : ''}><b>2</b> Gerar Pix</span></div>

                <div className={`checkout-step full ${checkoutStep === 1 ? 'active' : ''}`} data-checkout-step="project">
                  <label className="full">Perfil do Instagram<input defaultValue={formSeed.handle || formSeed.url} name="handle" required placeholder="@seuperfil" maxLength={80} autoCapitalize="none" autoCorrect="off" /></label>
                  <div className="checkout-row">
                    <label>Nome no ranking<input name="name" required minLength={2} maxLength={60} placeholder="Sua marca ou projeto" /></label>
                    <label>{text.category}<select defaultValue={formSeed.category} name="category" required><option value="" disabled>Selecione</option><option value="Creators">Criadores</option><option value="Products">Produtos</option><option value="Tools">Ferramentas</option><option value="Brands">Marcas</option><option value="Services">Serviços</option><option value="Communities">Comunidades</option></select></label>
                  </div>
                  <label className="boost-field">Seu lance <span>mínimo R$ 19</span><div><b>R$</b><input defaultValue={formSeed.boostMajor} min={minBoostMinor / 100} max={999999} name="requestedBoostMajor" required step="1" type="number" inputMode="numeric" /></div></label>
                  <p className="checkout-hint">Você entra imediatamente na melhor posição que esse valor alcançar.</p>
                  <button className="submit-button" onClick={(event) => { if (event.currentTarget.form) continueToPayment(event.currentTarget.form); }} type="button">Continuar para o Pix <span>→</span></button>
                </div>

                <div className={`checkout-step full ${checkoutStep === 2 ? 'active' : ''}`} data-checkout-step="payment">
                  <div className="checkout-summary"><div><small>Você está impulsionando</small><strong>{checkoutPreview?.name || 'Seu perfil'} <span>{checkoutPreview?.handle}</span></strong></div><b>{currency(checkoutPreview?.amountMinor || 1900, 'BRL', 'br')}</b></div>
                  <p className="payment-data-title">Dados para gerar o Pix <span>Pagamento seguro pela BravoPay</span></p>
                  <label className="full">Nome completo<input autoComplete="name" name="buyerName" required minLength={5} placeholder="Como aparece no CPF" /></label>
                  <div className="checkout-row">
                    <label>CPF ou CNPJ<input autoComplete="off" inputMode="numeric" name="document" required placeholder="Somente números" /></label>
                    <label>E-mail para confirmação<input autoComplete="email" name="contactEmail" required type="email" placeholder="voce@email.com" /></label>
                  </div>
                  {submission === 'error' && <p className="form-error">{errorMessage}</p>}
                  <p className="form-disclosure">Seu perfil só sobe após o pagamento ser confirmado. Se outra pessoa superar seu lance depois, não há reembolso automático.</p>
                  <div className="checkout-actions"><button className="checkout-back" onClick={() => { setSubmission('idle'); setErrorMessage(''); setCheckoutStep(1); }} type="button">← Voltar</button><button className="submit-button" disabled={submission === 'sending'} type="submit">{submission === 'sending' ? text.sending : `Gerar Pix de ${currency(checkoutPreview?.amountMinor || 1900, 'BRL', 'br')}`}<span>↗</span></button></div>
                </div>
              </> : <>
                <label>{text.name}<input name="name" required minLength={2} maxLength={60} /></label>
                <label>{text.handle}<input defaultValue={formSeed.handle} name="handle" required placeholder="@yourprofile" pattern="@?[A-Za-z0-9._]{1,30}" /></label>
                <label className="full">{text.description}<textarea name="description" required minLength={12} maxLength={220} rows={3} /></label>
                <label>{text.url}<input defaultValue={formSeed.url} name="destinationUrl" required type="url" placeholder="https://" /></label>
                <label>{text.email}<input name="contactEmail" required type="email" /></label>
                <label>{text.intended}<input defaultValue={formSeed.boostMajor} min={minBoostMinor / 100} max={999999} name="requestedBoostMajor" required step="1" type="number" /></label>
                <label>{text.category}<select defaultValue={formSeed.category} name="category" required><option value="" disabled>—</option><option value="Creators">{localizedCategory('Creators', market)}</option><option value="Products">{localizedCategory('Products', market)}</option><option value="Tools">{localizedCategory('Tools', market)}</option><option value="Brands">{localizedCategory('Brands', market)}</option><option value="Services">{localizedCategory('Services', market)}</option><option value="Communities">{localizedCategory('Communities', market)}</option></select></label>
                {submission === 'error' && <p className="form-error">{errorMessage || text.error}</p>}
                <p className="form-disclosure full">Submitting does not charge you. Rank changes only after approval and confirmed payment.</p>
                <button className="submit-button full" disabled={submission === 'sending'} type="submit">{submission === 'sending' ? text.sending : text.submit}<span>↗</span></button>
              </>}
            </form>
          </>}
        </section>
      </div>}
    </main>
  );
}
