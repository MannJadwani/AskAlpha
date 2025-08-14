-- Create a reports table to store equity research reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  sections JSONB,
  html_content TEXT,
  
  -- Add a constraint to ensure at least one of sections or html_content is not null
  CONSTRAINT reports_content_check CHECK (sections IS NOT NULL OR html_content IS NOT NULL)
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own reports
CREATE POLICY "Users can view their own reports" 
  ON public.reports 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own reports
CREATE POLICY "Users can insert their own reports" 
  ON public.reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own reports
CREATE POLICY "Users can update their own reports" 
  ON public.reports 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own reports
CREATE POLICY "Users can delete their own reports" 
  ON public.reports 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON public.reports (user_id); 