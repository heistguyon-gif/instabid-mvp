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
    { id: 'br-nexoflow', rank: 1, name: 'NexoFlow', handle: '@nexoflow.app', description: 'Publique e acompanhe conteúdo profissional em escala.', destinationUrl: 'https://instagram.com/nexoflow.app', category: 'Ferramentas', bid: 'R$ 480', clicks: '1.284', move: '+2', tone: 'lime' },
    { id: 'br-atlas', rank: 2, name: 'Clube Atlas', handle: '@clubeatlas.br', description: 'Comunidade para creators construindo negócios digitais.', destinationUrl: 'https://instagram.com/clubeatlas.br', category: 'Comunidades', bid: 'R$ 390', clicks: '946', move: '-1', tone: 'violet' },
    { id: 'br-marca', rank: 3, name: 'Marca em Jogo', handle: '@marcaemjogo', description: 'Estratégia de marca para quem vende pela internet.', destinationUrl: 'https://instagram.com/marcaemjogo', category: 'Serviços', bid: 'R$ 270', clicks: '721', move: '+4', tone: 'coral' },
    { id: 'br-creatoros', rank: 4, name: 'CreatorOS', handle: '@creatoros.br', description: 'Operação simples para creators profissionais.', destinationUrl: 'https://instagram.com/creatoros.br', category: 'Ferramentas', bid: 'R$ 190', clicks: '508', move: '—', tone: 'blue' },
    { id: 'br-neblina', rank: 5, name: 'Loja Neblina', handle: '@loj_neblina', description: 'Produtos autorais em pequenas coleções.', destinationUrl: 'https://instagram.com/loj_neblina', category: 'Marcas', bid: 'R$ 120', clicks: '364', move: '+1', tone: 'sand' },
  ],
  world: [
    { id: 'world-orbit', rank: 1, name: 'Orbit Tools', handle: '@orbit.tools', description: 'Tiny tools for ambitious internet businesses.', destinationUrl: 'https://instagram.com/orbit.tools', category: 'Tools', bid: '$320', clicks: '1,108', move: '+3', tone: 'lime' },
    { id: 'world-luna', rank: 2, name: 'Made by Luna', handle: '@madebyluna', description: 'A creator-led studio for thoughtful digital products.', destinationUrl: 'https://instagram.com/madebyluna', category: 'Creators', bid: '$255', clicks: '879', move: '-1', tone: 'violet' },
    { id: 'world-tiny', rank: 3, name: 'Tiny Launch', handle: '@tinylaunch', description: 'Launch small products with a focused audience.', destinationUrl: 'https://instagram.com/tinylaunch', category: 'Products', bid: '$180', clicks: '644', move: '+1', tone: 'coral' },
    { id: 'world-prompt', rank: 4, name: 'Prompt Club', handle: '@promptclub', description: 'Practical AI workflows for creative teams.', destinationUrl: 'https://instagram.com/promptclub', category: 'Communities', bid: '$96', clicks: '401', move: '—', tone: 'blue' },
    { id: 'world-north', rank: 5, name: 'North Studio', handle: '@northstudio', description: 'Brand and web work for independent founders.', destinationUrl: 'https://instagram.com/northstudio', category: 'Studios', bid: '$72', clicks: '295', move: '+2', tone: 'sand' },
  ],
};

