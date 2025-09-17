// Stripe payments provider for StudyHive
// Requires: npm install stripe

let Stripe = null;
try {
  Stripe = require('stripe');
} catch (e) {
  Stripe = null;
}

function getStripeClient() {
  if (!Stripe) throw new Error('Stripe SDK not installed. Run: npm install stripe');
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(secret, { apiVersion: '2024-06-20' });
}

// Initialize a Checkout Session and return a URL analogous to authorization_url
async function initializePayment({ email, amount, reference, callbackUrl, metadata }) {
  const stripe = getStripeClient();

  const currency = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
  // Convert amount to smallest currency unit (Stripe expects integer)
  // When PAYMENTS_PROVIDER=stripe, assume amount given is already the major unit (e.g., 50 USD -> 50)
  const unitAmount = Math.round(Number(amount) * 100);

  const successUrl = `${callbackUrl}?reference={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${callbackUrl}?cancelled=1`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency,
          product_data: { name: 'StudyHive Premium' },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      reference,
      ...(metadata || {}),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return {
    authorizationUrl: session.url,
    accessCode: session.id,
    reference: session.id,
  };
}

// Verify the Checkout Session by ID (reference)
async function verifyPayment(reference) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(reference);
  const success = session && (session.payment_status === 'paid' || session.status === 'complete');
  return {
    success: !!success,
    raw: session,
  };
}

module.exports = {
  initializePayment,
  verifyPayment,
};
