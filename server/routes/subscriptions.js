const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic',
        price: 29.99,
        interval: 'month',
        features: [
          'Up to 10 permits per month',
          'Automatic route extraction',
          'Basic compliance checking',
          'Email support'
        ],
        stripePriceId: process.env.BASIC_PRICE_ID
      },
      {
        id: 'pro',
        name: 'Professional',
        price: 79.99,
        interval: 'month',
        features: [
          'Unlimited permits',
          'Advanced route optimization',
          'Multi-state compliance',
          'Real-time notifications',
          'Priority support',
          'Export to GPS formats'
        ],
        stripePriceId: process.env.PRO_PRICE_ID,
        popular: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 199.99,
        interval: 'month',
        features: [
          'Everything in Pro',
          'Multiple user accounts',
          'API access',
          'Custom integrations',
          'Dedicated account manager',
          'SLA guarantee'
        ],
        stripePriceId: process.env.ENTERPRISE_PRICE_ID
      }
    ];

    res.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: { message: 'Error fetching plans' } });
  }
});

// Create checkout session
router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    const { priceId, planType } = req.body;

    if (!priceId || !planType) {
      return res.status(400).json({ error: { message: 'Price ID and plan type are required' } });
    }

    // Check if user already has active subscription
    const existing = await db.query(
      'SELECT id FROM subscriptions WHERE user_id = $1 AND status = $2',
      [req.user.id, 'active']
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        error: { 
          message: 'You already have an active subscription',
          code: 'SUBSCRIPTION_EXISTS'
        } 
      });
    }

    // Create or get Stripe customer
    let customerId;
    const customerResult = await db.query(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );

    if (customerResult.rows.length > 0 && customerResult.rows[0].stripe_customer_id) {
      customerId = customerResult.rows[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          userId: req.user.id.toString(),
          companyName: req.user.companyName
        }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?subscription=canceled`,
      metadata: {
        userId: req.user.id.toString(),
        planType: planType
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ error: { message: 'Error creating checkout session' } });
  }
});

// Get current subscription
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, plan_type, status, current_period_start, current_period_end, 
              cancel_at_period_end, stripe_subscription_id
       FROM subscriptions 
       WHERE user_id = $1 AND status IN ('active', 'trialing', 'past_due')
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ subscription: null });
    }

    const sub = result.rows[0];

    res.json({
      subscription: {
        id: sub.id,
        planType: sub.plan_type,
        status: sub.status,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: { message: 'Error fetching subscription' } });
  }
});

// Cancel subscription
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1 AND status = $2',
      [req.user.id, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'No active subscription found' } });
    }

    const stripeSubId = result.rows[0].stripe_subscription_id;

    // Cancel at period end in Stripe
    await stripe.subscriptions.update(stripeSubId, {
      cancel_at_period_end: true
    });

    // Update database
    await db.query(
      'UPDATE subscriptions SET cancel_at_period_end = TRUE WHERE user_id = $1 AND stripe_subscription_id = $2',
      [req.user.id, stripeSubId]
    );

    // Log activity
    await db.query(
      'INSERT INTO activity_log (user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'SUBSCRIPTION_CANCELED', 'subscription', result.rows[0].id]
    );

    res.json({ message: 'Subscription will be canceled at the end of the billing period' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: { message: 'Error canceling subscription' } });
  }
});

// Reactivate canceled subscription
router.post('/reactivate', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT stripe_subscription_id 
       FROM subscriptions 
       WHERE user_id = $1 AND status = $2 AND cancel_at_period_end = TRUE`,
      [req.user.id, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'No canceled subscription found' } });
    }

    const stripeSubId = result.rows[0].stripe_subscription_id;

    // Reactivate in Stripe
    await stripe.subscriptions.update(stripeSubId, {
      cancel_at_period_end: false
    });

    // Update database
    await db.query(
      'UPDATE subscriptions SET cancel_at_period_end = FALSE WHERE user_id = $1 AND stripe_subscription_id = $2',
      [req.user.id, stripeSubId]
    );

    // Log activity
    await db.query(
      'INSERT INTO activity_log (user_id, action, entity_type) VALUES ($1, $2, $3)',
      [req.user.id, 'SUBSCRIPTION_REACTIVATED', 'subscription']
    );

    res.json({ message: 'Subscription reactivated successfully' });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ error: { message: 'Error reactivating subscription' } });
  }
});

// Create customer portal session
router.post('/customer-portal', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );

    if (result.rows.length === 0 || !result.rows[0].stripe_customer_id) {
      return res.status(404).json({ error: { message: 'No subscription found' } });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: result.rows[0].stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/dashboard/subscription`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Customer portal error:', error);
    res.status(500).json({ error: { message: 'Error creating portal session' } });
  }
});

module.exports = router;
