const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (amount, currency = 'tzs') => {
  try {
    // Since Stripe doesn't officially support TZS, we'll use USD for demo
    // In a real implementation, you'd convert TZS to USD
    const amountInUsd = Math.round(amount / 2500); // Rough conversion for demo
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInUsd * 100, // Stripe expects amount in cents
      currency: 'usd', // Using USD since TZS isn't supported
      metadata: {
        original_amount: amount,
        original_currency: currency,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

const confirmPayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  stripe
};
