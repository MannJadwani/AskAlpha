'use client';

import Link from 'next/link';

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-10 bg-tertiary-800/80 backdrop-blur-md border-b border-primary">
      <div className="h-16 px-4 flex items-center justify-between md:justify-end">
        {/* Mobile menu button */}
        <button
          className="md:hidden text-tertiary hover:text-primary"
          onClick={toggleSidebar}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* User profile - desktop */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-tertiary hidden sm:inline">Equity Research Platform</span>
          
          <div className="relative">
            <button 
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="bg-primary-gradient rounded-full p-0.5">
                <div className="w-8 h-8 rounded-full bg-tertiary-800 flex items-center justify-center text-primary font-semibold border-2 border-tertiary-800">
                  AI
                </div>
              </div>
              <span className="text-sm font-medium text-tertiary hidden sm:inline">Analyst</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-tertiary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 