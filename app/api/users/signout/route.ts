import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function POST() {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Supabase sign out error:', error);
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Signed out successfully'
    });

    // Clear the JWT cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}