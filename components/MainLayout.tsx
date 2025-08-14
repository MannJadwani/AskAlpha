'use client';


import { ReportProvider } from "@/context/ReportContext";
import { AuthProvider } from "@/context/AuthContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  
  
  return (
    <AuthProvider>
      <ReportProvider>
        <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
       
          
          <div >
            <main >
              {children}
            </main>
          </div>
        </div>
      </ReportProvider>
    </AuthProvider>
  );
} 