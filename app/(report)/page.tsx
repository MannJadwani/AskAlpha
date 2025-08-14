'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CompanyAnalysis from '../components/page/Analysis';

export default function HomePage() {
  const router = useRouter();


  return (
    <div className="min-h-screen bg-background flex items-center justify-center w-full">
      <CompanyAnalysis />
    </div>
  );
}
