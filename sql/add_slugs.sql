-- Migration: Add slug columns for businesses and users

-- 1. Add slug to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Add slug to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 3. Function to generate slugs (basic SQL version for migration)
CREATE OR REPLACE FUNCTION slugify(value TEXT) RETURNS TEXT AS $$
  BEGIN
    RETURN lower(regexp_replace(trim(value), '[^a-zA-Z0-9\s]+', '', 'g'));
  END;
$$ LANGUAGE plpgsql;

-- 4. Update existing businesses
UPDATE businesses 
SET slug = regexp_replace(slugify(name), '\s+', '-', 'g')
WHERE slug IS NULL;

-- 5. Update existing users/customers
UPDATE users
SET slug = regexp_replace(slugify(COALESCE(name, email)), '\s+', '-', 'g')
WHERE slug IS NULL;

-- 6. Ensure slugs are NOT NULL after initial generation
-- Note: In a real migration, we'd handle potential duplicates here.
-- For now, we'll just make them NOT NULL for businesses if they have a name.
ALTER TABLE businesses ALTER COLUMN slug SET NOT NULL;