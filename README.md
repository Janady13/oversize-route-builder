# Oversize Route Builder

A complete web application for automating oversize/overweight load routing from permit documents. Upload your state DOT permits and instantly generate compliant routes with all restrictions and requirements clearly marked.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- 📄 **Automated PDF Parsing** - Upload permit PDFs and automatically extract route, load specs, and restrictions
- 🗺️ **Multi-State Support** - Currently supports Oklahoma and Texas permits (expandable)
- 🔐 **Authentication & Authorization** - Secure JWT-based authentication with email verification
- 💳 **Subscription Management** - Integrated Stripe billing with multiple plan tiers
- 📊 **Dashboard & Analytics** - Track all permits, routes, and vehicles in one place
- 🚚 **Vehicle Management** - Store and manage multiple truck/trailer configurations
- 🔔 **Real-time Notifications** - Get notified when permits are processed
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for database
- **JWT** for authentication
- **Stripe** for payment processing
- **pdf-parse** for PDF extraction
- **Nodemailer** for email notifications

### Frontend
- **React** with TypeScript
- **TailwindCSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **React Icons** for UI icons

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**
- **Stripe Account** (for payment processing)
- **Email Service** (Gmail, SendGrid, or similar)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/oversize-route-builder.git
cd oversize-route-builder
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb oversize_routes
```

Run the schema:

```bash
psql oversize_routes < database/schema.sql
```

### 3. Backend Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=oversize_routes
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Configure environment
cp .env.local .env.local

# Edit with your settings
nano .env.local
```

Required frontend environment variables:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### 5. Stripe Setup

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
3. Create products and prices:
   - Basic Plan: $29.99/month
   - Pro Plan: $79.99/month
   - Enterprise Plan: $199.99/month
4. Set up webhooks:
   - Endpoint: `http://localhost:5000/webhook/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

### 6. Email Setup (Gmail Example)

1. Enable 2-factor authentication on your Gmail account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use this password in your `.env` file

## Running the Application

### Development Mode

Start both backend and frontend:

```bash
# From root directory
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
cd client && npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Production Build

```bash
# Build frontend
cd client
npm run build

# Start production server
cd ..
NODE_ENV=production node server/index.js
```

## Netlify Deployment (Frontend + API via Netlify Functions)

This repo is configured to deploy the React client to Netlify and expose the Express API through a Netlify Function. For production, use external storage for uploads (S3/GCS) and a managed PostgreSQL instance.

### Netlify build settings
- Build command: `npm ci && npm --prefix client ci && npm run build`
- Publish directory: `client/build`
- Functions directory: `netlify/functions`

### Environment variables (Netlify)
Server/API:
- `NODE_ENV=production`
- `FRONTEND_URL=https://<your-netlify-site>.netlify.app`
- `DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD`
- `JWT_SECRET`
- Optional: `MAX_FILE_SIZE`

Stripe (optional but required for billing flows):
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `BASIC_PRICE_ID`, `PRO_PRICE_ID`, `ENTERPRISE_PRICE_ID`

Client:
- Option A (recommended): rely on redirects and relative `/api/*` paths (default when `NODE_ENV=production`)
- Option B: set `REACT_APP_API_URL='/.netlify/functions/server'`

Notes:
- The Stripe webhook is available at `/.netlify/functions/server/webhook/stripe` in production.
- Local file uploads under `server/uploads` are ephemeral on Netlify Functions; replace with object storage for production.

## Usage

### For Users

1. **Sign Up**
   - Visit the landing page
   - Click "Get Started" or "Sign Up"
   - Enter your company details
   - Verify your email

2. **Choose a Plan**
   - Select a subscription plan
   - Enter payment details via Stripe
   - Start your free trial

3. **Upload Permits**
   - Go to your dashboard
   - Choose your state (Oklahoma or Texas)
   - Upload your permit PDF
   - Wait for automatic processing (usually < 30 seconds)

4. **View Routes**
   - Click on any processed permit
   - View extracted route information
   - See all restrictions and requirements
   - Export to GPS format (Pro plan)

