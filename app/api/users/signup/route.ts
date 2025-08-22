import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcrypt';


import supabase from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // ✅ Check if user already exists
    const { data: existingUsers, error: existingError } = await supabase
      .from('app_user')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existingError) {
      console.error('Error checking existing user:', existingError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('app_user')
      .insert([{ email, password:hashedPassword, name }])
      .select()
      .single();

    if (insertError || !newUser) {
      console.error('Error inserting user:', insertError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // ✅ Sign token
    const token = await signToken({ id: Number(newUser.id), email: newUser.email });

    const response = NextResponse.json({
      success: true,
      user: {
        ...newUser,
        id: Number(newUser.id),
      },
      token
    });

    // ✅ Set JWT cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    });

    return response;

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

