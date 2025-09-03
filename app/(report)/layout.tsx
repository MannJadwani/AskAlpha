'use client'
import { Geist, Geist_Mono } from "next/font/google";

import Sidebar from "../../components/Sidebar";


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
        <Sidebar />

        <div className={`flex-1 flex flex-col transition-all duration-300 md:ml-72`}>
          <main className="flex-1 ">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
