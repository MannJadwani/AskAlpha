'use client';

import Link from 'next/link';
import React from 'react';

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-10 bg-white/5 backdrop-blur border-b border-white/10">
      <div className="h-16 px-4 flex items-center justify-between md:justify-end">
        {/* Mobile menu button */}
        <button
          className="md:hidden text-zinc-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={toggleSidebar}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* User profile - desktop */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-zinc-300 hidden sm:inline">Ask Alpha</span>
          
          <div className="relative">
            <button 
              className="flex items-center gap-2 focus:outline-none hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="rounded-full p-0.5 shadow-lg bg-white/10 ring-1 ring-inset ring-white/15">
                <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-cyan-200 font-bold border border-white/10 text-xs">
                  AI
                </div>
              </div>
              <span className="text-sm font-medium text-zinc-300 hidden sm:inline">AI Analyst</span>
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