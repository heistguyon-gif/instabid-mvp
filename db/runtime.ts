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
    image_url TEXT,
    contact_email TEXT NOT NULL,
    category TEXT NOT NULL,
    requested_boost_minor INTEGER NOT NULL DEFAULT 0,
    placement_type TEXT NOT NULL DEFAULT 'paid',
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
  `CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    season_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_payment_id TEXT,
    amount_minor INTEGER NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    pix_copy_paste TEXT,
    expires_at TEXT,
    last_checked_at TEXT,
    created_at TEXT NOT NULL,
    confirmed_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_payments_listing_status ON payments (listing_id, status)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_payment ON payments (provider, provider_payment_id)`,
  `CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    received_at TEXT NOT NULL,
    processed_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_processed ON webhook_events (provider, processed_at)`,
  `CREATE TABLE IF NOT EXISTS request_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    expires_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS visit_events (
    visitor_hash TEXT PRIMARY KEY,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_visit_events_last_seen ON visit_events (last_seen_at)`,
];

const demoListings = [
  ['partner-nexoflow', 'br', 'NexoFlow', '@nexoflow.app', 'Gestão e publicação profissional de conteúdo no Instagram.', 'https://instagram.com/nexoflow.app', '/nexoflow-avatar.ico', 'parceiros@instabid.br', 'Tools', '0', 'launch_partner'],
  ['partner-instabid', 'br', 'Instabid', '@instabid.br', 'Perfil oficial da disputa brasileira por atenção.', 'https://instagram.com/instabid.br', '/logo-emblem.png', 'parceiros@instabid.br', 'Communities', '0', 'launch_partner'],
] as const;

const demoBoosts: ReadonlyArray<readonly [string, string, number, string]> = [];

export async function ensureDatabase() {
  if (isVercel) throw new Error('persistent_database_unavailable_in_vercel_preview');
  const db = await getCloudflareDatabase();
  if (initialized) return db;
  await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
  const listingColumns = await db.prepare('PRAGMA table_info(listings)').all<{ name: string }>();
  if (!listingColumns.results.some((column) => column.name === 'requested_boost_minor')) {
    await db.prepare('ALTER TABLE listings ADD COLUMN requested_boost_minor INTEGER NOT NULL DEFAULT 0').run();
  }
  if (!listingColumns.results.some((column) => column.name === 'placement_type')) {
    await db.prepare("ALTER TABLE listings ADD COLUMN placement_type TEXT NOT NULL DEFAULT 'paid'").run();
  }
  if (!listingColumns.results.some((column) => column.name === 'image_url')) {
    await db.prepare('ALTER TABLE listings ADD COLUMN image_url TEXT').run();
  }
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO markets (code, locale, currency, min_boost_minor, status) VALUES ('br', 'pt-BR', 'BRL', 500, 'active')"),
    db.prepare("UPDATE markets SET min_boost_minor = 500 WHERE code = 'br'"),
    db.prepare("INSERT OR IGNORE INTO markets (code, locale, currency, min_boost_minor, status) VALUES ('world', 'en', 'USD', 500, 'active')"),
    db.prepare("INSERT OR IGNORE INTO seasons (id, market_code, label, starts_at, ends_at, status) VALUES ('br-s34', 'br', 'Semana 34', '2026-08-17T03:00:00.000Z', '2026-08-24T02:59:59.000Z', 'active')"),
    db.prepare("INSERT OR IGNORE INTO seasons (id, market_code, label, starts_at, ends_at, status) VALUES ('world-s34', 'world', 'Week 34', '2026-08-17T00:00:00.000Z', '2026-08-24T00:00:00.000Z', 'active')"),
    db.prepare("UPDATE listings SET image_url = '/nexoflow-avatar.ico' WHERE id = 'partner-nexoflow'"),
    db.prepare("UPDATE listings SET image_url = '/logo-emblem.png' WHERE id = 'partner-instabid'"),
  ]);

  for (const [id, market, name, handle, description, url, imageUrl, email, category, clicks, placementType] of demoListings) {
    await db.prepare(`INSERT OR IGNORE INTO listings
      (id, market_code, name, handle, description, destination_url, image_url, contact_email, category, placement_type, status, click_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, '2026-08-24T04:30:00.000Z')`)
      .bind(id, market, name, handle, description, url, imageUrl, email, category, placementType, Number(clicks)).run();
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

function currentWeek(market: 'br' | 'world') {
  const offsetMinutes = market === 'br' ? -180 : 0;
  const shifted = new Date(Date.now() + offsetMinutes * 60_000);
  const daysSinceMonday = (shifted.getUTCDay() + 6) % 7;
  const localStartMs = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() - daysSinceMonday);
  const start = new Date(localStartMs - offsetMinutes * 60_000);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dateKey = new Date(localStartMs).toISOString().slice(0, 10);
  return {
    id: `${market}-${dateKey}`,
    label: market === 'br' ? `Semana de ${dateKey}` : `Week of ${dateKey}`,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
  };
}

