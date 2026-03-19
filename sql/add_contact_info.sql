-- Add contact info columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;
