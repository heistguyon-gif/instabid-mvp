'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Market = 'br' | 'world';
type BoardItem = {
  id: string;
  rank: number;
  name: string;
  handle: string;
  description: string;
  destinationUrl: string;
  category: string;
  bid: string;
  clicks: string;
  move: string;
  tone: string;
};

const fallbackBoards: Record<Market, BoardItem[]> = {
  br: [
    { id: 'br-nexoflow', rank: 1, name: 'NexoFlow', handle: '@nexoflow.app', description: 'Publique e acompanhe conteúdo profissional em escala.', destinationUrl: 'https://instagram.com/nexoflow.app', category: 'Ferramentas', bid: 'R$ 480', clicks: '1.284', move: '+2', tone: 'sunset' },
    { id: 'br-atlas', rank: 2, name: 'Clube Atlas', handle: '@clubeatlas.br', description: 'Comunidade para creators construindo negócios digitais.', destinationUrl: 'https://instagram.com/clubeatlas.br', category: 'Criadores', bid: 'R$ 390', clicks: '946', move: '-1', tone: 'violet' },
    { id: 'br-marca', rank: 3, name: 'Marca em Jogo', handle: '@marcaemjogo', description: 'Estratégia de marca para quem vende pela internet.', destinationUrl: 'https://instagram.com/marcaemjogo', category: 'Serviços', bid: 'R$ 270', clicks: '721', move: '+4', tone: 'pink' },
    { id: 'br-creatoros', rank: 4, name: 'CreatorOS', handle: '@creatoros.br', description: 'Operação simples para creators profissionais.', destinationUrl: 'https://instagram.com/creatoros.br', category: 'Ferramentas', bid: 'R$ 190', clicks: '508', move: '—', tone: 'blue' },
    { id: 'br-neblina', rank: 5, name: 'Loja Neblina', handle: '@loj_neblina', description: 'Produtos autorais em pequenas coleções.', destinationUrl: 'https://instagram.com/loj_neblina', category: 'Marcas', bid: 'R$ 120', clicks: '364', move: '+1', tone: 'orange' },
  ],
  world: [
    { id: 'world-orbit', rank: 1, name: 'Orbit Tools', handle: '@orbit.tools', description: 'Tiny tools for ambitious internet businesses.', destinationUrl: 'https://instagram.com/orbit.tools', category: 'Tools', bid: '$320', clicks: '1,108', move: '+3', tone: 'sunset' },
    { id: 'world-luna', rank: 2, name: 'Made by Luna', handle: '@madebyluna', description: 'A creator-led studio for thoughtful digital products.', destinationUrl: 'https://instagram.com/madebyluna', category: 'Creators', bid: '$255', clicks: '879', move: '-1', tone: 'violet' },
    { id: 'world-tiny', rank: 3, name: 'Tiny Launch', handle: '@tinylaunch', description: 'Launch small products with a focused audience.', destinationUrl: 'https://instagram.com/tinylaunch', category: 'Products', bid: '$180', clicks: '644', move: '+1', tone: 'pink' },
    { id: 'world-prompt', rank: 4, name: 'Prompt Club', handle: '@promptclub', description: 'Practical AI workflows for creative teams.', destinationUrl: 'https://instagram.com/promptclub', category: 'Communities', bid: '$96', clicks: '401', move: '—', tone: 'blue' },
    { id: 'world-north', rank: 5, name: 'North Studio', handle: '@northstudio', description: 'Brand and web work for independent founders.', destinationUrl: 'https://instagram.com/northstudio', category: 'Studios', bid: '$72', clicks: '295', move: '+2', tone: 'orange' },
  ],
};