async function getActiveSeason(db: D1Database, market: 'br' | 'world') {
  const now = new Date().toISOString();
  const active = await db.prepare(`SELECT id, label, starts_at AS startsAt, ends_at AS endsAt
    FROM seasons WHERE market_code = ? AND status = 'active' AND ends_at > ? ORDER BY ends_at ASC LIMIT 1`)
    .bind(market, now).first<{ id: string; label: string; startsAt: string; endsAt: string }>();
  if (active) return active;
  const week = currentWeek(market);
  await db.batch([
    db.prepare("UPDATE seasons SET status = 'ended' WHERE market_code = ? AND status = 'active'").bind(market),
    db.prepare(`INSERT OR IGNORE INTO seasons (id, market_code, label, starts_at, ends_at, status)
      VALUES (?, ?, ?, ?, ?, 'active')`).bind(week.id, market, week.label, week.startsAt, week.endsAt),
    db.prepare("UPDATE seasons SET status = 'active' WHERE id = ?").bind(week.id),
  ]);
  return week;
}

export type ListingPaymentInput = {
  market: 'br';
  name: string;
  handle: string;
  description: string;
  destinationUrl: string;
  contactEmail: string;
  category: string;
  requestedBoostMinor: number;
};

export async function prepareListingForPayment(input: ListingPaymentInput) {
  if (isVercel) throw new Error('persistent_database_unavailable_in_vercel_preview');
  const db = await ensureDatabase();
  const season = await getActiveSeason(db, 'br');
  const existing = await db.prepare(`SELECT id, status, contact_email AS contactEmail
    FROM listings WHERE market_code = 'br' AND handle = ?`).bind(input.handle).first<{ id: string; status: string; contactEmail: string }>();
  let listingId = existing?.id;
  if (existing && existing.status !== 'active' && existing.contactEmail !== input.contactEmail) throw new Error('duplicate_handle');
  if (!listingId) {
    listingId = crypto.randomUUID();
    await db.prepare(`INSERT INTO listings
      (id, market_code, name, handle, description, destination_url, contact_email, category, requested_boost_minor, status, click_count, created_at)
      VALUES (?, 'br', ?, ?, ?, ?, ?, ?, ?, 'pending_payment', 0, ?)`)
      .bind(listingId, input.name, input.handle, input.description, input.destinationUrl, input.contactEmail,
        input.category, input.requestedBoostMinor, new Date().toISOString()).run();
  } else if (existing?.status !== 'active') {
    await db.prepare(`UPDATE listings SET name = ?, description = ?, destination_url = ?, category = ?,
      requested_boost_minor = ?, status = 'pending_payment' WHERE id = ?`)
      .bind(input.name, input.description, input.destinationUrl, input.category, input.requestedBoostMinor, listingId).run();
  }
  const current = await db.prepare(`SELECT COALESCE(SUM(amount_minor), 0) AS totalMinor
    FROM boosts WHERE listing_id = ? AND season_id = ? AND status = 'confirmed'`)
    .bind(listingId, season.id).first<{ totalMinor: number }>();
  const currentTotalMinor = Number(current?.totalMinor ?? 0);
  if (input.requestedBoostMinor <= currentTotalMinor) throw new Error('boost_too_low');
  return {
    listingId,
    seasonId: season.id,
    currentTotalMinor,
    chargeMinor: input.requestedBoostMinor - currentTotalMinor,
    mayUpdateProfile: !existing || existing.contactEmail === input.contactEmail,
  };
}

