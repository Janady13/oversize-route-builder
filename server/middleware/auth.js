const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: { message: 'No authentication token provided' } });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const result = await db.query(
      `SELECT u.id, u.email, u.company_name, u.email_verified,
              s.status as subscription_status, s.plan_type, s.current_period_end
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: { message: 'User not found' } });
    }

    const user = result.rows[0];

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ 
        error: { 
          message: 'Please verify your email',
          code: 'EMAIL_NOT_VERIFIED'
        } 
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      companyName: user.company_name,
      subscription: {
        status: user.subscription_status,
        plan: user.plan_type,
        periodEnd: user.current_period_end
      }
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: { message: 'Invalid token' } });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { message: 'Token expired' } });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: { message: 'Server error' } });
  }
};

// Middleware to check if user has active subscription
const requireSubscription = (req, res, next) => {
  if (!req.user.subscription.status || req.user.subscription.status !== 'active') {
    return res.status(403).json({ 
      error: { 
        message: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED'
      } 
    });
  }

  // Check if subscription has expired
  if (req.user.subscription.periodEnd && new Date(req.user.subscription.periodEnd) < new Date()) {
    return res.status(403).json({ 
      error: { 
        message: 'Subscription has expired',
        code: 'SUBSCRIPTION_EXPIRED'
      } 
    });
  }

  next();
};

// Middleware to check specific plan access
const requirePlan = (minPlan) => {
  const planHierarchy = {
    'basic': 1,
    'pro': 2,
    'enterprise': 3
  };

  return (req, res, next) => {
    const userPlanLevel = planHierarchy[req.user.subscription.plan] || 0;
    const requiredPlanLevel = planHierarchy[minPlan] || 0;

    if (userPlanLevel < requiredPlanLevel) {
      return res.status(403).json({ 
        error: { 
          message: `This feature requires a ${minPlan} plan or higher`,
          code: 'INSUFFICIENT_PLAN',
          required: minPlan,
          current: req.user.subscription.plan
        } 
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  requireSubscription,
  requirePlan
};
