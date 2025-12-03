-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  usdot_number VARCHAR(50),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255)
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  plan_type VARCHAR(50) NOT NULL, -- 'basic', 'pro', 'enterprise'
  status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permits table
CREATE TABLE permits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  permit_number VARCHAR(100),
  state VARCHAR(5) NOT NULL,
  permit_type VARCHAR(50), -- 'single-trip', 'multi-trip', 'annual'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processed', 'error'
  file_path VARCHAR(500),
  original_filename VARCHAR(255),
  parsed_data JSONB,
  issued_date DATE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  permit_id INTEGER REFERENCES permits(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  origin_location VARCHAR(500),
  origin_lat DECIMAL(10, 8),
  origin_lng DECIMAL(11, 8),
  destination_location VARCHAR(500),
  destination_lat DECIMAL(10, 8),
  destination_lng DECIMAL(11, 8),
  total_distance DECIMAL(10, 2),
  estimated_time INTEGER, -- in minutes
  route_data JSONB, -- detailed turn-by-turn directions
  restrictions JSONB, -- time restrictions, escort requirements, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Load specifications table
CREATE TABLE load_specs (
  id SERIAL PRIMARY KEY,
  permit_id INTEGER REFERENCES permits(id) ON DELETE CASCADE,
  max_width DECIMAL(5, 2),
  max_height DECIMAL(5, 2),
  max_length DECIMAL(6, 2),
  gross_weight INTEGER,
  overweight_by INTEGER,
  num_axles INTEGER,
  axle_config JSONB,
  load_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  truck_make VARCHAR(100),
  truck_year INTEGER,
  truck_vin VARCHAR(50),
  tag_number VARCHAR(50),
  tag_state VARCHAR(5),
  trailer_make VARCHAR(100),
  trailer_year INTEGER,
  trailer_tag VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity log
CREATE TABLE activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50), -- 'permit', 'route', 'subscription'
  entity_id INTEGER,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_permits_user_id ON permits(user_id);
CREATE INDEX idx_permits_state ON permits(state);
CREATE INDEX idx_permits_status ON permits(status);
CREATE INDEX idx_routes_permit_id ON routes(permit_id);
CREATE INDEX idx_routes_user_id ON routes(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
