-- Function to check if a table exists
CREATE OR REPLACE FUNCTION public.check_if_table_exists(table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = table_name
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- Function to execute SQL statements
-- Note: This is a very powerful function that should be used with caution
-- In production, you would want to restrict this to admin users
CREATE OR REPLACE FUNCTION public.run_sql(sql TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Add row level security policy to restrict access to these functions
REVOKE ALL ON FUNCTION public.check_if_table_exists(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_sql(TEXT) FROM PUBLIC;

-- Grant access to authenticated users (in production, restrict to admins)
GRANT EXECUTE ON FUNCTION public.check_if_table_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_sql(TEXT) TO authenticated; 