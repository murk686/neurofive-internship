const crypto = require('crypto');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
});

/**
 * Creates a PaymentIntent for a booking. Amount is in the smallest currency
 * unit (cents), matching Stripe's convention.
 */
async function createPaymentIntent({ amount, currency = 'usd', metadata = {} }) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
}

/**
 * Verifies a Stripe webhook signature and parses the event. This is a pure,
 * local HMAC-SHA256 check (Stripe's documented scheme) - no network call is
 * involved, so it can be fully unit/integration tested without hitting
 * Stripe's servers. Delegates to the SDK's constructEvent, which implements
 * exactly this.
 */
function verifyWebhookSignature(rawBody, signatureHeader, webhookSecret) {
  return stripe.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);
}

/**
 * Test-only helper: builds a validly-signed Stripe-Signature header for a
 * given payload, so webhook handling can be integration-tested without any
 * network access to Stripe. Mirrors Stripe's documented signing scheme:
 * signed_payload = "{timestamp}.{raw_body}", signature = HMAC-SHA256(secret, signed_payload).
 */
function generateTestSignatureHeader(payload, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

module.exports = { stripe, createPaymentIntent, verifyWebhookSignature, generateTestSignatureHeader };
