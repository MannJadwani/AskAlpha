
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/MainLayout";
// import { useEffect } from "react";
// import { initializeDatabase } from '../lib/db';
// import { prisma } from '@/lib/supabaseDB';
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://askalpha.tech'),
  title: {
    default: 'AskAlpha – AI Stock Analysis & Buy/Sell/Hold Recommendations',
    template: '%s | AskAlpha',
  },
  description: 'Free AI stock analysis tool delivering Buy/Sell/Hold recommendations in under 60 seconds. SEBI-compliant, global coverage, professional reports.',
  keywords: [
    'AI stock analysis',
    'buy sell hold recommendations',
    'stock research tool',
    'equity research',
    'SEBI compliant research',
    'DCF valuation',
    'stock analysis India',
    'NSE BSE NYSE NASDAQ',
  ],
  openGraph: {
    title: 'AskAlpha – AI Stock Analysis & Buy/Sell/Hold Recommendations',
    description: 'Get instant AI-powered stock analysis. Professional equity research for traders, investors, and advisors.',
    url: '/',
    siteName: 'AskAlpha',
    images: [
      { url: '/assets/og/askalpha-og.jpg', width: 1200, height: 630, alt: 'AskAlpha – AI Stock Analysis' },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AskAlpha – AI Stock Analysis',
    description: 'Free AI stock analysis with Buy/Sell/Hold in 60s. Global coverage and SEBI-compliant outputs.',
    images: ['/assets/og/askalpha-og.jpg'],
    creator: '@askalpha',
  },
  icons: {
    icon: '/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
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
