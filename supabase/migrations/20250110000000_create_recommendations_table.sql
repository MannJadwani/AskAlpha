-- Create recommendations table for storing AI-generated investment recommendations
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  symbol TEXT,
  
  -- Recommendation data
  action TEXT NOT NULL, -- BUY, SELL, HOLD
  confidence INTEGER NOT NULL, -- 1-100
  target_price DOUBLE PRECISION,
  current_price DOUBLE PRECISION,
  reasoning TEXT NOT NULL,
  key_factors JSONB NOT NULL, -- Array of strings
  risks JSONB NOT NULL, -- Array of strings
  time_horizon TEXT NOT NULL,
  
  -- KPIs and Analysis
  kpis JSONB, -- Array of {label, value}
  sections JSONB, -- Structured analysis sections
  
  -- Financial data
  revenues_5yr JSONB, -- Array of {year, inr}
  profits_5yr JSONB, -- Array of {year, inr}
  revenue_unit TEXT, -- Lakhs, Crores, Thousands
  profit_unit TEXT, -- Lakhs, Crores, Thousands
  
  -- Research data
  perplexity_analysis TEXT, -- Full markdown analysis
  citations JSONB, -- Array of citation URLs
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  -- Foreign key to auth.users
  CONSTRAINT recommendations_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS recommendations_user_id_idx ON public.recommendations(user_id);
CREATE INDEX IF NOT EXISTS recommendations_created_at_idx ON public.recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS recommendations_company_name_idx ON public.recommendations(company_name);

-- Enable Row Level Security (RLS)
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own recommendations
CREATE POLICY "Users can view own recommendations"
  ON public.recommendations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own recommendations
CREATE POLICY "Users can insert own recommendations"
  ON public.recommendations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own recommendations
CREATE POLICY "Users can update own recommendations"
  ON public.recommendations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own recommendations
CREATE POLICY "Users can delete own recommendations"
  ON public.recommendations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS recommendations_updated_at_trigger ON public.recommendations;
CREATE TRIGGER recommendations_updated_at_trigger
  BEFORE UPDATE ON public.recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_recommendations_updated_at();


