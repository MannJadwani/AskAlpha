import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // 1. First try Supabase authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If Supabase auth succeeds
    if (authData.user && !authError) {
      // Get user data from your app_user table
      const { data: users, error: dbError } = await supabase
        .from('app_user')
        .select('*')
        .eq('email', email)
        .limit(1);

      if (dbError || !users || users.length === 0) {
        console.error('Error fetching user data:', dbError);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const user = users[0];
      const token = await signToken({ id: Number(user.id), email: user.email });

      const response = NextResponse.json({
        success: true,
        message: 'Sign in successful',
        user: {
          ...user,
          id: Number(user.id),
        },
        token
      });

      response.cookies.set('token', token, {
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
      });

      return response;
    }

    // 2. If Supabase auth fails, fall back to legacy authentication
    // Case-insensitive email lookup
    const { data: users, error } = await supabase
      .from('app_user')
      .select('*')
      .ilike('email', email)
      .limit(1);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const user = users?.[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // First try bcrypt compare; handle legacy plaintext passwords by upgrading on-the-fly
    let isMatch = false;
    try {
      if (user.password) {
        isMatch = await bcrypt.compare(password, user.password);
      }
    } catch (e) {
      // ignore and fall back to plaintext check below
    }

    if (!isMatch && user.password && password === user.password) {
      isMatch = true;
      // Upgrade legacy plaintext password to bcrypt hash
      try {
        const newHash = await bcrypt.hash(password, 10);
        await supabase.from('app_user').update({ password: newHash }).eq('id', user.id);
      } catch (upgradeErr) {
        console.warn('Failed to upgrade legacy password hash:', upgradeErr);
      }
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signToken({ id: Number(user.id), email: user.email });

    const response = NextResponse.json({
      success: true,
      message: 'Sign in successful',
      user: {
        ...user,
        id: Number(user.id),
      },
      token
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (error) {
    console.error('Error signing in:', error);
    return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 });
  }
}