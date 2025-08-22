'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CurrentUser } from '@/types/auth';
import { ShinyButton } from '@/components/magicui/shiny-button';
import { FileText, Sparkles, FolderOpen, Menu } from 'lucide-react';

export default function Sidebar({
  isOpen,
  toggleSidebar,
  isCollapsed,
  toggleCollapsed
}: {
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const { fetchUser } = useAuth();
  const [User, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { creditsData } = useAuth();
	const [profileOpen, setProfileOpen] = useState(false);

  // console.log('Shared data SIDEEBAR:', creditsData);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await fetchUser();
        if (user) {
          setUser(user);
          console.log('User fetched successfully: sidebar', user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false); // Stop loader in all cases
      }
    };
    getUser();
  }, []);


  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/users/signout', {
        method: 'POST',
      });

      if (res.ok) {
        console.log('Signed out successfully');

        window.location.href = '/sign-in';
      }
    } catch (err) {
      console.error('Error signing out', err);
    }
  };


  // Navigation items with their paths and icons
  const navItems = [
    {
      name: 'AI Recommendations',
      path: '/recommendation',
      icon: (<Sparkles className="h-4 w-4 text-black dark:text-neutral-400" />),
    },
    {
      name: 'Generate Full Reports',
      path: '/company-report',
      icon: (<FileText className="h-4 w-4 text-black dark:text-neutral-400" />),
    },
    
    // {
    //   name: 'My Reports',
    //   path: '/my-reports',
    //   icon: (<FolderOpen className="h-4 w-4 text-black dark:text-neutral-400" />),
    // },
	// Subscription link moved into the profile menu below
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-20"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile open button */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          aria-label="Open menu"
          className="fixed top-4 right-4 md:hidden z-40 rounded-full bg-white/5 ring-1 ring-inset ring-white/10 p-2 text-zinc-200 backdrop-blur hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-screen w-[85vw] transform transition-all duration-300 ease-in-out bg-[#0a0c10] border-r border-white/10 shadow-xl ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } ${isCollapsed ? 'md:w-16' : 'md:w-72'}`}
      >
        <div className="h-full flex flex-col relative">
          {/* Collapse Toggle Button - Desktop Only */}
          <button
            onClick={toggleCollapsed}
            className={`hidden md:flex absolute -right-3 top-6 z-40 w-6 h-6 bg-white/5 ring-1 ring-inset ring-white/10 text-zinc-200 rounded-full items-center justify-center shadow-lg hover:bg-white/10 transition-all duration-200 ${isCollapsed ? 'rotate-180' : ''
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-zinc-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Sidebar header */}
          <div className={` flex h-20 items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} border-b border-white/10 bg-white/5 backdrop-blur`}> 
              <span className="relative w-full  flex justify-center items-center " style={{ display: 'inline-block' }}>
                {isCollapsed ? (
                  <Image src="/assets/logo/icon.png" alt="AskAlpha" width={50} height={24} className="h-8 w-auto object-contain" />
                ) : (
                  <Image src="/assets/logo/logo.png" alt="AskAlpha" width={130} height={54} className=" w-auto object-contain" />
                )}
              </span>
            {!isCollapsed && (
              <button
                className="md:hidden text-zinc-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                onClick={toggleSidebar}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isDisabled = item.path === '' && (!User?.plan || User.plan.trim() === '');
                // console.log('User plan: ', User?.plan, ' isDisabled: ', isDisabled, 'pathname', item.path);
                return (
                  <li key={item.path}>
                    <div className="relative group">
                      <Link
                        href={isDisabled ? '#' : item.path}
                        onClick={(e) => isDisabled && e.preventDefault()}
                        className={`group flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-3 rounded-xl transition-all duration-200
                          ${pathname === item.path
                            ? 'bg-white/10 text-white ring-1 ring-inset ring-white/15'
                            : isDisabled
                              ? 'cursor-not-allowed text-zinc-500'
                              : 'text-zinc-300 hover:bg-white/5 hover:ring-1 hover:ring-inset hover:ring-white/10'
                          }
                        `}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <span className={`flex-shrink-0 ${pathname === item.path ? 'text-white' : 'text-zinc-300 group-hover:text-zinc-100'}`}>
                          {item.icon}
                        </span>
                        {!isCollapsed && (
                          <span className={`font-medium truncate ${isDisabled ? 'text-zinc-500' : ''}`}>
                            {item.name}
                          </span>
                        )}
                      </Link>

                      {isDisabled && (
                        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                          Subscribe to a plan to see the reports
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}

            </ul>              {!isCollapsed && (
              <div className="mt-8">
               
                
              </div>
            )}
          </nav>

          {/* Sidebar footer - Profile menu */}
          <div className={`border-t border-white/10 ${isCollapsed ? 'p-2' : 'p-4'} relative`}>
            {loading ? (
              <p>Loading...</p>
            ) : User ? (
              <>
                {!isCollapsed ? (
                  <button onClick={() => setProfileOpen(!profileOpen)} className="w-full flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-left hover:bg-white/10 transition">
                    <div className="w-8 h-8 rounded-full bg-white/10 ring-1 ring-inset ring-white/10 text-white flex items-center justify-center text-sm">
                      {User.user.email ? User.user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{User.user.email || ''}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`ml-auto h-4 w-4 text-zinc-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.187l3.71-3.956a.75.75 0 111.08 1.04l-4.24 4.52a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>
                ) : (
                  <button onClick={() => setProfileOpen(!profileOpen)} className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-inset ring-white/10 text-white">
                    {User.user.email ? User.user.email.charAt(0).toUpperCase() : 'U'}
                  </button>
                )}

                {profileOpen && (
                  <div className={`${isCollapsed ? 'absolute left-2 right-2 bottom-14' : 'absolute left-4 right-4 bottom-16'} rounded-xl border border-white/10 bg-[#0a0c10]/95 backdrop-blur p-4 shadow-2xl`}>
                    <div className="mb-3">
                      <p className="text-sm text-zinc-400">Signed in as</p>
                      <p className="text-sm font-medium text-white truncate">{User.user.email || ''}</p>
                    </div>
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Credits left</span>
                      <span className="text-white font-semibold">{creditsData || 5}</span>
                    </div>
                    <div className="mb-3">
                      <Link href="/pricing" className="inline-flex items-center rounded-lg px-3 py-2 bg-white/5 ring-1 ring-inset ring-white/10 text-zinc-200 hover:bg-white/10">Manage subscription</Link>
                    </div>
                    <ShinyButton onClick={handleSignOut} className="w-full justify-center cursor-pointer">Sign Out</ShinyButton>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/sign-in" className="w-full"><ShinyButton className="w-full justify-center">Sign In</ShinyButton></Link>
                <Link href="/sign-up" className="w-full"><ShinyButton className="w-full justify-center !bg-white/5 !text-zinc-200 !ring-white/10">Sign Up</ShinyButton></Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
} 