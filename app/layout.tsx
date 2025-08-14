
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/MainLayout";
// import { useEffect } from "react";
// import { initializeDatabase } from '../lib/db';
import { prisma } from '@/lib/supabaseDB';
import { initializeDatabase } from "@/lib/db";


// (async () => {
//   try {
//     await prisma.$queryRaw`SELECT 1`;
//     console.log('✅ DB connected on startup');
//   } catch (err) {
//     console.error('❌ Failed to connect to DB on startup', err);
//   }
// })();



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AskAlpha - AI Equity Research Platform",
  description: "Generate comprehensive equity research reports with AI analysis",
};

// Add a call to initialize database when the app starts
// This will only run on the server
// initializeDatabase().catch(console.error);

export default async  function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

await initializeDatabase();

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
