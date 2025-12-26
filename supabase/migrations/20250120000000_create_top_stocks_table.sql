-- Create top_stocks table for storing daily top stocks data
CREATE TABLE IF NOT EXISTS public.top_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE, -- Store date (YYYY-MM-DD) to ensure one entry per day
  stocks_data JSONB NOT NULL, -- Array of stock objects with symbol, name, price, change, etc.
  sources JSONB, -- Array of citation URLs from Perplexity
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create index on date for fast lookups
CREATE INDEX IF NOT EXISTS top_stocks_date_idx ON public.top_stocks(date DESC);

-- Enable Row Level Security (RLS) - but allow public read access
ALTER TABLE public.top_stocks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - allow anyone to read top stocks (public data)
CREATE POLICY "Anyone can view top stocks"
  ON public.top_stocks
  FOR SELECT
  USING (true);

-- Allow service role (bypass RLS) and authenticated users to insert/update
-- Service role key bypasses RLS automatically, but we add this for authenticated users
CREATE POLICY "Service role and authenticated users can insert top stocks"
  ON public.top_stocks
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS, this allows authenticated users too

CREATE POLICY "Service role and authenticated users can update top stocks"
  ON public.top_stocks
  FOR UPDATE
  USING (true); -- Service role bypasses RLS, this allows authenticated users too

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_top_stocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS top_stocks_updated_at_trigger ON public.top_stocks;
CREATE TRIGGER top_stocks_updated_at_trigger
  BEFORE UPDATE ON public.top_stocks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_top_stocks_updated_at();

