const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Lazy Razorpay instance helper (prevents app crash when env vars missing)
const getRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
  });
};

// Plan definitions (in paise — 1 INR = 100 paise)
const PLANS = {
  monthly: {
    name: 'Project Hub – Monthly Plan',
    amountINR: 249,      // ₹249
    amountUSD: 2.99,     // $2.99
  },
  yearly: {
    name: 'Project Hub – Yearly Plan',
    amountINR: 199,      // ₹199/year
    amountUSD: 2.39,     // $2.39/year
  }
};

// POST /api/payment/create-order
// Creates a Razorpay order for the selected plan
router.post('/create-order', async (req, res) => {
  const { plan, currency } = req.body;

  if (!plan || !PLANS[plan]) {
    return res.status(400).json({ error: 'Invalid plan. Choose monthly or yearly.' });
  }

  const selectedPlan = PLANS[plan];
  
  // Razorpay supports INR natively; USD needs conversion
  // For simplicity we use INR amounts (most common for Indian businesses)
  const amountPaise = selectedPlan.amountINR * 100; // convert to paise

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `receipt_${plan}_${Date.now()}`,
      notes: {
        plan: plan,
        planName: selectedPlan.name,
      }
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: selectedPlan.name,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    return res.status(500).json({ error: 'Payment order creation failed. Please try again.' });
  }
});

// POST /api/payment/verify
// Verifies the payment signature after successful Razorpay checkout
router.post('/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields.' });
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    // Payment verified — here you can update DB, send confirmation email etc.
    console.log(`✅ Payment verified: ${razorpay_payment_id}`);
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully! Your subscription is now active.',
      paymentId: razorpay_payment_id,
    });
  } else {
    console.warn(`⚠️ Payment signature mismatch for order: ${razorpay_order_id}`);
    return res.status(400).json({ error: 'Payment verification failed. Signature mismatch.' });
  }
});

module.exports = router;
