import React, { useState } from 'react';

const Upgrade = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpgrade = async () => {
    try {
      setError(null);
      setLoading(true);
      const checkoutUrl = process.env.REACT_APP_CHECKOUT_URL || '#';
      if (checkoutUrl === '#') {
        setError('Payment is not configured yet.');
        return;
      }
      window.location.href = checkoutUrl;
    } catch (e) {
      setError('Failed to start checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Premium</h1>
      <p className="text-gray-600 mb-6">Unlock AI Tutor boosts, larger hives, file storage, and more.</p>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
          <li>Unlimited AI Tutor questions</li>
          <li>Priority matching and premium badges</li>
          <li>Increased upload limits</li>
        </ul>
        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50"
        >
          {loading ? 'Redirecting…' : 'Upgrade Now'}
        </button>
      </div>

      <div className="text-sm text-gray-500">Payments are securely processed by your provider.</div>
    </div>
  );
};

export default Upgrade;
