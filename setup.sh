#!/bin/bash

# Oversize Route Builder - Quick Setup Script

echo "🚚 Oversize Route Builder - Setup"
echo "=================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js $(node --version) detected"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 14+ first."
    exit 1
fi

echo "✓ PostgreSQL detected"
echo ""

# Create database
read -p "Create database 'oversize_routes'? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    createdb oversize_routes
    echo "✓ Database created"
    
    # Run schema
    psql oversize_routes < database/schema.sql
    echo "✓ Schema applied"
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
npm install

# Setup environment
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env with your configuration:"
    echo "   - Database credentials"
    echo "   - JWT secret"
    echo "   - Stripe API keys"
    echo "   - Email credentials"
    echo ""
    read -p "Press enter when you've configured .env..."
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd client
npm install

# Setup frontend environment
if [ ! -f .env.local ]; then
    cat > .env.local << EOF
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
EOF
    echo "✓ Created client/.env.local"
    echo ""
    echo "⚠️  Update client/.env.local with your Stripe publishable key"
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  npm run dev          # Starts both backend and frontend"
echo ""
echo "Or run separately:"
echo "  npm run server       # Backend on http://localhost:5000"
echo "  cd client && npm start   # Frontend on http://localhost:3000"
echo ""
echo "📚 See README.md for detailed documentation"