### For Developers

#### Adding Support for New States

1. Add parsing logic in `server/utils/permitParser.js`:

```javascript
const parseNewStatePermit = (text) => {
  // Extract permit data specific to new state
  return {
    permitNumber: extractPattern(text, /pattern/),
    // ... other fields
  };
};
```

2. Update the main parser:

```javascript
if (state === 'NEW') {
  return parseNewStatePermit(text);
}
```

#### API Endpoints

**Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

**Permits**
- `GET /api/permits` - List all permits
- `GET /api/permits/:id` - Get permit details
- `POST /api/permits/upload` - Upload new permit
- `DELETE /api/permits/:id` - Delete permit

**Subscriptions**
- `GET /api/subscriptions/plans` - List available plans
- `GET /api/subscriptions/current` - Get current subscription
- `POST /api/subscriptions/create-checkout` - Create Stripe checkout
- `POST /api/subscriptions/cancel` - Cancel subscription

**Routes**
- `GET /api/routes` - List all routes
- `GET /api/routes/:id` - Get route details

## Project Structure

```
oversize-route-builder/
├── server/
│   ├── config/
│   │   └── database.js          # Database connection
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── permits.js           # Permit routes
│   │   ├── routes.js            # Route routes
│   │   ├── subscriptions.js     # Subscription routes
│   │   ├── webhook.js           # Stripe webhooks
│   │   └── ...
│   ├── utils/
│   │   ├── permitParser.js      # PDF parsing logic
│   │   └── email.js             # Email utilities
│   └── index.js                 # Server entry point
├── client/
│   ├── public/
│   ├── src/
│   │   ├── LandingPage.tsx      # Landing page
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── AuthModal.tsx        # Login/Register modal
│   │   ├── App.tsx              # Main app component
│   │   └── ...
│   └── package.json
├── database/
│   └── schema.sql               # Database schema
├── .env.example                 # Environment template
└── package.json
```

## Database Schema

Key tables:
- `users` - User accounts and profiles
- `subscriptions` - Subscription data (synced with Stripe)
- `permits` - Uploaded permit documents
- `routes` - Extracted route information
- `load_specs` - Load specifications from permits
- `vehicles` - User vehicle profiles
- `activity_log` - Audit log of all actions

## Subscription Plans

| Feature | Basic | Professional | Enterprise |
|---------|-------|--------------|------------|
| Permits/month | 10 | Unlimited | Unlimited |
| Route extraction | ✓ | ✓ | ✓ |
| Multi-state | ✓ | ✓ | ✓ |
| Compliance checking | Basic | Advanced | Advanced |
| Email support | ✓ | ✓ | ✓ |
| Priority support | - | ✓ | ✓ |
| GPS export | - | ✓ | ✓ |
| Multi-user | - | - | ✓ |
| API access | - | - | ✓ |
| SLA guarantee | - | - | ✓ |

## Security

- All passwords are hashed using bcrypt
- JWT tokens for secure authentication
- SQL injection protection via parameterized queries
- XSS protection with helmet middleware
- Rate limiting on API endpoints
- HTTPS required in production
- Secure file upload validation

## Troubleshooting

### PDF Parsing Issues

If permits aren't being parsed correctly:

1. Check PDF quality - ensure text is not in images
2. Verify state is correctly specified
3. Check logs for parsing errors
4. Test with sample permits first

### Database Connection Errors

```bash
# Test database connection
psql -h localhost -U your_user -d oversize_routes

# Check PostgreSQL is running
sudo systemctl status postgresql
```

### Email Not Sending

1. Verify SMTP credentials
2. Check firewall isn't blocking port 587
3. Enable "Less secure app access" (Gmail)
4. Use App Passwords for 2FA accounts

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@oversizeroutes.com or join our Slack channel.

## Acknowledgments

- Thanks to all state DOTs for providing digital permits
- Stripe for payment processing
- The Node.js and React communities

---

Built with ❤️ for the oversize transport industry
