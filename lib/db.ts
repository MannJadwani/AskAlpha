import supabase from './supabase';

// /**
//  * This module handles database initialization and migrations.
//  * In a real-world scenario, you would use the Supabase CLI for migrations,
//  * but this provides a simple way to ensure the database is set up correctly.
//  */

export async function initializeDatabase() {
  if (typeof window !== 'undefined') {
    // Don't run initialization in the browser
    return;
  }

  try {
    console.log('Checking database schema...');

    // Check if reports table exists
    
    let { data: plan_details, error } = await supabase
    .from('plan_details')
    .select('id')
    console.log('all plan details',plan_details)


    if (error && error.code === '42P01') {
      console.log('Reports table does not exist. Running migration...');

    } else if (error) {
      console.error('Error checking reports table:', error);
    } else {
      console.log('Database schema is up to date.');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// async function runMigration() {
//   // In a real application, you would use the Supabase CLI for migrations
//   // This is a simplified approach for demonstration purposes
//   console.log('Migrations should be run using the Supabase CLI.');
//   console.log('Refer to the documentation for proper migration handling.');
  
//   return {
//     success: false,
//     message: 'Migrations should be run using the Supabase CLI.'
//   };
// } 