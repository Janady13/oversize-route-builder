const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');

router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

async function handleCheckoutComplete(session) {
  const { customer, subscription, metadata } = session;
  const userId = parseInt(metadata.userId);
  const planType = metadata.planType;

  console.log('Checkout completed for user:', userId);

  // Create or update subscription record
  await db.query(
    `INSERT INTO subscriptions 
     (user_id, stripe_customer_id, stripe_subscription_id, plan_type, status)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, stripe_subscription_id) 
     DO UPDATE SET status = $5, updated_at = CURRENT_TIMESTAMP`,
    [userId, customer, subscription, planType, 'active']
  );

  // Log activity
  await db.query(
    'INSERT INTO activity_log (user_id, action, details) VALUES ($1, $2, $3)',
    [userId, 'SUBSCRIPTION_CREATED', JSON.stringify({ planType })]
  );
}

async function handleSubscriptionCreated(subscription) {
  const { id, customer, items, current_period_start, current_period_end, status } = subscription;
  
  const planType = items.data[0].price.metadata?.planType || 'basic';

  await db.query(
    `INSERT INTO subscriptions 
     (stripe_customer_id, stripe_subscription_id, plan_type, status, 
      current_period_start, current_period_end)
     VALUES ($1, $2, $3, $4, to_timestamp($5), to_timestamp($6))
     ON CONFLICT (stripe_subscription_id) 
     DO UPDATE SET 
       status = $4,
       current_period_start = to_timestamp($5),
       current_period_end = to_timestamp($6),
       updated_at = CURRENT_TIMESTAMP`,
    [customer, id, planType, status, current_period_start, current_period_end]
  );

  console.log('Subscription created:', id);
}

async function handleSubscriptionUpdated(subscription) {
  const { id, items, current_period_start, current_period_end, status, cancel_at_period_end } = subscription;
  
  const planType = items.data[0].price.metadata?.planType || 'basic';

  await db.query(
    `UPDATE subscriptions 
     SET plan_type = $1, 
         status = $2, 
         current_period_start = to_timestamp($3), 
         current_period_end = to_timestamp($4),
         cancel_at_period_end = $5,
         updated_at = CURRENT_TIMESTAMP
     WHERE stripe_subscription_id = $6`,
    [planType, status, current_period_start, current_period_end, cancel_at_period_end, id]
  );

  console.log('Subscription updated:', id);
}

async function handleSubscriptionDeleted(subscription) {
  const { id } = subscription;

  await db.query(
    `UPDATE subscriptions 
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE stripe_subscription_id = $2`,
    ['canceled', id]
  );

  // Log activity
  const userResult = await db.query(
    'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
    [id]
  );

  if (userResult.rows.length > 0) {
    await db.query(
      'INSERT INTO activity_log (user_id, action) VALUES ($1, $2)',
      [userResult.rows[0].user_id, 'SUBSCRIPTION_ENDED']
    );
  }

  console.log('Subscription deleted:', id);
}

async function handlePaymentSucceeded(invoice) {
  const { subscription, customer } = invoice;

  if (subscription) {
    await db.query(
      `UPDATE subscriptions 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE stripe_subscription_id = $2`,
      ['active', subscription]
    );

    console.log('Payment succeeded for subscription:', subscription);
  }
}

async function handlePaymentFailed(invoice) {
  const { subscription } = invoice;

  if (subscription) {
    await db.query(
      `UPDATE subscriptions 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE stripe_subscription_id = $2`,
      ['past_due', subscription]
    );

    // Log activity
    const userResult = await db.query(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
      [subscription]
    );

    if (userResult.rows.length > 0) {
      await db.query(
        'INSERT INTO activity_log (user_id, action) VALUES ($1, $2)',
        [userResult.rows[0].user_id, 'PAYMENT_FAILED']
      );
    }

    console.log('Payment failed for subscription:', subscription);
  }
}

module.exports = router;
