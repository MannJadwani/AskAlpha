'use client'

import * as React from 'react'

type ShinyButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
}

export const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={[
          'group relative inline-flex items-center justify-center gap-2 rounded-2xl',
          'px-5 py-3 text-sm font-semibold text-black',
          'bg-white ring-1 ring-inset ring-white/20 shadow',
          'transition-all hover:shadow-[0_18px_60px_-10px_rgba(255,255,255,0.45)]',
          className,
        ].join(' ')}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        {/* Shine overlay */}
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <span
            className="absolute left-[-40%] top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:left-[130%] group-hover:opacity-100"
          />
        </span>
        {/* Soft glow ring */}
        <span className="pointer-events-none absolute -inset-px rounded-2xl ring-1 ring-white/15" />
      </button>
    )
  }
)

ShinyButton.displayName = 'ShinyButton'

export default ShinyButton


