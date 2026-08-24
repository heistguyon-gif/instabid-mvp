let initialized = false;

const isVercel = process.env.VERCEL === '1';

async function getCloudflareDatabase() {
  const runtime = await import('cloudflare:workers') as { env: { DB: D1Database } };
  return runtime.env.DB;
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS markets (
    code TEXT PRIMARY KEY,
    locale TEXT NOT NULL,
    currency TEXT NOT NULL,
    min_boost_minor INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
  )`,
  `CREATE TABLE IF NOT EXISTS seasons (
    id TEXT PRIMARY KEY,
    market_code TEXT NOT NULL,
    label TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
  )`,
  `CREATE INDEX IF NOT EXISTS idx_seasons_market_status ON seasons (market_code, status)`,
  `CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    market_code TEXT NOT NULL,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    description TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    category TEXT NOT NULL,
    requested_boost_minor INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    click_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_listings_market_status ON listings (market_code, status)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_market_handle ON listings (market_code, handle)`,
  `CREATE TABLE IF NOT EXISTS click_events (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    visitor_hash TEXT NOT NULL,
    window_key INTEGER NOT NULL,
    is_counted INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_click_events_listing_created ON click_events (listing_id, created_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_click_events_listing_visitor_window ON click_events (listing_id, visitor_hash, window_key)`,
  `CREATE TABLE IF NOT EXISTS boosts (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    season_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_payment_id TEXT,
    amount_minor INTEGER NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_boosts_season_status ON boosts (season_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_boosts_listing_season ON boosts (listing_id, season_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_boosts_provider_payment ON boosts (provider, provider_payment_id)`,
];

const demoListings = [
  ['br-nexoflow', 'br', 'NexoFlow', '@nexoflow.app', 'Publique e acompanhe conteúdo profissional em escala.', 'https://instagram.com/nexoflow.app', 'demo@instabid.br', 'Tools', '1284'],
  ['br-atlas', 'br', 'Clube Atlas', '@clubeatlas.br', 'Comunidade para creators construindo negócios digitais.', 'https://instagram.com/clubeatlas.br', 'demo@instabid.br', 'Communities', '946'],
  ['br-marca', 'br', 'Marca em Jogo', '@marcaemjogo', 'Estratégia de marca para quem vende pela internet.', 'https://instagram.com/marcaemjogo', 'demo@instabid.br', 'Services', '721'],
  ['br-creatoros', 'br', 'CreatorOS', '@creatoros.br', 'Operação simples para creators profissionais.', 'https://instagram.com/creatoros.br', 'demo@instabid.br', 'Tools', '508'],
  ['br-neblina', 'br', 'Loja Neblina', '@loj_neblina', 'Produtos autorais em pequenas coleções.', 'https://instagram.com/loj_neblina', 'demo@instabid.br', 'Brands', '364'],
  ['world-orbit', 'world', 'Orbit Tools', '@orbit.tools', 'Tiny tools for ambitious internet businesses.', 'https://instagram.com/orbit.tools', 'demo@instabidworld.com', 'Tools', '1108'],
  ['world-luna', 'world', 'Made by Luna', '@madebyluna', 'A creator-led studio for thoughtful digital products.', 'https://instagram.com/madebyluna', 'demo@instabidworld.com', 'Creators', '879'],
  ['world-tiny', 'world', 'Tiny Launch', '@tinylaunch', 'Launch small products with a focused audience.', 'https://instagram.com/tinylaunch', 'demo@instabidworld.com', 'Products', '644'],
  ['world-prompt', 'world', 'Prompt Club', '@promptclub', 'Practical AI workflows for creative teams.', 'https://instagram.com/promptclub', 'demo@instabidworld.com', 'Communities', '401'],
  ['world-north', 'world', 'North Studio', '@northstudio', 'Brand and web work for independent founders.', 'https://instagram.com/northstudio', 'demo@instabidworld.com', 'Studios', '295'],
] as const;

const demoBoosts = [
  ['br-nexoflow', 'br-s34', 48000, 'BRL'], ['br-atlas', 'br-s34', 39000, 'BRL'],
  ['br-marca', 'br-s34', 27000, 'BRL'], ['br-creatoros', 'br-s34', 19000, 'BRL'],
  ['br-neblina', 'br-s34', 12000, 'BRL'], ['world-orbit', 'world-s34', 32000, 'USD'],
  ['world-luna', 'world-s34', 25500, 'USD'], ['world-tiny', 'world-s34', 18000, 'USD'],
  ['world-prompt', 'world-s34', 9600, 'USD'], ['world-north', 'world-s34', 7200, 'USD'],
] as const;

export async function ensureDatabase() {
  if (isVercel) throw new Error('persistent_database_unavailable_in_vercel_preview');
  const db = await getCloudflareDatabase();
  if (initialized) return db;
  await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
  const listingColumns = await db.prepare('PRAGMA table_info(listings)').all<{ name: string }>();
  if (!listingColumns.results.some((column) => column.name === 'requested_boost_minor')) {
    await db.prepare('ALTER TABLE listings ADD COLUMN requested_boost_minor INTEGER NOT NULL DEFAULT 0').run();
  }
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO markets (code, locale, currency, min_boost_minor, status) VALUES ('br', 'pt-BR', 'BRL', 1900, 'active')"),
    db.prepare("INSERT OR IGNORE INTO markets (code, locale, currency, min_boost_minor, status) VALUES ('world', 'en', 'USD', 500, 'active')"),
    db.prepare("INSERT OR IGNORE INTO seasons (id, market_code, label, starts_at, ends_at, status) VALUES ('br-s34', 'br', 'Semana 34', '2026-08-17T03:00:00.000Z', '2026-08-24T02:59:59.000Z', 'active')"),
    db.prepare("INSERT OR IGNORE INTO seasons (id, market_code, label, starts_at, ends_at, status) VALUES ('world-s34', 'world', 'Week 34', '2026-08-17T00:00:00.000Z', '2026-08-24T00:00:00.000Z', 'active')"),
  ]);

  for (const [id, market, name, handle, description, url, email, category, clicks] of demoListings) {
    await db.prepare(`INSERT OR IGNORE INTO listings
      (id, market_code, name, handle, description, destination_url, contact_email, category, status, click_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, '2026-08-20T12:00:00.000Z')`)
      .bind(id, market, name, handle, description, url, email, category, Number(clicks)).run();
    await db.prepare("UPDATE listings SET category = ? WHERE id = ? AND contact_email LIKE 'demo@%'").bind(category, id).run();
  }
  for (const [listingId, seasonId, amount, currency] of demoBoosts) {
    await db.prepare(`INSERT OR IGNORE INTO boosts
      (id, listing_id, season_id, provider, provider_payment_id, amount_minor, currency, status, created_at)
      VALUES (?, ?, ?, 'demo', ?, ?, ?, 'confirmed', '2026-08-22T12:00:00.000Z')`)
      .bind(`boost-${listingId}`, listingId, seasonId, `demo-${listingId}`, amount, currency).run();
  }
  await db.prepare('PRAGMA optimize').run();
  initialized = true;
  return db;
}

export type RankingPeriod = 'all' | 'today' | 'week';

export async function getLeaderboard(market: 'br' | 'world', period: RankingPeriod = 'week') {
  if (isVercel) {
    return demoListings
      .filter((listing) => listing[1] === market)
      .map(([id, marketCode, name, handle, description, destinationUrl, , category, clicks]) => {
        const boost = demoBoosts.find(([listingId]) => listingId === id);
        return {
          id, name, handle, description, destinationUrl, category, clicks: Number(clicks),
          currency: boost?.[3] ?? (marketCode === 'br' ? 'BRL' : 'USD'),
          seasonId: marketCode === 'br' ? 'br-s34' : 'world-s34',
          seasonLabel: marketCode === 'br' ? 'Semana 34' : 'Week 34',
          endsAt: '2026-08-24T02:59:59.000Z', totalMinor: boost?.[2] ?? 0,
          createdAt: '2026-08-20T12:00:00.000Z',
        };
      })
      .sort((a, b) => Number(b.totalMinor) - Number(a.totalMinor));
  }
  const db = await ensureDatabase();
  const boostJoin = period === 'all'
    ? "LEFT JOIN boosts b ON b.listing_id = l.id AND b.status = 'confirmed'"
    : period === 'today'
      ? "LEFT JOIN boosts b ON b.listing_id = l.id AND b.status = 'confirmed' AND datetime(b.created_at) >= datetime('now', '-1 day')"
      : "LEFT JOIN boosts b ON b.listing_id = l.id AND b.season_id = s.id AND b.status = 'confirmed'";
  const result = await db.prepare(`SELECT
      l.id, l.name, l.handle, l.description, l.destination_url AS destinationUrl,
      l.category, l.click_count AS clicks, m.currency, s.id AS seasonId, s.label AS seasonLabel,
      s.ends_at AS endsAt, l.created_at AS createdAt, MAX(b.created_at) AS totalReachedAt,
      COALESCE(SUM(b.amount_minor), 0) AS totalMinor
    FROM listings l
    JOIN markets m ON m.code = l.market_code
    JOIN seasons s ON s.market_code = l.market_code AND s.status = 'active'
    ${boostJoin}
    WHERE l.market_code = ? AND l.status = 'active'
    GROUP BY l.id, s.id
    ORDER BY totalMinor DESC, totalReachedAt ASC, l.created_at ASC
    LIMIT 50`).bind(market).all();
  return result.results;
}

export async function createPendingListing(input: {
  market: 'br' | 'world'; name: string; handle: string; description: string;
  destinationUrl: string; contactEmail: string; category: string; requestedBoostMinor: number;
}) {
  if (isVercel) {
    return { id: crypto.randomUUID(), status: 'preview_only' as const };
  }
  const db = await ensureDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.prepare(`INSERT INTO listings
    (id, market_code, name, handle, description, destination_url, contact_email, category, requested_boost_minor, status, click_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?)`)
    .bind(id, input.market, input.name, input.handle, input.description, input.destinationUrl, input.contactEmail, input.category, input.requestedBoostMinor, now).run();
  return { id, status: 'pending' as const };
}

export async function getListingById(id: string) {
  if (isVercel) {
    const listing = demoListings.find(([listingId]) => listingId === id);
    if (!listing) return null;
    const [listingId, marketCode, name, handle, description, destinationUrl, , category, clicks] = listing;
    const boost = demoBoosts.find(([boostListingId]) => boostListingId === listingId);
    return { id: listingId, marketCode, name, handle, description, destinationUrl, category, clicks: Number(clicks), totalMinor: boost?.[2] ?? 0, currency: boost?.[3] ?? (marketCode === 'br' ? 'BRL' : 'USD') };
  }
  const db = await ensureDatabase();
  return db.prepare(`SELECT l.id, l.market_code AS marketCode, l.name, l.handle, l.description,
      l.destination_url AS destinationUrl, l.category, l.click_count AS clicks, m.currency,
      COALESCE(SUM(b.amount_minor), 0) AS totalMinor
    FROM listings l
    JOIN markets m ON m.code = l.market_code
    LEFT JOIN boosts b ON b.listing_id = l.id AND b.status = 'confirmed'
    WHERE l.id = ? AND l.status = 'active'
    GROUP BY l.id`).bind(id).first<Record<string, unknown>>();
}

export async function registerListingClick(id: string, visitorId: string, userAgent: string) {
  if (isVercel) return;
  const db = await ensureDatabase();
  const windowKey = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
  const isBot = /bot|crawler|spider|preview|headless|facebookexternalhit|twitterbot|whatsapp/i.test(userAgent);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${visitorId}:${id}:${windowKey}`));
  const visitorHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const inserted = await db.prepare(`INSERT OR IGNORE INTO click_events
    (id, listing_id, visitor_hash, window_key, is_counted, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), id, visitorHash, windowKey, isBot ? 0 : 1, new Date().toISOString()).run();
  if (!isBot && Number(inserted.meta.changes ?? 0) > 0) {
    await db.prepare('UPDATE listings SET click_count = click_count + 1 WHERE id = ?').bind(id).run();
  }
}

export async function getListingDestination(id: string) {
  if (isVercel) {
    const listing = demoListings.find(([listingId]) => listingId === id);
    return listing?.[5] ?? null;
  }
  const db = await ensureDatabase();
  const listing = await db.prepare("SELECT destination_url AS destinationUrl FROM listings WHERE id = ? AND status = 'active'")
    .bind(id).first<{ destinationUrl: string }>();
  if (!listing) return null;
  return listing.destinationUrl;
}
