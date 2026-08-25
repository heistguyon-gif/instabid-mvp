import assert from 'node:assert/strict';
import test from 'node:test';
import { createBravopayPix, normalizeBuyer, normalizeTransaction, verifyBravopayWebhook } from '../lib/bravopay.ts';
import { isAllowedCategory, isAllowedListingContent, normalizeDestination, normalizeInstagramHandle } from '../lib/validation.ts';
import { formatBrazilianDocument, formatPaymentCountdown, isPaymentId, paymentRemainingSeconds } from '../lib/payment.ts';

test('valida e normaliza os dados enviados ao Pix', () => {
  assert.deepEqual(normalizeBuyer({
    name: 'Cliente Teste',
    email: 'CLIENTE@EXEMPLO.COM',
    document: '529.982.247-25',
    phone: '(11) 98765-4321',
  }), {
    name: 'Cliente Teste',
    email: 'cliente@exemplo.com',
    document: '52998224725',
    phone: '11987654321',
  });
  assert.deepEqual(normalizeBuyer({
    name: 'Cliente Teste', email: 'cliente@exemplo.com', document: '52998224725', phone: '',
  }), {
    name: 'Cliente Teste', email: 'cliente@exemplo.com', document: '52998224725', phone: '',
  });
  assert.equal(normalizeBuyer({ name: 'Teste', email: 'x', document: '11111111111', phone: '1' }), null);
});

test('normaliza uma transação paga da BravoPay', () => {
  assert.deepEqual(normalizeTransaction({
    id: '53b46513-25af-4220-a389-769d6e378899', status: 'PAID', amount_cents: 49000, currency: 'BRL', method: 'PIX',
    external_reference: 'pay_123', pix: { copy_paste: '000201PIX', expires_at: '2026-08-24T00:00:00Z' },
  }), {
    id: '53b46513-25af-4220-a389-769d6e378899', status: 'paid', amountMinor: 49000, currency: 'BRL', method: 'PIX',
    externalReference: 'pay_123', copyPasteCode: '000201PIX', expiresAt: '2026-08-24T00:00:00Z',
  });
});

test('aceita assinatura HMAC válida e rejeita replay', async () => {
  const previous = process.env.BRAVOPAY_WEBHOOK_SECRET;
  process.env.BRAVOPAY_WEBHOOK_SECRET = 'whsec_test_secret';
  try {
    const rawBody = '{"id":"evt_test","type":"transaction.paid"}';
    const timestamp = Math.floor(Date.now() / 1000);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(process.env.BRAVOPAY_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${rawBody}`)));
    const signature = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
    assert.equal(await verifyBravopayWebhook(rawBody, `t=${timestamp},v1=${signature}`), true);
    assert.equal(await verifyBravopayWebhook(rawBody, `t=${timestamp - 1000},v1=${signature}`), false);
  } finally {
    if (previous === undefined) delete process.env.BRAVOPAY_WEBHOOK_SECRET;
    else process.env.BRAVOPAY_WEBHOOK_SECRET = previous;
  }
});

test('cria Pix com valor do servidor e chave de idempotência', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.BRAVOPAY_API_KEY;
  process.env.BRAVOPAY_API_KEY = 'bp_live_test';
  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(String(input), 'https://bravopay.club/api/v1/transactions');
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('authorization'), 'Bearer bp_live_test');
      assert.equal(headers.get('idempotency-key'), 'pay_123');
      const body = JSON.parse(String(init?.body));
      assert.equal(body.amount_cents, 49000);
      assert.equal(body.external_reference, 'pay_123');
      assert.equal(body.metadata.listing_id, 'listing_123');
      return Response.json({
        id: 'tx_created', status: 'PENDING', amount_cents: 49000, currency: 'BRL', method: 'PIX',
        external_reference: 'pay_123', pix: { copy_paste: '000201PIX', expires_at: '2026-08-24T00:00:00Z' },
      });
    };
    const transaction = await createBravopayPix({
      paymentId: 'pay_123', listingId: 'listing_123', seasonId: 'season_123', amountMinor: 49000,
      buyer: { name: 'Cliente Teste', email: 'cliente@example.com', document: '52998224725', phone: '11987654321' },
    });
    assert.equal(transaction.id, 'tx_created');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.BRAVOPAY_API_KEY;
    else process.env.BRAVOPAY_API_KEY = previousKey;
  }
});

test('bloqueia destinos e conteúdo incompatíveis antes da cobrança', () => {
  assert.equal(normalizeDestination('https://onlyfans.com/exemplo'), null);
  assert.equal(isAllowedListingContent('Cassino premium', 'Projeto de apostas'), false);
  assert.equal(isAllowedListingContent('Ferramenta para creators', 'Automação profissional'), true);
});

test('normaliza perfis do Instagram e rejeita formatos impossíveis', () => {
  assert.equal(normalizeInstagramHandle('@Instabid.BR'), '@instabid.br');
  assert.equal(normalizeInstagramHandle('https://instagram.com/resolv.all/'), '@resolv.all');
  assert.equal(normalizeInstagramHandle('@perfil..quebrado'), null);
  assert.equal(normalizeInstagramHandle('@.perfil'), null);
  assert.equal(normalizeInstagramHandle('@perfil.'), null);
});

test('mantém as seis categorias aceitas no checkout e no ranking', () => {
  for (const category of ['Creators', 'Brands', 'Tools', 'Products', 'Services', 'Communities']) {
    assert.equal(isAllowedCategory(category), true);
  }
  assert.equal(isAllowedCategory('Adult'), false);
});

test('formata documentos brasileiros sem alterar os dígitos', () => {
  assert.equal(formatBrazilianDocument('52998224725'), '529.982.247-25');
  assert.equal(formatBrazilianDocument('04.252.011/0001-10'), '04.252.011/0001-10');
});

test('valida recuperação e contagem regressiva do Pix', () => {
  assert.equal(isPaymentId('pay_1234567890abcdef1234567890abcdef'), true);
  assert.equal(isPaymentId('pay_invalido'), false);
  assert.equal(paymentRemainingSeconds('2026-08-25T00:10:00.000Z', Date.parse('2026-08-25T00:09:01.000Z')), 59);
  assert.equal(paymentRemainingSeconds('2026-08-25T00:09:00.000Z', Date.parse('2026-08-25T00:09:01.000Z')), 0);
  assert.equal(formatPaymentCountdown(125), '2:05');
});
