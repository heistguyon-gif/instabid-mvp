const shortenerHosts = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'rebrand.ly', 'shorturl.at', 'is.gd', 'buff.ly', 'ow.ly',
]);

const blockedHosts = new Set([
  'discord.gg', 'chat.whatsapp.com', 'telegram.me', 'localhost', 'onlyfans.com', 'xvideos.com', 'pornhub.com',
]);

const blockedListingTerms = /\b(?:cassino|casino|bet|aposta|betting|porn|porno|pornô|xxx|onlyfans|nude|nudes|escort|rifa|weapon|arma|cocaine|cocaína|pirâmide|pyramid scheme|followers? for sale|comprar seguidores)\b/i;

const trackingParams = new Set(['fbclid', 'gclid', 'igshid', 'mc_cid', 'mc_eid']);
const affiliateParam = /^(aff|affiliate|referral|invite|partner)(_|$)/i;

export const allowedCategories = ['Creators', 'Brands', 'Tools', 'Products', 'Services', 'Communities'] as const;

export function normalizeInstagramHandle(value: unknown) {
  const raw = String(value ?? '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').split(/[/?#]/)[0];
  const handle = `@${raw.replace(/^@/, '')}`.toLowerCase();
  return /^@[a-z0-9._]{1,30}$/.test(handle) ? handle : null;
}

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return octets[0] === 10 || octets[0] === 127 || (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168);
}

export function normalizeDestination(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw || raw.length > 500) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  if (url.protocol !== 'https:' || url.username || url.password || !hostname || hostname.endsWith('.local') ||
      isPrivateIpv4(hostname) || shortenerHosts.has(hostname) || blockedHosts.has(hostname)) return null;
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_') || trackingParams.has(key.toLowerCase())) url.searchParams.delete(key);
    if (affiliateParam.test(key)) return null;
  }
  url.hostname = hostname;
  url.hash = '';
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
  return url.toString();
}

export function isAllowedCategory(value: string): value is (typeof allowedCategories)[number] {
  return allowedCategories.includes(value as (typeof allowedCategories)[number]);
}

export function isAllowedListingContent(...values: unknown[]) {
  return !blockedListingTerms.test(values.map((value) => String(value ?? '')).join(' '));
}
