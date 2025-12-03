const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

// Routers
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const vehiclesRoutes = require('./routes/vehicles');
const permitsRoutes = require('./routes/permits');
const routesRoutes = require('./routes/routes');
const webhookRoutes = require('./routes/webhook'); // requires raw body for Stripe

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true
}));

// Basic rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100
}));

// Stripe webhook must receive raw body; mount it before JSON parser
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

// JSON parsing for standard routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Mount application routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/permits', permitsRoutes);
app.use('/api/routes', routesRoutes);

module.exports = app;