const copy = {
  br: {
    nav: ['Ranking', 'Categorias', 'Como funciona'],
    online: 'online', visitors: 'visitantes desde o lançamento', stats: 'ver dados',
    claim: 'Assuma o #1 por', spots: 'Novas posições começam em R$ 19.',
    explainer: 'Um valor menor ainda coloca você no ranking, na melhor posição disponível.',
    input: 'URL do produto ou @perfil', choose: 'Escolha uma categoria', action: 'Entrar na disputa',
    already: 'Já está na lista? Use o mesmo perfil e aumente seu lance.',
    periods: ['Histórico', 'Hoje', 'Esta semana'], categoryTabs: ['Todos', 'Criadores', 'Marcas', 'Ferramentas', 'Serviços'],
    clicks: 'cliques', details: 'ver detalhes', activity: 'Atividade recente', showMore: 'Mostrar mais',
    joined: 'entrou na posição', minutes: 'há 12 minutos', sponsored: 'ranking patrocinado',
    visit: 'Visitar projeto', challenge: 'Superar esta posição', close: 'Fechar',
    modalTitle: 'Coloque seu projeto na disputa.', modalBody: 'Envie os dados para análise. Depois da aprovação, você recebe as instruções para o primeiro boost.',
    name: 'Nome do projeto', handle: 'Perfil do Instagram', description: 'Descrição curta', url: 'Link de destino',
    email: 'E-mail de contato', category: 'Categoria', submit: 'Enviar para análise', sending: 'Enviando…',
    successTitle: 'Projeto recebido.', successBody: 'Vamos verificar o perfil e o link antes de liberar a participação.',
    error: 'Não foi possível enviar. Confira os campos e tente novamente.',
    footer: 'Posições patrocinadas. Cliques mensurados. Sem promessa de vendas ou retorno financeiro.',
  },
  world: {
    nav: ['Leaderboard', 'Categories', 'How it works'],
    online: 'online', visitors: 'visitors since launch', stats: 'see stats',
    claim: 'Claim #1 for', spots: 'New spots start at $5.',
    explainer: 'A smaller amount still puts you on the board at the best available position.',
    input: 'Your product URL or @handle', choose: 'Choose a category', action: 'Enter the race',
    already: 'Already listed? Use the same handle and raise your bid.',
    periods: ['All-time', 'Today', 'This week'], categoryTabs: ['All', 'Creators', 'Brands', 'Tools', 'Services'],
    clicks: 'clicks', details: 'see details', activity: 'Latest activity', showMore: 'Show more',
    joined: 'joined at', minutes: '12 minutes ago', sponsored: 'sponsored ranking',
    visit: 'Visit project', challenge: 'Beat this position', close: 'Close',
    modalTitle: 'Put your project in the race.', modalBody: 'Submit the details for review. Once approved, you receive instructions for your first boost.',
    name: 'Project name', handle: 'Instagram profile', description: 'Short description', url: 'Destination link',
    email: 'Contact email', category: 'Category', submit: 'Submit for review', sending: 'Sending…',
    successTitle: 'Project received.', successBody: 'We will review the profile and link before enabling participation.',
    error: 'We could not submit it. Check the fields and try again.',
    footer: 'Sponsored positions. Measured clicks. No promise of sales or financial return.',
  },
};

const tones = ['sunset', 'violet', 'pink', 'blue', 'orange'];

