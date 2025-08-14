'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
// import supabase from '../../lib/supabase';
import { ChartBarIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { ShinyButton } from '@/components/magicui/shiny-button';

// Component to handle registration success message
function RegistrationMessage() {
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Check if the user just registered
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Registration successful! Please sign in with your new account.');
    }
  }, [searchParams]);

  if (!successMessage) return null;

  return (
    <div className="mb-6 rounded-xl bg-success/10 border border-success/20 p-4 backdrop-blur-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-success">{successMessage}</h3>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('sigining clicked');


    try {
      const res = await fetch('/api/users/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to login account');
      }
      const data = await res.json();
      console.log('sigining success and pushing to home');
      if (data.error) {
        setError(data.error);
        return;
      }

      // Redirect to the dashboard after successful login

      await new Promise((resolve) => setTimeout(resolve, 100));

      router.replace('/recommendation');
      // setLoading(false);
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      console.error(err);
    }finally{
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   console.log('prefetching');

  //   router.prefetch('/');
  //   console.log('prefetched');
  // }, [])

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-300 flex items-center justify-center relative overflow-hidden py-8">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.12),transparent_60%)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(142,252,255,0.10),transparent_60%)] blur-2xl" />

      <div className="w-full max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 ring-1 ring-inset ring-white/10">
              <ChartBarIcon className="w-6 h-6 text-zinc-200" />
            </div>
              <span className="text-xl font-bold text-zinc-200">AskAlpha</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome Back
          </h1>
          <p className="text-sm text-zinc-400">
            Sign in to access your research dashboard
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
          {error && (
            <div className="mb-4 rounded-lg bg-red-900/20 border border-red-800 p-3 backdrop-blur-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-200">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <Suspense fallback={null}>
            <RegistrationMessage />
          </Suspense>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                 className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-2.5 flex items-center text-zinc-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-white/10 bg-white/5 text-white focus:ring-white/20 focus:ring-offset-0"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-400">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="#" className="font-medium text-zinc-300 hover:text-white transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <ShinyButton
              type="submit"
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </ShinyButton>
          </form>

          {/* Divider */}
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white/5 backdrop-blur-sm px-3 text-zinc-400">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google Sign In */}
          {/* <button className="mt-4 w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300 flex items-center justify-center">
            <svg className="h-4 w-4 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.7 12.3c0-.8-.1-1.6-.2-2.4H12.2v4.5h6.5c-.3 1.6-1.2 2.9-2.5 3.8v3.2h4c2.4-2.2 3.5-5.4 3.5-9.1z" />
              <path d="M12.2 24c3.3 0 6.1-1.1 8.1-3l-4-3.1c-1.1.7-2.5 1.2-4.1 1.2-3.2 0-5.8-2.1-6.8-5h-4.1v3.2c2 4 6 6.7 10.9 6.7z" />
              <path d="M5.4 14.1c-.2-.7-.4-1.4-.4-2.1s.2-1.4.4-2.1V6.7h-4.1C.4 8.3 0 10.1 0 12s.4 3.7 1.3 5.3l4.1-3.2z" />
              <path d="M12.2 4.9c1.8 0 3.4.6 4.6 1.8L20.3 3c-2.1-2-4.8-3-8.1-3C6 0 2 2.7 0 6.7l4.1 3.2c1-2.9 3.6-5 6.1-5z" />
            </svg>
            Continue with Google
          </button> */}

         
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-sm text-zinc-400">
            Don't have an account?{' '}
            <Link href="/sign-up" className="font-medium text-zinc-300 hover:text-white transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 