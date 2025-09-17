import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PaymentModal from '../../components/Common/PaymentModal';

const Upgrade = () => {
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleUpgradeSuccess = () => {
    // Refresh user data or redirect
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upgrade to Premium</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">Unlock unlimited AI Tutor, priority features, and more.</p>
      </div>

      {/* Pricing Card */}
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Premium Plan</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">₦5,000</span>
              <span className="text-gray-600 dark:text-gray-300 ml-2">one-time</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Lifetime access to all premium features</p>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Unlimited AI Tutor questions</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Priority study group matching</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Increased file upload limits</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Premium badges and status</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Advanced analytics and insights</span>
            </li>
          </ul>

          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors font-medium"
          >
            Upgrade Now
          </button>
        </div>
      </div>

      {/* Features Comparison */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Free Plan</h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300">
            <li>• 5 AI Tutor questions per day</li>
            <li>• Basic study group features</li>
            <li>• Standard file upload limits</li>
            <li>• Community support</li>
          </ul>
        </div>
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg p-6 shadow border border-primary-200 dark:border-primary-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Premium Plan</h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300">
            <li>• Unlimited AI Tutor questions</li>
            <li>• Priority matching & advanced features</li>
            <li>• Increased upload limits</li>
            <li>• Premium support & badges</li>
          </ul>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Payments are securely processed via Paystack. Your payment information is encrypted and secure.</p>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handleUpgradeSuccess}
      />
    </div>
  );
};

export default Upgrade;
