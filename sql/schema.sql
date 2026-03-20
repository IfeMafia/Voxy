-- Postgres Schema for Voxy
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Add a trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Make trigger creation idempotent
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  business_hours JSONB,
  assistant_tone TEXT,
  assistant_instructions TEXT,
  custom_category TEXT,
  profile_completion INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT FALSE,
  credit_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  customer_name TEXT,
  status TEXT DEFAULT 'AI Responding', -- 'AI Responding', 'AI Resolved', 'Needs Owner Response'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'ai', 'owner', 'customer'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table for Billing
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'credit_purchase', 'credit_usage'
  amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON transactions(business_id);

-- Triggers for updated_at (Idempotent)
DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies for Transactions
DROP POLICY IF EXISTS "Business owners can view their own transactions" ON transactions;
CREATE POLICY "Business owners can view their own transactions" 
ON transactions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM businesses 
  WHERE businesses.id = transactions.business_id 
  AND businesses.owner_id = auth.uid()
));

-- Policies for Businesses
DROP POLICY IF EXISTS "Business owners can view their own business" ON businesses;
CREATE POLICY "Business owners can view their own business" 
ON businesses FOR SELECT 
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Business owners can update their own business" ON businesses;
CREATE POLICY "Business owners can update their own business" 
ON businesses FOR UPDATE 
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Business owners can insert their own business" ON businesses;
CREATE POLICY "Business owners can insert their own business" 
ON businesses FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Policies for Conversations
DROP POLICY IF EXISTS "Business owners can view their own conversations" ON conversations;
CREATE POLICY "Business owners can view their own conversations" 
ON conversations FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM businesses 
  WHERE businesses.id = conversations.business_id 
  AND businesses.owner_id = auth.uid()
));

DROP POLICY IF EXISTS "Business owners can update their own conversations" ON conversations;
CREATE POLICY "Business owners can update their own conversations" 
ON conversations FOR ALL 
USING (EXISTS (
  SELECT 1 FROM businesses 
  WHERE businesses.id = conversations.business_id 
  AND businesses.owner_id = auth.uid()
));

-- Policies for Messages
DROP POLICY IF EXISTS "Business owners can view their own messages" ON messages;
CREATE POLICY "Business owners can view their own messages" 
ON messages FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM conversations 
  JOIN businesses ON businesses.id = conversations.business_id
  WHERE conversations.id = messages.conversation_id 
  AND businesses.owner_id = auth.uid()
));

DROP POLICY IF EXISTS "Business owners can insert messages in their conversations" ON messages;
CREATE POLICY "Business owners can insert messages in their conversations" 
ON messages FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM conversations 
  JOIN businesses ON businesses.id = conversations.business_id
  WHERE conversations.id = messages.conversation_id 
  AND businesses.owner_id = auth.uid()
));
