'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import AdminSidebar from '../../components/layout/AdminSidebar';
import AdminHeader from '../../components/layout/AdminHeader';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { checkAuth, user, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const authenticated = await checkAuth();
      if (!authenticated) {
        router.push('/login');
      } else {
        setIsChecking(false);
      }
    };
    initAuth();
  }, [checkAuth, router]);

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center gap-3 zc-app-shell text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        <span className="text-sm text-muted-foreground">Validating session...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden relative zc-app-shell">
      {/* Sidebar navigation — fixed height, does not scroll with main content */}
      <AdminSidebar />

      {/* Main content pane — only this area scrolls */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <AdminHeader />
        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          {children}
        </main>
        <footer className="shrink-0 border-t border-border bg-card/60 px-6 py-3 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ZapCruise Admin Portal
        </footer>
      </div>
    </div>
  );
}
