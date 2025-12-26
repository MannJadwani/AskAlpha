-- Fix RLS policies for top_stocks table
-- Drop existing restrictive policies (handle both old and new names)
DROP POLICY IF EXISTS "Authenticated users can insert top stocks" ON public.top_stocks;
DROP POLICY IF EXISTS "Authenticated users can update top stocks" ON public.top_stocks;
DROP POLICY IF EXISTS "Service role and authenticated users can insert top stocks" ON public.top_stocks;
DROP POLICY IF EXISTS "Service role and authenticated users can update top stocks" ON public.top_stocks;
DROP POLICY IF EXISTS "Allow insert top stocks" ON public.top_stocks;
DROP POLICY IF EXISTS "Allow update top stocks" ON public.top_stocks;

-- Create permissive policies that allow all inserts/updates
-- Service role key bypasses RLS automatically, but these policies allow any operation
CREATE POLICY "Allow insert top stocks"
  ON public.top_stocks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update top stocks"
  ON public.top_stocks
  FOR UPDATE
  USING (true);

