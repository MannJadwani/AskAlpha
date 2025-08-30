'use client';


import { ReportProvider } from "@/context/ReportContext";
import { AuthProvider } from "@/context/AuthContext";
import { Analytics } from "@vercel/analytics/next"
import Footer from "./Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  
  
  return (
<div>
<Analytics />

<AuthProvider>
  <ReportProvider>
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
   
      
      <div className="flex-1">
        <main>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  </ReportProvider>
</AuthProvider>
</div>
  );
} 