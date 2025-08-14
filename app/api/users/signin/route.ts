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

    const { data: users, error } = await supabase
      .from('app_user')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const user = users?.[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!user || !isMatch) {
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

    // ✅ Proper cookie setup for both dev and prod
    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    });
    console.log('signed innnn and returning');
    

    return response;
  } catch (error) {
    console.error('Error signing in:', error);
    return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 });
  }
}
