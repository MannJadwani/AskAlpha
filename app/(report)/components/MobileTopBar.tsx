'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function MobileTopBar() {
  return (
    <header className="md:hidden sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
      <div className="h-14 px-4 flex items-center justify-between">
        <Link href="/recommendation" className="flex items-center gap-2">
          {/* Light mode logo */}
          <Image
            src="/assets/logo/dark-logo.png"
            alt="AskAlpha"
            width={110}
            height={28}
            className="block dark:hidden h-7 w-auto"
          />
          {/* Dark mode logo */}
          <Image
            src="/assets/logo/logo.png"
            alt="AskAlpha"
            width={110}
            height={28}
            className="hidden dark:block h-7 w-auto"
          />
        </Link>

        {/* Right space reserved for future actions (credits pill, profile) */}
        <div className="w-8" />
      </div>
    </header>
  );
}





