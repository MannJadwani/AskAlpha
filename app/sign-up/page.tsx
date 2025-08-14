'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabase';
import { ChartBarIcon, EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { ShinyButton } from '@/components/magicui/shiny-button';

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const createPlan = async (id: number) => {
    try {
      const res = await fetch('/api/plan-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'Free',
          frequency: '5',              // If frequency is a BigInt, pass string/number
          date: new Date().toISOString(),
          userId: id.toString()                   // Must match type in backend (BigInt, so send as string or convertible number)
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create plan');
      }

      console.log('Plan created:', data);
    } catch (err) {
      console.error('Error:', err);
    }
  };


  // Call this function on button click or inside useEffect


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);

    try {


      const res = await fetch('/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create account');
      }
      const data = await res.json();
      console.log('Account created successfully:', data);
      createPlan(data.user.id);
      await new Promise((resolve) => setTimeout(resolve, 100));

      router.replace('/');
    } catch (err) {
      setError('Failed to create account. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-gradient-soft flex items-center justify-center relative overflow-hidden py-4">
      {/* Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-secondary/20 rounded-full blur-2xl animate-pulse delay-1000"></div>

      <div className="w-full max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
            <Link href="/landing" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-primary-gradient rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
              <span className="text-xl font-bold text-primary">AskAlpha</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">
            Create Your Account
          </h1>
          <p className="text-sm text-tertiary-300">
            Start your journey with AI-powered research
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
          {error && (
            <div className="mb-4 rounded-lg bg-error/10 border border-error/20 p-3 backdrop-blur-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-error" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2">
                  <h3 className="text-sm font-medium text-error">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-1">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-tertiary-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="John Doe"
              />
            </div>

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
                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-tertiary-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-tertiary-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-2.5 flex items-center text-tertiary-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-tertiary-400">
                At least 8 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-white mb-1">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-tertiary-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 px-2.5 flex items-center text-tertiary-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="flex items-center h-4">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/10 text-primary focus:ring-primary focus:ring-offset-0"
                />
              </div>
              <div className="text-xs">
                <label htmlFor="terms" className="text-tertiary-300">
                  I agree to the{' '}
                  <Link href="/terms" className="font-medium text-primary hover:text-primary-400 transition-colors">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="font-medium text-primary hover:text-primary-400 transition-colors">
                    Privacy Policy
                  </Link>
                </label>
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
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </ShinyButton>
          </form>

          {/* Divider */}
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white/5 backdrop-blur-sm px-3 text-tertiary-300">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google Sign Up */}
          <button className="mt-4 w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300 flex items-center justify-center">
            <svg className="h-4 w-4 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.7 12.3c0-.8-.1-1.6-.2-2.4H12.2v4.5h6.5c-.3 1.6-1.2 2.9-2.5 3.8v3.2h4c2.4-2.2 3.5-5.4 3.5-9.1z" />
              <path d="M12.2 24c3.3 0 6.1-1.1 8.1-3l-4-3.1c-1.1.7-2.5 1.2-4.1 1.2-3.2 0-5.8-2.1-6.8-5h-4.1v3.2c2 4 6 6.7 10.9 6.7z" />
              <path d="M5.4 14.1c-.2-.7-.4-1.4-.4-2.1s.2-1.4.4-2.1V6.7h-4.1C.4 8.3 0 10.1 0 12s.4 3.7 1.3 5.3l4.1-3.2z" />
              <path d="M12.2 4.9c1.8 0 3.4.6 4.6 1.8L20.3 3c-2.1-2-4.8-3-8.1-3C6 0 2 2.7 0 6.7l4.1 3.2c1-2.9 3.6-5 6.1-5z" />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-sm text-tertiary-300">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-medium text-primary hover:text-primary-400 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 