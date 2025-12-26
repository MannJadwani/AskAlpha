'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RecommendationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve query parameters (like ?symbol=...)
    const params = new URLSearchParams(searchParams.toString());
    const redirectUrl = `/report-gen${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(redirectUrl);
  }, [router, searchParams]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c10]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-zinc-300">Redirecting...</p>
      </div>
    </div>
  );
}