const copy = {
  br: {
    eyebrow: 'Ranking patrocinado em tempo real', title: 'A atenção está em disputa.',
    body: 'Negócios e creators pagam para subir. Você descobre quem está crescendo — e cada clique fica visível.',
    cta: 'Entrar no ranking', how: 'Como funciona', market: 'Brasil', period: 'Semana 34', ends: 'encerra em 2d 14h',
    leader: 'Desafiar o líder', min: 'A partir de R$ 19', sponsored: 'Posições definidas por boosts confirmados',
    clicks: 'cliques', bid: 'boost', activity: 'agora', paid: 'boost confirmado',
    update: 'acabou de ultrapassar o segundo colocado.', step: 'Adicione seu perfil.',
    stepBody: 'Escolha um valor, confirme o pagamento e suba em tempo real.',
    trust: ['pagamentos confirmados', 'cliques filtrados', 'ranking auditável'],
    detailCta: 'Visitar projeto', detailChallenge: 'Superar esta posição', close: 'Fechar',
    modalTitle: 'Entre na disputa.', modalBody: 'Envie seu projeto para moderação. Depois da aprovação, você recebe o checkout do primeiro boost.',
    name: 'Nome do projeto', handle: 'Perfil do Instagram', description: 'Descrição curta', url: 'Link de destino',
    email: 'E-mail de contato', category: 'Categoria', submit: 'Enviar para análise', sending: 'Enviando…',
    successTitle: 'Recebemos seu projeto.', successBody: 'A equipe vai verificar o perfil e o link antes de liberar o primeiro boost.',
    error: 'Não foi possível enviar. Confira os campos e tente novamente.',
  },
  world: {
    eyebrow: 'Live sponsored leaderboard', title: 'Attention is up for grabs.',
    body: 'Businesses and creators pay to climb. You discover who is rising — and every click stays visible.',
    cta: 'Enter the ranking', how: 'How it works', market: 'World', period: 'Week 34', ends: 'ends in 2d 14h',
    leader: 'Challenge the leader', min: 'Starting at $5', sponsored: 'Positions are set by confirmed boosts',
    clicks: 'clicks', bid: 'boost', activity: 'now', paid: 'confirmed boost',
    update: 'just moved ahead of the second place.', step: 'Add your profile.',
    stepBody: 'Choose an amount, confirm payment and climb in real time.',
    trust: ['confirmed payments', 'filtered clicks', 'auditable ranking'],
    detailCta: 'Visit project', detailChallenge: 'Beat this position', close: 'Close',
    modalTitle: 'Enter the competition.', modalBody: 'Submit your project for review. Once approved, you receive the checkout for your first boost.',
    name: 'Project name', handle: 'Instagram profile', description: 'Short description', url: 'Destination link',
    email: 'Contact email', category: 'Category', submit: 'Submit for review', sending: 'Sending…',
    successTitle: 'We received your project.', successBody: 'The team will review the profile and link before enabling the first boost.',
    error: 'We could not submit it. Check the fields and try again.',
  },
};

const tones = ['lime', 'violet', 'coral', 'blue', 'sand'];

