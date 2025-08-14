import { NextResponse } from 'next/server';
import supabase from '../../../../lib/supabase';

// This is a protected admin route that provides information about migrations
export async function POST(request: Request) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      message: 'For security reasons, database migrations should be performed using the Supabase CLI or dashboard.',
      instructions: [
        '1. Install Supabase CLI: npm install -g supabase',
        '2. Link your project: supabase link --project-ref <your-project-ref>',
        '3. Apply migrations: supabase db push',
        'Alternatively, you can run SQL commands directly in the Supabase dashboard SQL editor.'
      ]
    });
  } catch (error) {
    console.error('Error in migrate-db route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 