function parseAvatarDataUrl(value: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=]+)$/i.exec(value);
  if (!match) throw new Error('invalid_avatar');
  const bytes = Uint8Array.from(atob(match[2]), (character) => character.charCodeAt(0));
  if (!bytes.length || bytes.length > 750_000) throw new Error('invalid_avatar');
  const mime = match[1].toLowerCase();
  const valid = mime === 'image/png'
    ? bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    : mime === 'image/jpeg'
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (!valid) throw new Error('invalid_avatar');
  return { bytes, mime };
}

export async function storeListingAvatar(listingId: string, dataUrl: string) {
  if (isVercel || !dataUrl) return null;
  const { bytes, mime } = parseAvatarDataUrl(dataUrl);
  const runtime = await import('cloudflare:workers') as { env: { FILES: R2Bucket } };
  await runtime.env.FILES.put(`avatars/${listingId}`, bytes, {
    httpMetadata: { contentType: mime, cacheControl: 'public, max-age=31536000, immutable' },
  });
  const imageUrl = `/api/avatar/${listingId}`;
  const db = await ensureDatabase();
  await db.prepare('UPDATE listings SET image_url = ? WHERE id = ?').bind(imageUrl, listingId).run();
  return imageUrl;
}

export type PaymentRecord = {
  id: string;
  listingId: string;
  seasonId: string;
  providerPaymentId: string | null;
  amountMinor: number;
  currency: string;
  status: string;
  pixCopyPaste: string | null;
  expiresAt: string | null;
  lastCheckedAt: string | null;
};

export async function getPayment(id: string) {
  if (isVercel) return null;
  const db = await ensureDatabase();
  return db.prepare(`SELECT id, listing_id AS listingId, season_id AS seasonId,
      provider_payment_id AS providerPaymentId, amount_minor AS amountMinor, currency, status,
      pix_copy_paste AS pixCopyPaste, expires_at AS expiresAt, last_checked_at AS lastCheckedAt
    FROM payments WHERE id = ?`).bind(id).first<PaymentRecord>();
}

export async function createPaymentAttempt(input: {
  id: string; listingId: string; seasonId: string; amountMinor: number;
}) {
  const db = await ensureDatabase();
  await db.prepare(`INSERT OR IGNORE INTO payments
    (id, listing_id, season_id, provider, amount_minor, currency, status, created_at)
    VALUES (?, ?, ?, 'bravopay', ?, 'BRL', 'creating', ?)`)
    .bind(input.id, input.listingId, input.seasonId, input.amountMinor, new Date().toISOString()).run();
  return getPayment(input.id);
}

export async function attachBravopayTransaction(paymentId: string, transaction: {
  id: string; copyPasteCode: string | null; expiresAt: string | null;
}) {
  const db = await ensureDatabase();
  await db.prepare(`UPDATE payments SET provider_payment_id = ?, pix_copy_paste = ?, expires_at = ?, status = 'pending'
    WHERE id = ? AND status IN ('creating', 'pending', 'failed')`)
    .bind(transaction.id, transaction.copyPasteCode, transaction.expiresAt, paymentId).run();
  return getPayment(paymentId);
}

export async function markPaymentFailed(paymentId: string) {
  const db = await ensureDatabase();
  await db.prepare("UPDATE payments SET status = 'failed' WHERE id = ? AND status = 'creating'").bind(paymentId).run();
}

