'use client'
import { Geist, Geist_Mono } from "next/font/google";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "./components/Header";


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


  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCollapsed = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-300">
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar} 
          isCollapsed={sidebarCollapsed}
          toggleCollapsed={toggleCollapsed}
        />

        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-72'
        }`}>
          <main className="flex-1 ">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
