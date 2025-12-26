'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Command } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'action' | 'search';
}

export function useKeyboardShortcuts(searchAction?: () => void) {
  const router = useRouter();
  const pathname = usePathname();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const shortcuts: Shortcut[] = [
      {
        key: 'k',
        description: 'Open search',
        action: () => {
          if (searchAction) {
            searchAction();
          } else if (pathname === '/my-reports') {
            const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
          }
        },
        category: 'search',
      },
      {
        key: 'g h',
        description: 'Go to Home',
        action: () => router.push('/'),
        category: 'navigation',
      },
      {
        key: 'g r',
        description: 'Go to Reports',
        action: () => router.push('/my-reports'),
        category: 'navigation',
      },
      {
        key: 'g t',
        description: 'Go to Top Stocks',
        action: () => router.push('/top-stocks'),
        category: 'navigation',
      },
      {
        key: 'g p',
        description: 'Go to Portfolio',
        action: () => router.push('/portfolio'),
        category: 'navigation',
      },
      {
        key: 'g c',
        description: 'Go to Compare',
        action: () => router.push('/compare'),
        category: 'navigation',
      },
      {
        key: '?',
        description: 'Show shortcuts',
        action: () => setShowShortcuts(true),
        category: 'action',
      },
      {
        key: 'Escape',
        description: 'Close modals / Cancel',
        action: () => {
          const modals = document.querySelectorAll('[role="dialog"]');
          modals.forEach((modal) => {
            const closeButton = modal.querySelector('button[aria-label*="close" i], button[aria-label*="cancel" i]');
            if (closeButton) (closeButton as HTMLButtonElement).click();
          });
          setShowShortcuts(false);
        },
        category: 'action',
      },
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Cmd/Ctrl+K for search even in inputs
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          shortcuts.find(s => s.key === 'k')?.action();
        }
        return;
      }

      // Cmd/Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        shortcuts.find(s => s.key === 'k')?.action();
        return;
      }

      // ? for shortcuts help
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        shortcuts.find(s => s.key === '?')?.action();
        return;
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        shortcuts.find(s => s.key === 'Escape')?.action();
        return;
      }

      // g + key for navigation (GitHub-style)
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        const handleSecondKey = (e2: KeyboardEvent) => {
          if (e2.key === 'h') {
            e2.preventDefault();
            shortcuts.find(s => s.key === 'g h')?.action();
          } else if (e2.key === 'r') {
            e2.preventDefault();
            shortcuts.find(s => s.key === 'g r')?.action();
          } else if (e2.key === 't') {
            e2.preventDefault();
            shortcuts.find(s => s.key === 'g t')?.action();
          } else if (e2.key === 'p') {
            e2.preventDefault();
            shortcuts.find(s => s.key === 'g p')?.action();
          } else if (e2.key === 'c') {
            e2.preventDefault();
            shortcuts.find(s => s.key === 'g c')?.action();
          }
          document.removeEventListener('keydown', handleSecondKey);
        };
        document.addEventListener('keydown', handleSecondKey);
        setTimeout(() => {
          document.removeEventListener('keydown', handleSecondKey);
        }, 1000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, pathname, searchAction]);

  return { showShortcuts, setShowShortcuts };
}

export function ShortcutsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const shortcuts: Array<{ keys: string[]; description: string; category: string }> = [
    { keys: ['⌘', 'K'], description: 'Open search', category: 'Search' },
    { keys: ['G', 'H'], description: 'Go to Home', category: 'Navigation' },
    { keys: ['G', 'R'], description: 'Go to Reports', category: 'Navigation' },
    { keys: ['G', 'T'], description: 'Go to Top Stocks', category: 'Navigation' },
    { keys: ['G', 'P'], description: 'Go to Portfolio', category: 'Navigation' },
    { keys: ['G', 'C'], description: 'Go to Compare', category: 'Navigation' },
    { keys: ['?'], description: 'Show shortcuts', category: 'Actions' },
    { keys: ['Esc'], description: 'Close modals', category: 'Actions' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Command className="h-5 w-5 text-foreground" />
            <h2 className="text-2xl font-bold text-foreground">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {['Search', 'Navigation', 'Actions'].map((category) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <span className="text-foreground">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <kbd
                            key={keyIdx}
                            className="px-2 py-1 text-xs font-semibold rounded bg-muted border border-border text-foreground"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-border text-sm text-muted-foreground">
          <p>Press <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted border border-border">?</kbd> anytime to see this help</p>
        </div>
      </div>
    </div>
  );
}