export async function applyVerifiedTransaction(transaction: {
  id: string; status: 'pending' | 'paid' | 'failed' | 'refunded'; amountMinor: number;
  currency: string; method: string; externalReference: string;
}) {
  const db = await ensureDatabase();
  const payment = await db.prepare(`SELECT id, listing_id AS listingId, season_id AS seasonId,
      provider_payment_id AS providerPaymentId, amount_minor AS amountMinor, currency, status
    FROM payments WHERE id = ? OR (provider = 'bravopay' AND provider_payment_id = ?) LIMIT 1`)
    .bind(transaction.externalReference, transaction.id).first<PaymentRecord>();
  if (!payment) throw new Error('payment_not_found');
  if (payment.providerPaymentId && payment.providerPaymentId !== transaction.id) throw new Error('provider_payment_mismatch');
  if (payment.amountMinor !== transaction.amountMinor || payment.currency !== transaction.currency || transaction.method !== 'PIX') {
    throw new Error('payment_amount_mismatch');
  }
  if (transaction.externalReference && transaction.externalReference !== payment.id) throw new Error('payment_reference_mismatch');
  const now = new Date().toISOString();
  if (transaction.status === 'paid') {
    await db.batch([
      db.prepare(`UPDATE payments SET provider_payment_id = ?, status = 'confirmed', confirmed_at = ? WHERE id = ?`)
        .bind(transaction.id, now, payment.id),
      db.prepare(`INSERT OR IGNORE INTO boosts
        (id, listing_id, season_id, provider, provider_payment_id, amount_minor, currency, status, created_at)
        VALUES (?, ?, ?, 'bravopay', ?, ?, ?, 'confirmed', ?)`)
        .bind(`boost-${payment.id}`, payment.listingId, payment.seasonId, transaction.id, payment.amountMinor, payment.currency, now),
      db.prepare("UPDATE listings SET status = 'active', placement_type = 'paid' WHERE id = ?").bind(payment.listingId),
    ]);
  } else if (transaction.status === 'refunded') {
    await db.batch([
      db.prepare("UPDATE payments SET status = 'refunded' WHERE id = ?").bind(payment.id),
      db.prepare("UPDATE boosts SET status = 'refunded' WHERE provider = 'bravopay' AND provider_payment_id = ?").bind(transaction.id),
    ]);
  } else if (transaction.status === 'failed') {
    await db.prepare("UPDATE payments SET status = 'failed' WHERE id = ? AND status != 'confirmed'").bind(payment.id).run();
  }
  return getPayment(payment.id);
}

export async function beginWebhookEvent(id: string, eventType: string) {
  const db = await ensureDatabase();
  await db.prepare(`INSERT OR IGNORE INTO webhook_events (id, provider, event_type, received_at)
    VALUES (?, 'bravopay', ?, ?)`).bind(id, eventType, new Date().toISOString()).run();
  const event = await db.prepare('SELECT processed_at AS processedAt FROM webhook_events WHERE id = ?').bind(id).first<{ processedAt: string | null }>();
  return !event?.processedAt;
}

export async function finishWebhookEvent(id: string) {
  const db = await ensureDatabase();
  await db.prepare('UPDATE webhook_events SET processed_at = ? WHERE id = ?').bind(new Date().toISOString(), id).run();
}

export async function consumeCheckoutRateLimit(visitorKey: string, limit = 5) {
  const db = await ensureDatabase();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  await db.prepare(`INSERT INTO request_limits (key, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN expires_at <= ? THEN 1 ELSE count + 1 END,
      expires_at = CASE WHEN expires_at <= ? THEN excluded.expires_at ELSE expires_at END`)
    .bind(visitorKey, expiresAt, now.toISOString(), now.toISOString()).run();
  const record = await db.prepare('SELECT count FROM request_limits WHERE key = ?').bind(visitorKey).first<{ count: number }>();
  return Number(record?.count ?? limit + 1) <= limit;
}