function currency(amountMinor: number, code: string, market: Market) {
  return new Intl.NumberFormat(market === 'br' ? 'pt-BR' : 'en-US', {
    style: 'currency', currency: code, maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}

export default function Home() {
  const [market, setMarket] = useState<Market>('br');
  const [remoteBoards, setRemoteBoards] = useState<Partial<Record<Market, BoardItem[]>>>({});
  const [selected, setSelected] = useState<BoardItem | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [submission, setSubmission] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const text = copy[market];
  const board = useMemo(() => remoteBoards[market] ?? fallbackBoards[market], [market, remoteBoards]);

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
    setMarket(next); setSelected(null); setSubmission('idle');
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
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Instabid home"><span className="brand-mark" aria-hidden="true"><i /><i /></span><span>instabid</span><b>beta</b></a>
        <nav className="market-switch" aria-label="Escolha o mercado">
          <button className={market === 'br' ? 'active' : ''} onClick={() => chooseMarket('br')} type="button">BR</button>
          <button className={market === 'world' ? 'active' : ''} onClick={() => chooseMarket('world')} type="button">WORLD</button>
        </nav>
        <button className="header-cta bare-button" onClick={() => setJoinOpen(true)} type="button">{text.cta}<span>↗</span></button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span />{text.eyebrow}</p><h1>{text.title}</h1><p className="hero-body">{text.body}</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setJoinOpen(true)} type="button">{text.cta}<span>↗</span></button>
            <a className="text-link" href="#como-funciona">{text.how}<span>↓</span></a>
          </div>
          <div className="trust-line">{text.trust.map((item) => <span key={item}>● {item}</span>)}</div>
        </div>
        <aside className="live-card" aria-label="Atividade ao vivo">
          <div className="live-card-top"><span className="live-label"><i /> LIVE</span><span>18s</span></div>
          <div className="crown-row"><span className="rank-burst">#1</span><div><small>NOVO LÍDER</small><strong>{board[0].name}</strong></div></div>
          <p><b>{board[0].handle}</b> {text.update}</p><div className="price-line"><span>{board[0].bid}</span><small>{text.paid}</small></div>
          <button onClick={() => setJoinOpen(true)} type="button">{text.leader}<span>→</span></button>
        </aside>
      </section>

      <section className="leaderboard-section" id="ranking">
        <div className="board-heading"><div><p className="section-kicker">{text.market} · {text.activity}</p><h2>Leaderboard</h2></div><div className="season-pill"><b>{text.period}</b><span>{text.ends}</span></div></div>
        <div className="board-wrap">
          <div className="board-note"><span>◎</span>{text.sponsored}</div>
          <div className="board-table" role="table" aria-label={`Ranking ${text.market}`}>
            {board.map((item) => (
              <article className={`board-row ${item.rank === 1 ? 'leader' : ''}`} key={item.handle} onClick={() => setSelected(item)} role="row" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') setSelected(item); }}>
                <div className="position"><small>POS</small><b>{String(item.rank).padStart(2, '0')}</b></div><div className={`avatar ${item.tone}`}>{item.name.slice(0, 1)}</div>
                <div className="profile"><strong>{item.name}</strong><span>{item.handle}</span></div>
                <div className={`movement ${item.move.startsWith('+') ? 'up' : item.move.startsWith('-') ? 'down' : ''}`}>{item.move}</div>
                <div className="metric"><small>{text.clicks}</small><b>{item.clicks}</b></div><div className="metric bid"><small>{text.bid}</small><b>{item.bid}</b></div>
                <button onClick={(event) => { event.stopPropagation(); setSelected(item); }} type="button" aria-label={`${text.detailCta}: ${item.name}`}>↗</button>
              </article>
            ))}
          </div>
        </div>
        <div className="entry-strip" id="como-funciona"><span className="entry-number">01</span><p><b>{text.step}</b> {text.stepBody}</p><span className="entry-min">{text.min}</span><button onClick={() => setJoinOpen(true)} type="button">{text.cta}<span>↗</span></button></div>
      </section>

      <footer className="site-footer">
        <div className="brand footer-brand"><span className="brand-mark" aria-hidden="true"><i /><i /></span><span>instabid</span></div>
        <p>{market === 'br' ? 'Posições patrocinadas. Sem promessa de vendas, seguidores ou retorno financeiro.' : 'Sponsored positions. No promise of sales, followers or financial return.'}</p>
        <div><a href="#como-funciona">{text.how}</a><button onClick={() => setJoinOpen(true)} type="button">{text.cta}</button></div>
      </footer>

      {selected && (
        <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
          <aside className="detail-panel" aria-label={selected.name}>
            <button className="close-button" onClick={() => setSelected(null)} type="button">{text.close} ×</button>
            <div className={`detail-avatar ${selected.tone}`}>{selected.name.slice(0, 1)}</div><p className="detail-rank">#{selected.rank} · {selected.category}</p>
            <h3>{selected.name}</h3><span className="detail-handle">{selected.handle}</span><p>{selected.description}</p>
            <div className="detail-stats"><div><small>{text.bid}</small><b>{selected.bid}</b></div><div><small>{text.clicks}</small><b>{selected.clicks}</b></div></div>
            <p className="sponsor-disclosure">◎ {text.sponsored}</p>
            <a className="detail-link" href={`/go/${selected.id}`} target="_blank" rel="sponsored noopener">{text.detailCta}<span>↗</span></a>
            <button className="detail-challenge" onClick={() => { setSelected(null); setJoinOpen(true); }} type="button">{text.detailChallenge}<span>→</span></button>
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
