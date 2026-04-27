// scripts/create-payment-links.js
// Simple helper to create Stripe products & Checkout links and PayPal order links.
// Replace placeholder keys with real credentials in each repo's .env file.

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createStripeProduct(name, priceCents, currency = 'usd') {
  const product = await stripe.products.create({name});
  const price = await stripe.prices.create({
    unit_amount: priceCents,
    currency,
    product: product.id,
  });
  console.log('Stripe product created:', product.id);
  console.log('Stripe price created:', price.id);
  return {productId: product.id, priceId: price.id};
}

async function createStripeCheckoutLink(priceId, successUrl, cancelUrl) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{price: priceId, quantity: 1}],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  console.log('Checkout URL:', session.url);
  return session.url;
}

// PayPal example using @paypal/checkout-server-sdk (you need to install it)
async function createPayPalOrder(amount, currency = 'USD') {
  const paypal = require('@paypal/checkout-server-sdk');
  const environment = new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
  const client = new paypal.core.PayPalHttpClient(environment);
  const request = new paypal.orders.OrdersCreateRequest();
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{amount: {currency_code: currency, value: amount.toString()}}],
  });
  const order = await client.execute(request);
  console.log('PayPal Order ID:', order.result.id);
  console.log('Approve URL:', order.result.links.find(l => l.rel === 'approve').href);
  return order.result;
}

module.exports = {createStripeProduct, createStripeCheckoutLink, createPayPalOrder};
