import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const markets = sqliteTable('markets', {
  code: text('code').primaryKey(),
  locale: text('locale').notNull(),
  currency: text('currency').notNull(),
  minBoostMinor: integer('min_boost_minor').notNull(),
  status: text('status').notNull().default('active'),
});

export const seasons = sqliteTable('seasons', {
  id: text('id').primaryKey(),
  marketCode: text('market_code').notNull(),
  label: text('label').notNull(),
  startsAt: text('starts_at').notNull(),
  endsAt: text('ends_at').notNull(),
  status: text('status').notNull().default('active'),
}, (table) => [index('idx_seasons_market_status').on(table.marketCode, table.status)]);

export const listings = sqliteTable('listings', {
  id: text('id').primaryKey(),
  marketCode: text('market_code').notNull(),
  name: text('name').notNull(),
  handle: text('handle').notNull(),
  description: text('description').notNull(),
  destinationUrl: text('destination_url').notNull(),
  contactEmail: text('contact_email').notNull(),
  category: text('category').notNull(),
  requestedBoostMinor: integer('requested_boost_minor').notNull().default(0),
  status: text('status').notNull().default('pending'),
  clickCount: integer('click_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_listings_market_status').on(table.marketCode, table.status),
  uniqueIndex('idx_listings_market_handle').on(table.marketCode, table.handle),
]);

export const clickEvents = sqliteTable('click_events', {
  id: text('id').primaryKey(),
  listingId: text('listing_id').notNull(),
  visitorHash: text('visitor_hash').notNull(),
  windowKey: integer('window_key').notNull(),
  isCounted: integer('is_counted', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_click_events_listing_created').on(table.listingId, table.createdAt),
  uniqueIndex('idx_click_events_listing_visitor_window').on(table.listingId, table.visitorHash, table.windowKey),
]);

export const boosts = sqliteTable('boosts', {
  id: text('id').primaryKey(),
  listingId: text('listing_id').notNull(),
  seasonId: text('season_id').notNull(),
  provider: text('provider').notNull(),
  providerPaymentId: text('provider_payment_id'),
  amountMinor: integer('amount_minor').notNull(),
  currency: text('currency').notNull(),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_boosts_season_status').on(table.seasonId, table.status),
  index('idx_boosts_listing_season').on(table.listingId, table.seasonId),
  uniqueIndex('idx_boosts_provider_payment').on(table.provider, table.providerPaymentId),
]);