export async function registerSiteVisit(visitorId: string, userAgent: string) {
  if (isVercel) return;
  const db = await ensureDatabase();
  if (/bot|crawler|spider|preview|headless|facebookexternalhit|twitterbot|whatsapp/i.test(userAgent)) return;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${visitorId}:${userAgent}`));
  const visitorHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const now = new Date().toISOString();
  await db.prepare(`INSERT INTO visit_events (visitor_hash, first_seen_at, last_seen_at) VALUES (?, ?, ?)
    ON CONFLICT(visitor_hash) DO UPDATE SET last_seen_at = excluded.last_seen_at`)
    .bind(visitorHash, now, now).run();
}

export async function getAudienceMetrics() {
  if (isVercel) return { totalVisitors: 0, onlineVisitors: 0 };
  const db = await ensureDatabase();
  const onlineSince = new Date(Date.now() - 5 * 60_000).toISOString();
  const result = await db.prepare(`SELECT COUNT(*) AS totalVisitors,
      SUM(CASE WHEN last_seen_at >= ? THEN 1 ELSE 0 END) AS onlineVisitors
    FROM visit_events`).bind(onlineSince).first<{ totalVisitors: number; onlineVisitors: number }>();
  return { totalVisitors: Number(result?.totalVisitors ?? 0), onlineVisitors: Number(result?.onlineVisitors ?? 0) };
}

export async function takePendingPaymentsForReconciliation(limit = 3) {
  if (isVercel) return [];
  const db = await ensureDatabase();
  const threshold = new Date(Date.now() - 30_000).toISOString();
  const records = await db.prepare(`SELECT id, provider_payment_id AS providerPaymentId
    FROM payments WHERE provider = 'bravopay' AND status = 'pending' AND provider_payment_id IS NOT NULL
      AND (last_checked_at IS NULL OR last_checked_at <= ?)
    ORDER BY created_at ASC LIMIT ?`).bind(threshold, limit).all<{ id: string; providerPaymentId: string }>();
  if (!records.results.length) return [];
  const now = new Date().toISOString();
  await db.batch(records.results.map((record) => db.prepare('UPDATE payments SET last_checked_at = ? WHERE id = ?').bind(now, record.id)));
  return records.results;
}

export type RankingPeriod = 'all' | 'today' | 'week';

export async function getLeaderboard(market: 'br' | 'world', period: RankingPeriod = 'week') {
  if (isVercel) {
    return demoListings
      .filter((listing) => listing[1] === market)
      .map(([id, marketCode, name, handle, description, destinationUrl, imageUrl, , category, clicks, placementType]) => {
        const boost = demoBoosts.find(([listingId]) => listingId === id);
        return {
          id, name, handle, description, destinationUrl, imageUrl, category, clicks: Number(clicks), placementType,
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
  await getActiveSeason(db, market);
  const boostJoin = period === 'all'
    ? "LEFT JOIN boosts b ON b.listing_id = l.id AND b.status = 'confirmed'"
    : period === 'today'
      ? "LEFT JOIN boosts b ON b.listing_id = l.id AND b.status = 'confirmed' AND datetime(b.created_at) >= datetime('now', '-1 day')"
      : "LEFT JOIN boosts b ON b.listing_id = l.id AND b.season_id = s.id AND b.status = 'confirmed'";
  const result = await db.prepare(`SELECT
      l.id, l.name, l.handle, l.description, l.destination_url AS destinationUrl, l.image_url AS imageUrl,
      l.category, l.placement_type AS placementType, l.click_count AS clicks, m.currency, s.id AS seasonId, s.label AS seasonLabel,
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
    const [listingId, marketCode, name, handle, description, destinationUrl, imageUrl, , category, clicks, placementType] = listing;
    const boost = demoBoosts.find(([boostListingId]) => boostListingId === listingId);
    return { id: listingId, marketCode, name, handle, description, destinationUrl, imageUrl, category, placementType, clicks: Number(clicks), totalMinor: boost?.[2] ?? 0, currency: boost?.[3] ?? (marketCode === 'br' ? 'BRL' : 'USD') };
  }
  const db = await ensureDatabase();
  return db.prepare(`SELECT l.id, l.market_code AS marketCode, l.name, l.handle, l.description,
      l.destination_url AS destinationUrl, l.image_url AS imageUrl, l.category, l.placement_type AS placementType, l.click_count AS clicks, m.currency,
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
