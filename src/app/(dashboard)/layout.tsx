'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { getRoutePermission, hasPermission } from '../../lib/permissions';
import AdminSidebar from '../../components/layout/AdminSidebar';
import AdminHeader from '../../components/layout/AdminHeader';
import { Loader2, ShieldAlert } from 'lucide-react';

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <ShieldAlert className="w-10 h-10 text-muted-foreground" />
      <h1 className="text-lg font-semibold text-foreground">Access denied</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        Your admin role doesn&apos;t have permission to view this page.
      </p>
      <Link href="/" className="text-sm font-medium text-brand-blue hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { checkAuth, user, adminProfile, isLoading } = useAuthStore();
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

  // Sidebar hides links the role can't use; this also blocks opening them by URL,
  // so the page never mounts and never fires API calls the backend would reject.
  const requiredPermission = getRoutePermission(pathname);
  const canView = !requiredPermission || hasPermission(adminProfile, requiredPermission);

  return (
    <div className="flex h-screen overflow-hidden relative zc-app-shell">
      {/* Sidebar navigation — fixed height, does not scroll with main content */}
      <AdminSidebar />

      {/* Main content pane — only this area scrolls */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <AdminHeader />
        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          {canView ? children : <AccessDenied />}
        </main>
        <footer className="shrink-0 border-t border-border bg-card/60 px-6 py-3 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ZapCruise Admin Portal
        </footer>
      </div>
    </div>
  );
}
