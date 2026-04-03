-- Run this in Supabase SQL Editor to create the leads table
-- Required for the lead capture modal (email + phone collection)

CREATE TABLE IF NOT EXISTS public.leads (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT UNIQUE,
  phone         TEXT,
  source        TEXT DEFAULT 'welcome_modal',
  promo_offered TEXT DEFAULT 'WELCOME247',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Only allow service role to read (admin access)
CREATE POLICY "Service role only" ON public.leads
  USING (auth.role() = 'service_role');

-- Also need address fields on profiles (for settings address save)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city    TEXT,
  ADD COLUMN IF NOT EXISTS state   TEXT,
  ADD COLUMN IF NOT EXISTS zip     TEXT;
