'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          router.push('/sign-up?error=Authentication failed');
          return;
        }

        if (session) {
          // Send the session to our API to create/update user in app_user table
          const response = await fetch('/api/auth/google-signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: session.access_token,
              user: session.user
            }),
          });

          if (response.ok) {
            // Successfully signed up, redirect to recommendation page
            router.push('/recommendation');
          } else {
            const errorData = await response.json();
            console.error('Error in Google signup:', errorData);
            router.push('/sign-up?error=Failed to create account');
          }
        } else {
          // No session found, redirect to sign-up
          router.push('/sign-up');
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        router.push('/sign-up?error=Unexpected error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-zinc-300">Completing sign in...</p>
      </div>
    </div>
  );
}