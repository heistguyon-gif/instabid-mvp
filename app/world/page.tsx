import { BrandMark } from '@/components/BrandMark';

export default function WorldPage() {
  return (
    <main className="world-page">
      <header className="topbar">
        <a className="brand-plate" href="/world" aria-label="Instabid World"><BrandMark /></a>
        <div className="market-switch" aria-label="Choose market"><a href="/br">BR</a><a className="active" href="/world">WORLD</a></div>
      </header>
      <section className="world-hold">
        <span className="world-kicker">INSTABID WORLD · USD</span>
        <h1>The global board is coming next.</h1>
        <p>We are validating the mechanics, payments and real traffic in Brazil first. The World leaderboard is separate and is not accepting bids yet.</p>
        <a href="/br">Explore Instabid Brasil <span>→</span></a>
        <small>@instabidworld</small>
      </section>
    </main>
  );
}
