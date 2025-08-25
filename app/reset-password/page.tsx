'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChartBarIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { ShinyButton } from '@/components/magicui/shiny-button';
import supabase from '@/lib/supabase';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Check if we have a valid reset token in the URL
    const checkResetToken = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };

    checkResetToken();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // First update the password in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        password: password
      });

      if (authError) {
        throw authError;
      }

      // Then update the password in our app_user table
      // We need to hash the password with bcrypt for our table
      const response = await fetch('/api/users/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: authData.user?.email,
          password: password 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update password in database');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/sign-in');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-zinc-300 flex items-center justify-center relative overflow-hidden py-8">
        <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.12),transparent_60%)] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(142,252,255,0.10),transparent_60%)] blur-2xl" />

        <div className="w-full max-w-md mx-auto px-4">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 ring-1 ring-inset ring-white/10">
                <ChartBarIcon className="w-6 h-6 text-zinc-200" />
              </div>
              <span className="text-xl font-bold text-zinc-200">AskAlpha</span>
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl text-center">
            <div className="mb-4 rounded-lg bg-success/20 border border-success/30 p-3 backdrop-blur-sm">
              <div className="flex items-center justify-center">
                <svg className="h-5 w-5 text-success mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-medium text-success">
                  Password reset successfully!
                </h3>
              </div>
            </div>
            <p className="text-zinc-400 mb-4">Redirecting you to the sign in page...</p>
            <Link href="/sign-in" className="text-zinc-300 hover:text-white transition-colors font-medium">
              Click here if you are not redirected
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-300 flex items-center justify-center relative overflow-hidden py-8">
      <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.12),transparent_60%)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(142,252,255,0.10),transparent_60%)] blur-2xl" />

      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 ring-1 ring-inset ring-white/10">
              <ChartBarIcon className="w-6 h-6 text-zinc-200" />
            </div>
            <span className="text-xl font-bold text-zinc-200">AskAlpha</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">
            Reset Password
          </h1>
          <p className="text-sm text-zinc-400">
            Enter your new password below
          </p>
        </div>

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

          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                  placeholder="Enter your new password"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 px-2.5 flex items-center text-zinc-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <ShinyButton
              type="submit"
              disabled={loading}
              className="w-full justify-center cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting...
                </div>
              ) : (
                "Reset Password"
              )}
            </ShinyButton>
          </form>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-zinc-400">
            Remember your password?{' '}
            <Link href="/sign-in" className="font-medium text-zinc-300 hover:text-white transition-colors">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}