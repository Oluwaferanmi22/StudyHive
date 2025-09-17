const paystackProvider = require('./paystackProvider');
let stripeProvider = null;
try {
  stripeProvider = require('./stripeProvider');
} catch (e) {
  stripeProvider = null;
}

function getProvider() {
  const provider = (process.env.PAYMENTS_PROVIDER || 'paystack').toLowerCase();
  switch (provider) {
    case 'stripe':
      if (!stripeProvider) {
        console.warn('Stripe provider requested but not available. Falling back to Paystack.');
        return paystackProvider;
      }
      return stripeProvider;
    case 'paystack':
    default:
      return paystackProvider;
  }
}

module.exports = {
  getProvider,
};
