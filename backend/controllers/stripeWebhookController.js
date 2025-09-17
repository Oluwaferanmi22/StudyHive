// Stripe webhook controller for payment events
// Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET

let Stripe = null;
try {
  Stripe = require('stripe');
} catch (e) {
  Stripe = null;
}

const User = require('../models/User');

const handleStripeWebhook = async (req, res) => {
  try {
    if (!Stripe) {
      console.error('Stripe SDK not installed');
      return res.status(500).send('Stripe SDK not installed');
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecret || !webhookSecret) {
      return res.status(500).send('Stripe env not configured');
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });

    const signature = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const userId = metadata.userId || metadata.userid || metadata.user_id;
        try {
          if (!userId) {
            console.warn('Stripe webhook missing userId in metadata');
            break;
          }
          const user = await User.findById(userId);
          if (!user) {
            console.warn('Stripe webhook user not found', userId);
            break;
          }
          // Idempotency: if already premium and not expired, skip
          const now = new Date();
          if (user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt > now) {
            // already premium - do nothing
          } else {
            user.upgradeToPremium(12);
            await user.save();
          }
        } catch (e) {
          console.error('Error upgrading user on webhook:', e);
        }
        break;
      }
      default:
        // Ignore other events for now
        break;
    }

    res.status(200).send('Received');
  } catch (e) {
    console.error('Stripe webhook handler error:', e);
    res.status(500).send('Server Error');
  }
};

module.exports = { handleStripeWebhook };
