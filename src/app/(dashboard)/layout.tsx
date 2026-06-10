'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import AdminSidebar from '../../components/layout/AdminSidebar';
import AdminHeader from '../../components/layout/AdminHeader';
import ZapCruisePageBackground from '../../components/layout/ZapCruisePageBackground';
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
      <div className="min-h-screen relative flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <ZapCruisePageBackground />
        <Loader2 className="w-8 h-8 animate-spin text-[#0099FF]" />
        <span className="text-sm text-white">Validating session...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden relative">
      <ZapCruisePageBackground />
      {/* Sidebar navigation — fixed height, does not scroll with main content */}
      <AdminSidebar />

      {/* Main content pane — only this area scrolls */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <AdminHeader />
        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
