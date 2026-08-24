export const BRAVOPAY_BASE_URL = 'https://bravopay.club/api/v1';

export type BuyerInput = {
  name: string;
  email: string;
  document: string;
  phone?: string;
};

export type BravopayTransaction = {
  id: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  amountMinor: number;
  currency: string;
  method: string;
  externalReference: string;
  copyPasteCode: string | null;
  expiresAt: string | null;
};

export class BravopayError extends Error {
  readonly status: number;
  readonly providerCode: string;

  constructor(message: string, status = 502, providerCode = '') {
    super(message);
    this.name = 'BravopayError';
    this.status = status;
    this.providerCode = providerCode;
  }
}

function isSafeProviderId(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
}

export function digitsOnly(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

function allDigitsEqual(value: string) {
  return /^(\d)\1+$/.test(value);
}

function isValidCpf(value: string) {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11 || allDigitsEqual(cpf)) return false;
  const digit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function isValidCnpj(value: string) {
  const cnpj = digitsOnly(value);
  if (cnpj.length !== 14 || allDigitsEqual(cnpj)) return false;
  const digit = (length: number) => {
    const weights = length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const remainder = weights.reduce((sum, weight, index) => sum + Number(cnpj[index]) * weight, 0) % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return digit(12) === Number(cnpj[12]) && digit(13) === Number(cnpj[13]);
}

export function normalizeBuyer(value: unknown): BuyerInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const buyer = {
    name: String(source.name ?? '').trim().slice(0, 100),
    email: String(source.email ?? '').trim().toLowerCase().slice(0, 160),
    document: digitsOnly(source.document).slice(0, 14),
    phone: digitsOnly(source.phone).replace(/^55(?=\d{10,11}$)/, '').slice(0, 11),
  };
  if (buyer.name.length < 5 || buyer.name.split(/\s+/).length < 2) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(buyer.email)) return null;
  if (!isValidCpf(buyer.document) && !isValidCnpj(buyer.document)) return null;
  if (buyer.phone && !/^\d{10,11}$/.test(buyer.phone)) return null;
  return buyer;
}

function normalizeStatus(value: unknown): BravopayTransaction['status'] {
  const status = String(value ?? '').toUpperCase();
  if (['PAID', 'AUTHORIZED', 'APPROVED', 'COMPLETED'].includes(status)) return 'paid';
  if (['REFUNDED', 'CHARGEBACK'].includes(status)) return 'refunded';
  if (['EXPIRED', 'FAILED', 'DECLINED', 'REFUSED', 'CANCELLED', 'CANCELED'].includes(status)) return 'failed';
  return 'pending';
}

function unwrap(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  return source.data && typeof source.data === 'object' && !Array.isArray(source.data)
    ? source.data as Record<string, unknown>
    : source;
}

export function normalizeTransaction(value: unknown): BravopayTransaction {
  const source = unwrap(value);
  const pix = source.pix && typeof source.pix === 'object' && !Array.isArray(source.pix)
    ? source.pix as Record<string, unknown>
    : {};
  const id = String(source.id ?? '');
  if (!isSafeProviderId(id)) throw new BravopayError('Resposta inválida do processador de pagamentos.', 502, 'invalid_transaction_id');
  return {
    id,
    status: normalizeStatus(source.status),
    amountMinor: Number(source.amount_cents ?? 0),
    currency: String(source.currency ?? 'BRL').toUpperCase(),
    method: String(source.method ?? 'PIX').toUpperCase(),
    externalReference: String(source.external_reference ?? ''),
    copyPasteCode: typeof pix.copy_paste === 'string' ? pix.copy_paste : typeof pix.qr_code === 'string' ? pix.qr_code : null,
    expiresAt: typeof pix.expires_at === 'string' ? pix.expires_at : null,
  };
}

function providerConfig() {
  const apiKey = process.env.BRAVOPAY_API_KEY;
  if (!apiKey) throw new BravopayError('Pagamento temporariamente indisponível.', 503);
  return {
    apiKey,
    baseUrl: (process.env.BRAVOPAY_BASE_URL || BRAVOPAY_BASE_URL).replace(/\/$/, ''),
  };
}

async function providerJson(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const providerError = body && typeof body === 'object' && !Array.isArray(body)
      ? (body as { error?: { code?: unknown; message?: unknown } }).error
      : undefined;
    const providerCode = providerError
      ? String(providerError.code ?? '')
      : '';
    const status = providerCode === 'rate_limited' ? 503 : 502;
    const providerMessage = String(providerError?.message ?? '').replace(/[\r\n]/g, ' ').slice(0, 180);
    throw new BravopayError(providerMessage || 'Não foi possível gerar ou consultar o Pix. Tente novamente.', status, providerCode);
  }
  return body;
}

export async function createBravopayPix(input: {
  paymentId: string;
  listingId: string;
  seasonId: string;
  amountMinor: number;
  buyer: BuyerInput;
  tracking?: Record<string, string>;
}) {
  const { apiKey, baseUrl } = providerConfig();
  const phone = input.buyer.phone
    ? (input.buyer.phone.startsWith('55') ? input.buyer.phone : `55${input.buyer.phone}`)
    : '';
  const utmSource = input.tracking ?? {};
  const utm = Object.fromEntries(['source', 'medium', 'campaign', 'content', 'term', 'fbclid', 'ttclid', 'gclid', 'src', 'sck']
    .map((key) => [key, String(utmSource[key] ?? '').trim().slice(0, 300)] as const)
    .filter(([, value]) => value));
  const response = await fetch(`${baseUrl}/transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': input.paymentId,
    },
    body: JSON.stringify({
      amount_cents: input.amountMinor,
      method: 'pix',
      description: `Boost Instabid · ${input.listingId}`.slice(0, 300),
      external_reference: input.paymentId,
      metadata: { listing_id: input.listingId, season_id: input.seasonId, payment_id: input.paymentId },
      customer: {
        name: input.buyer.name,
        email: input.buyer.email,
        cpf: input.buyer.document,
        ...(phone ? { phone } : {}),
      },
      expires_in: 1800,
      ...(Object.keys(utm).length ? { utm } : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const transaction = normalizeTransaction(await providerJson(response));
  if (!transaction.copyPasteCode) throw new BravopayError('A BravoPay não retornou o código Pix.');
  return transaction;
}

export async function getBravopayTransaction(id: string) {
  const { apiKey, baseUrl } = providerConfig();
  if (!isSafeProviderId(id)) throw new BravopayError('Pagamento inválido.', 400, 'invalid_transaction_id');
  const response = await fetch(`${baseUrl}/transactions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(12_000),
  });
  return normalizeTransaction(await providerJson(response));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

export async function verifyBravopayWebhook(rawBody: string, signatureHeader: string | null, toleranceSeconds = 300) {
  const secret = process.env.BRAVOPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const parts = Object.fromEntries(signatureHeader.split(',').map((part) => {
    const separator = part.indexOf('=');
    return separator > 0 ? [part.slice(0, separator).trim(), part.slice(separator + 1).trim()] : ['', ''];
  }));
  const timestamp = Number(parts.t);
  const signature = String(parts.v1 ?? '').toLowerCase();
  if (!Number.isSafeInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${rawBody}`)));
  const expected = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return constantTimeEqual(expected, signature);
}
