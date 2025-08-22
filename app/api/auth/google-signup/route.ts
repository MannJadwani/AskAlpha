import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import supabase from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { token, user: authUser } = await request.json();

        if (!token || !authUser) {
            console.log('Authentication data is missing');
            
            return NextResponse.json(
                { error: 'Authentication data is required' },
                { status: 400 }
            );
        }

        // Verify the token with Supabase
        const { data: { user }, error: verifyError } = await supabase.auth.getUser(token);

        if (verifyError || !user) {
            console.error('Error verifying token:', verifyError);
            return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
        }

        // Check if user email exists
        if (!user.email) {
            console.error('User email is missing');
            return NextResponse.json({ error: 'User email is required' }, { status: 400 });
        }

        const createPlan = async (userId: number) => {
            try {
                console.log('Creating plan for user:', userId);
                
                    const parsedDate = new Date();
                    const nextMonthDate = new Date(parsedDate);
                    nextMonthDate.setMonth(parsedDate.getMonth() + 1);
                    const nextYearDate = new Date(parsedDate);
                    nextYearDate.setFullYear(parsedDate.getFullYear() + 1);

                
                    const { data, error } = await supabase
                      .from('plan_details')
                      .insert([
                        {
                          plan: 'Free',
                          frequency: 5,
                          date: new Date().toISOString(),
                          userId: Number(userId),
                          monthenddate: nextYearDate.toISOString(),
                          subscriptionid: '',
                        },
                      ])
                      .select()
                      .single();

                    if (error) {
                        console.error('Error creating plan:', error);
                    }

                console.log('Plan created:', data);
            } catch (err) {
                console.error('Error:', err);
            }
        };

        // Check if user already exists
        const { data: existingUsers, error: existingError } = await supabase
            .from('app_user')
            .select('id')
            .eq('email', user.email) // Now email is guaranteed to exist
            .limit(1);

        if (existingError) {
            console.error('Error checking existing user:', existingError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        let userId;

        if (existingUsers && existingUsers.length > 0) {
            // User exists, get their ID
            console.log('Existing user found:', existingUsers[0]);
            
            userId = existingUsers[0].id;
        } else {
            // Create new user in app_user table
            console.log('Creating new user:', user.email);
            
            const { data: newUser, error: insertError } = await supabase
                .from('app_user')
                .insert([{
                    email: user.email,
                    name: authUser.user_metadata.full_name || user.email.split('@')[0],
                    // For OAuth users, we can set a random password or null
                    password: null
                }])
                .select()
                .single();

            if (insertError || !newUser) {
                console.error('Error inserting user:', insertError);
                return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
            }

            userId = newUser.id;
            createPlan(userId);
        }

        // Sign our custom JWT token
        const customToken = await signToken({ id: Number(userId), email: user.email });

        const response = NextResponse.json({
            success: true,
            user: {
                id: Number(userId),
                email: user.email,
                name: authUser.user_metadata.full_name || user.email.split('@')[0],
            },
            token: customToken
        });

        // Set JWT cookie
        response.cookies.set('token', customToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60, // 1 hour
        });

        return response;

    } catch (error) {
        console.error('Error in Google signup:', error);
        return NextResponse.json(
            { error: 'Failed to complete Google signup' },
            { status: 500 }
        );
    }
}