function currency(amountMinor: number, code: string, market: Market) {
  return new Intl.NumberFormat(market === 'br' ? 'pt-BR' : 'en-US', {
    style: 'currency', currency: code, maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}

export default function Home() {
  const [market, setMarket] = useState<Market>('br');
  const [period, setPeriod] = useState(0);
  const [category, setCategory] = useState(0);
  const [remoteBoards, setRemoteBoards] = useState<Partial<Record<Market, BoardItem[]>>>({});
  const [selected, setSelected] = useState<BoardItem | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [submission, setSubmission] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [topBid, setTopBid] = useState(499);
  const text = copy[market];
  const board = useMemo(() => remoteBoards[market] ?? fallbackBoards[market], [market, remoteBoards]);
  const displayedBid = market === 'br' ? `R$ ${topBid}` : `$${topBid}`;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/leaderboard?market=${market}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: { listings: Array<Record<string, unknown>> }) => {
        const items = payload.listings.map((item, index) => ({
          id: String(item.id), rank: index + 1, name: String(item.name), handle: String(item.handle),
          description: String(item.description), destinationUrl: String(item.destinationUrl), category: String(item.category),
          bid: currency(Number(item.totalMinor), String(item.currency), market),
          clicks: new Intl.NumberFormat(market === 'br' ? 'pt-BR' : 'en-US').format(Number(item.clicks)),
          move: index === 0 ? '+2' : index === 1 ? '-1' : index === 2 ? '+4' : '—', tone: tones[index % tones.length],
        }));
        if (items.length) setRemoteBoards((current) => ({ ...current, [market]: items }));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [market]);

  function chooseMarket(next: Market) {
    setMarket(next); setSelected(null); setSubmission('idle'); setTopBid(next === 'br' ? 499 : 99);
  }

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmission('sending');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/listings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ market, ...Object.fromEntries(form.entries()) }),
    }).catch(() => null);
    setSubmission(response?.ok ? 'success' : 'error');
  }

  return (
    <main className="site-shell" id="top">
      <header className="topbar">
        <a className="brand-plate" href="#top" aria-label="Instabid home">
          <span className="brand-emblem"><img src="/logo-emblem.png" alt="" /></span>
          <span className="brand-name">Instabid</span>
        </a>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <a href="#ranking">{text.nav[0]}</a><a href="#categorias">{text.nav[1]}</a><a href="#como-funciona">{text.nav[2]}</a>
        </nav>
        <div className="market-switch" aria-label="Escolha o mercado">
          <button className={market === 'br' ? 'active' : ''} onClick={() => chooseMarket('br')} type="button">BR</button>
          <button className={market === 'world' ? 'active' : ''} onClick={() => chooseMarket('world')} type="button">WORLD</button>
        </div>
      </header>

      <div className="page-column">
        <section className="live-summary">
          <span className="online-dot" /><strong>42 {text.online}</strong><span>·</span><span>18.420 {text.visitors}</span><a href="#ranking">{text.stats} →</a>
        </section>

        <section className="bid-hero" id="como-funciona">
          <div className="period-switch" aria-label="Período do ranking">
            {text.periods.map((item, index) => <button className={period === index ? 'active' : ''} key={item} onClick={() => setPeriod(index)} type="button">{index === 0 && '♛ '}{item}</button>)}
          </div>
          <div className="claim-line">
            <h1>{text.claim}</h1>
            <button aria-label="Diminuir lance" onClick={() => setTopBid((value) => Math.max(market === 'br' ? 19 : 5, value - (market === 'br' ? 10 : 5)))} type="button">−</button>
            <strong>{displayedBid}</strong>
            <button aria-label="Aumentar lance" onClick={() => setTopBid((value) => value + (market === 'br' ? 10 : 5))} type="button">+</button>
          </div>
          <p><b>{text.spots}</b> {text.explainer}</p>
          <div className="quick-entry">
            <label><span>◎</span><input aria-label={text.input} placeholder={text.input} /></label>
            <label><span>◇</span><select aria-label={text.choose} defaultValue=""><option value="" disabled>{text.choose}</option><option>Creators</option><option>Brands</option><option>Tools</option><option>Products</option><option>Services</option></select></label>
            <button onClick={() => setJoinOpen(true)} type="button">{text.action}<span>↗</span></button>
          </div>
          <small>{text.already}</small>
        </section>

        <section className="ranking" id="ranking">
          <div className="category-tabs" id="categorias">
            {text.categoryTabs.map((item, index) => <button className={category === index ? 'active' : ''} key={item} onClick={() => setCategory(index)} type="button"><i>{['▦', '◉', '◆', '⌁', '✦'][index]}</i>{item}</button>)}
          </div>

          <div className="ranking-list">
            {board.map((item, index) => (
              <div key={item.id}>
                <article className={`ranking-card ${index < 3 ? `podium podium-${index + 1}` : 'compact'}`} onClick={() => setSelected(item)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') setSelected(item); }}>
                  <div className="rank-chip">#{item.rank}</div>
                  <div className={`avatar ${item.tone}`}>{item.name.slice(0, 1)}</div>
                  <div className="project-copy">
                    <strong>{item.name}</strong>
                    <p>{item.description}</p>
                    <div className="meta-line"><span>{item.handle}</span><span>◇ {item.category}</span><b><i /> {item.clicks} {text.clicks}</b></div>
                  </div>
                  <div className="bid-value">{item.bid}</div>
                  <button className="detail-trigger" onClick={(event) => { event.stopPropagation(); setSelected(item); }} type="button">{text.details} →</button>
                </article>
                {index === 2 && (
                  <aside className="activity-card">
                    <div className="activity-title"><i /> <b>{text.activity}</b></div>
                    <div className="activity-line"><span className="mini-avatar">N</span><p><b>@nuvem.studio</b><br />{text.joined} <strong>#8 · {market === 'br' ? 'R$ 54' : '$12'}</strong><small>{text.minutes}</small></p></div>
                    <button type="button">{text.showMore}</button>
                  </aside>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="final-cta">
          <span className="cta-emblem"><img src="/logo-emblem.png" alt="" /></span>
          <div><small>{text.sponsored}</small><h2>{market === 'br' ? 'Seu projeto pode ser o próximo líder.' : 'Your project could lead next.'}</h2></div>
          <button onClick={() => setJoinOpen(true)} type="button">{text.action} ↗</button>
        </section>
      </div>

      <footer><a className="footer-brand" href="#top">Instabid</a><p>{text.footer}</p><span>BR / WORLD · 2026</span></footer>

      {selected && (
        <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
          <aside className="detail-panel" aria-label={selected.name}>
            <button className="close-button" onClick={() => setSelected(null)} type="button">{text.close} ×</button>
            <div className={`detail-avatar ${selected.tone}`}>{selected.name.slice(0, 1)}</div>
            <p className="detail-rank">#{selected.rank} · {selected.category}</p><h3>{selected.name}</h3><span className="detail-handle">{selected.handle}</span><p>{selected.description}</p>
            <div className="detail-stats"><div><small>boost</small><b>{selected.bid}</b></div><div><small>{text.clicks}</small><b>{selected.clicks}</b></div></div>
            <p className="sponsor-disclosure">◎ {text.sponsored}</p>
            <a className="detail-link" href={`/go/${selected.id}`} target="_blank" rel="sponsored noopener">{text.visit}<span>↗</span></a>
            <button className="detail-challenge" onClick={() => { setSelected(null); setJoinOpen(true); }} type="button">{text.challenge}<span>→</span></button>
          </aside>
        </div>
      )}

      {joinOpen && (
        <div className="overlay form-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setJoinOpen(false); }}>
          <section className="join-modal" aria-modal="true" role="dialog" aria-labelledby="join-title">
            <button className="close-button" onClick={() => setJoinOpen(false)} type="button">{text.close} ×</button>
            {submission === 'success' ? (
              <div className="success-state"><span>✓</span><h3 id="join-title">{text.successTitle}</h3><p>{text.successBody}</p><button onClick={() => setJoinOpen(false)} type="button">OK</button></div>
            ) : (
              <><p className="modal-kicker">{market === 'br' ? 'BR · BRL' : 'WORLD · USD'}</p><h3 id="join-title">{text.modalTitle}</h3><p className="modal-intro">{text.modalBody}</p>
              <form onSubmit={submitListing}>
                <label>{text.name}<input name="name" required minLength={2} maxLength={60} /></label>
                <label>{text.handle}<input name="handle" required placeholder="@seuperfil" pattern="@?[A-Za-z0-9._]{1,30}" /></label>
                <label className="full">{text.description}<textarea name="description" required minLength={12} maxLength={220} rows={3} /></label>
                <label>{text.url}<input name="destinationUrl" required type="url" placeholder="https://" /></label>
                <label>{text.email}<input name="contactEmail" required type="email" /></label>
                <label className="full">{text.category}<select name="category" required defaultValue=""><option value="" disabled>—</option><option>Creators</option><option>Products</option><option>Tools</option><option>Brands</option><option>Services</option><option>Communities</option></select></label>
                {submission === 'error' && <p className="form-error">{text.error}</p>}
                <button className="submit-button full" disabled={submission === 'sending'} type="submit">{submission === 'sending' ? text.sending : text.submit}<span>↗</span></button>
              </form></>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
