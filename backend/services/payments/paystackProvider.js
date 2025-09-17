const axios = require('axios');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_secret_key';

async function initializePayment({ email, amount, reference, callbackUrl, metadata }) {
  const payload = {
    email,
    amount: amount * 100, // Paystack expects kobo
    reference,
    callback_url: callbackUrl,
    metadata,
  };

  const response = await axios.post('https://api.paystack.co/transaction/initialize', payload, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response?.data?.status) {
    const message = response?.data?.message || 'Failed to initialize payment';
    const err = new Error(message);
    err.response = response?.data;
    throw err;
  }

  const data = response.data.data;
  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference,
  };
}

async function verifyPayment(reference) {
  const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const ok = response?.data?.status && response?.data?.data?.status === 'success';
  return {
    success: !!ok,
    raw: response.data,
  };
}

module.exports = {
  initializePayment,
  verifyPayment,
};
