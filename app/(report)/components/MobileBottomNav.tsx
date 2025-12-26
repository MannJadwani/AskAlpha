'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, FileText, User2, Briefcase, BarChart2, GitCompare, FileSearch } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const items = [
    { href: '/report-gen', label: 'AI', icon: <Sparkles className="h-5 w-5" /> },
    { href: '/ipo-report', label: 'IPO', icon: <FileSearch className="h-5 w-5" /> },
    { href: '/compare', label: 'Compare', icon: <GitCompare className="h-5 w-5" /> },
    { href: '/charts', label: 'Charts', icon: <BarChart2 className="h-5 w-5" /> },
    { href: '/pricing', label: 'Pro', icon: <User2 className="h-5 w-5" /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/90 backdrop-blur px-3 py-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}>
      <ul className="grid grid-cols-4 gap-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link href={item.href} className={`flex flex-col items-center justify-center rounded-xl py-2 text-xs transition-colors ${active ? 'bg-white/5 text-foreground ring-1 ring-white/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                {item.icon}
                <span className="mt-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}





