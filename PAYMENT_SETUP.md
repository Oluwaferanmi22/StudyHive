# Payment Integration Setup

## Overview
This document explains how to set up Paystack payment integration for StudyHive premium upgrades.

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install axios
```

### 2. Environment Variables
Add the following environment variables to your `.env` file:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here

# Frontend URL (for callback)
FRONTEND_URL=http://localhost:3000
```

### 3. Get Paystack Keys
1. Sign up at [Paystack](https://paystack.com)
2. Get your test keys from the dashboard
3. Replace the placeholder keys in your `.env` file

## Features Implemented

### 1. Usage Tracking
- **Free Users**: 20 AI tutor messages per day
- **Premium Users**: Unlimited messages
- Daily usage resets at midnight
- Backend tracks usage per user

### 2. Payment Flow
1. User clicks "Upgrade to Premium" in AI Tutor
2. Payment modal opens with Paystack integration
3. User enters email and clicks "Pay with Paystack"
4. Redirects to Paystack payment page
5. After payment, redirects to `/payment/callback`
6. Backend verifies payment and upgrades user
7. User is redirected back to AI Tutor with premium access

### 3. API Endpoints
- `POST /api/payments/initialize` - Initialize Paystack payment
- `POST /api/payments/verify` - Verify payment after completion
- `GET /api/payments/usage` - Get user usage statistics
- `POST /api/payments/track-usage` - Track AI tutor usage

### 4. Database Changes
- Added `usage` tracking to User model
- Added `premiumExpiresAt` field for subscription management
- Added methods for usage tracking and premium upgrades

## Testing

### Test Payment Flow
1. Start the backend server
2. Start the frontend development server
3. Navigate to AI Tutor
4. Try to send more than 20 messages (should show limit message)
5. Click "Upgrade to Premium"
6. Use Paystack test card: `4084084084084081`
7. Complete payment and verify premium upgrade

### Test Cards (Paystack)
- **Success**: 4084084084084081
- **Declined**: 4084084084084085
- **Insufficient Funds**: 4084084084084082

## Production Setup

1. Replace test keys with live keys
2. Update callback URL to production domain
3. Test with real payment methods
4. Monitor payment logs and usage statistics

## Security Notes

- All payment processing is handled by Paystack
- No sensitive payment data is stored locally
- Usage tracking is server-side only
- Payment verification includes reference validation
