import { applyVerifiedTransaction, getPayment } from '@/db/runtime';
import { BravopayError, getBravopayTransaction } from '@/lib/bravopay';

type PageProps = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: PageProps) {
  const { id } = await params;
  if (!/^pay_[a-f0-9]{32}$/i.test(id)) return Response.json({ error: 'invalid_payment' }, { status: 400 });
  const payment = await getPayment(id);
  if (!payment) return Response.json({ error: 'payment_not_found' }, { status: 404 });
  let current = payment;
  if (payment.status === 'pending' && payment.providerPaymentId) {
    try {
      const transaction = await getBravopayTransaction(payment.providerPaymentId);
      current = await applyVerifiedTransaction(transaction) ?? payment;
    } catch (error) {
      if (!(error instanceof BravopayError)) return Response.json({ error: 'payment_verification_failed' }, { status: 409 });
    }
  }
  return Response.json({ payment: current }, { headers: { 'Cache-Control': 'no-store' } });
}
