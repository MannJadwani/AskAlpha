import Link from 'next/link';
import { ShinyButton } from '@/components/magicui/shiny-button';

export default function EmptyState() {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center border border-white/10">
      <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">
        No Reports Yet
      </h2>
      <p className="text-zinc-400 mb-8 text-lg max-w-md mx-auto">
        You haven't generated any reports yet. Create your first AI-powered investment recommendation to see it here.
      </p>
      <Link href="/recommendation">
        <ShinyButton className="!bg-white/5 !text-zinc-200 !ring-white/10 text-lg px-8 py-4 gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
          </svg>
          Get Your First Recommendation
        </ShinyButton>
      </Link>
    </div>
  );
}
