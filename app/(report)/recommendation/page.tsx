'use client';

import { Suspense } from 'react';
import RecommendationRedirect from './redirect';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c10]">
        <p className="text-zinc-300">Redirecting...</p>
      </div>
    }>
      <RecommendationRedirect />
    </Suspense>
  );
}
