const crypto = require('crypto');

/**
 * Manual Jest mock for the `stripe` package (auto-applied to every test
 * file per Jest's node_modules mocking convention - no explicit jest.mock()
 * needed). `paymentIntents.create` is faked since it would otherwise need
 * real network access to Stripe. `webhooks.constructEvent` is a REAL
 * implementation of Stripe's documented HMAC-SHA256 signing scheme (not
 * faked), so webhook signature verification is genuinely exercised by
 * tests, not just assumed to work.
 */
function StripeMock() {
  let counter = 0;

  return {
    paymentIntents: {
      create: jest.fn(async ({ amount, currency, metadata }) => {
        counter += 1;
        return {
          id: `pi_test_${Date.now()}_${counter}`,
          client_secret: `pi_test_${Date.now()}_${counter}_secret_abc`,
          amount,
          currency,
          metadata,
          status: 'requires_payment_method',
        };
      }),
    },
    webhooks: {
      constructEvent: (rawBody, signatureHeader, secret) => {
        if (!signatureHeader) {
          throw new Error('No stripe-signature header provided');
        }
        const parts = Object.fromEntries(
          signatureHeader.split(',').map((p) => p.split('='))
        );
        const { t: timestamp, v1: signature } = parts;
        const payload = `${timestamp}.${rawBody}`;
        const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

        if (expected !== signature) {
          throw new Error('Webhook signature mismatch');
        }

        return JSON.parse(rawBody.toString());
      },
    },
  };
}

module.exports = jest.fn().mockImplementation(StripeMock);
