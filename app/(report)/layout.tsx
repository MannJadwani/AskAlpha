'use client'
import { Geist, Geist_Mono } from "next/font/google";

import Sidebar from "../../components/Sidebar";
import MobileBottomNav from "./components/MobileBottomNav";
import MobileTopBar from "./components/MobileTopBar";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <div className={`flex-1 flex flex-col transition-all duration-300 md:ml-[var(--sidebar-width)]`}>
          <MobileTopBar />
          <main className="flex-1 pt-14 pb-20 md:pt-0 md:pb-0">
            {children}
          </main>
        </div>

        <MobileBottomNav />
      </div>
    </div>
  );
}
