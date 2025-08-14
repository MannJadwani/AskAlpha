'use client'

import * as React from 'react'

type LogoProps = {
  size?: number
  wordmark?: boolean
  className?: string
}

export function Logo({ size = 32, wordmark = false, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="relative"
        style={{ width: size, height: size }}
        aria-label="Ask Alpha"
      >
        {/* Soft conic aura */}
        <div className="absolute -inset-2 rounded-xl bg-[conic-gradient(from_90deg,rgba(142,252,255,0.25),rgba(255,122,217,0.25),rgba(167,139,250,0.25),rgba(142,252,255,0.25))] blur" />
        {/* Gem base */}
        <div className="relative h-full w-full rounded-xl bg-white/10 ring-1 ring-inset ring-white/20 grid place-items-center overflow-hidden">
          {/* Inner gradient shard */}
          <svg width={size - 6} height={size - 6} viewBox="0 0 48 48" className="drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)]">
            <defs>
              <linearGradient id="aa-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8efcff" />
                <stop offset="50%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#ff7ad9" />
              </linearGradient>
            </defs>
            {/* Stylized double-A monogram */}
            <path d="M10 36 L18 12 L24 12 L16 36 Z" fill="url(#aa-g)" opacity="0.95" />
            <path d="M24 36 L32 12 L38 12 L30 36 Z" fill="url(#aa-g)" opacity="0.75" />
            {/* Crossbar accents */}
            <rect x="14" y="22" width="12" height="2" rx="1" fill="white" opacity=".25" />
            <rect x="20" y="28" width="14" height="2" rx="1" fill="white" opacity=".18" />
          </svg>
          {/* Subtle inner ring */}
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/15" />
        </div>
      </div>
      {wordmark && (
        <div className="select-none">
          <div className="text-[15px] md:text-[16px] font-semibold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 bg-clip-text text-transparent">
            Ask Alpha
          </div>
        </div>
      )}
    </div>
  )
}

export default Logo




