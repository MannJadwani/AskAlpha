# Database Storage for Reports

This enhancement allows reports to be stored in a Supabase database instead of just localStorage, providing better data persistence and cross-device access for users.

## Features

- Reports are stored in a dedicated `reports` table in Supabase
- User authentication is required to save reports to the database
- Reports can still be exported as text files without authentication
- Reports are associated with the user who created them via Row Level Security
- Fallback to localStorage when not logged in

## Database Schema

The `reports` table has the following structure:

```sql
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  sections JSONB,
  html_content TEXT,
  
  -- Add a constraint to ensure at least one of sections or html_content is not null
  CONSTRAINT reports_content_check CHECK (sections IS NOT NULL OR html_content IS NOT NULL)
);
```

## Security

The database uses Row Level Security (RLS) to ensure that users can only access their own reports:

```sql
-- Policy to allow users to select their own reports
CREATE POLICY "Users can view their own reports" 
  ON public.reports 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own reports
CREATE POLICY "Users can insert their own reports" 
  ON public.reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own reports
CREATE POLICY "Users can update their own reports" 
  ON public.reports 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own reports
CREATE POLICY "Users can delete their own reports" 
  ON public.reports 
  FOR DELETE 
  USING (auth.uid() = user_id);
```

## Implementation Details

1. Reports are saved to the Supabase database when a user is logged in
2. Reports are retrieved from the database when the user visits the My Reports page
3. If a user is not logged in, reports are saved to localStorage as a fallback
4. Both the CompanyReport and MyReports pages handle loading states and errors appropriately

## Migrations

For a production environment, you should use the Supabase CLI to apply migrations:

1. Install the CLI: `npm install -g supabase`
2. Link your project: `supabase link --project-ref <your-project-ref>`
3. Push the migrations: `supabase db push`

The migration files are located in the `supabase/migrations` directory.

## User Experience

- Users are prompted to sign in when they try to save a report without being logged in
- Loading states are shown during database operations
- Error messages are displayed if database operations fail
- Reports can still be exported as text files without authentication 