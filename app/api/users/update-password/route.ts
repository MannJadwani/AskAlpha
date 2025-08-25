import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import supabase from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password in the app_user table
    const { error } = await supabase
      .from('app_user')
      .update({ password: hashedPassword })
      .eq('email', email); // Assuming you have an email column that matches Supabase's user ID

    if (error) {
      console.error('Error updating password in app_user:', error);
      return NextResponse.json(
        { error: 'Failed to update password in database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update-password API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}