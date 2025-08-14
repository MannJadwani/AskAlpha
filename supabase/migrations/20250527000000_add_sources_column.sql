-- Add sources column to reports table
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.reports.sources IS 'Array of source URLs used for the report';
