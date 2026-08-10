'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useSidebarStore } from '../../store/sidebarStore';
import { Bell, LogOut, User as UserIcon, Menu } from 'lucide-react';
import api from '../../api/api';
import ThemeToggle from './ThemeToggle';

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { toggle } = useSidebarStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/admin/notifications/unread-count');
        setUnreadCount(response.data.data ?? 0);
      } catch {
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    router.push('/login');
  };

  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    if (paths.length === 0) {
      return [{ name: 'Dashboard', href: '/', active: true }];
    }

    return [
      { name: 'Dashboard', href: '/', active: false },
      ...paths.map((path, idx) => {
        const href = '/' + paths.slice(0, idx + 1).join('/');
        const isLast = idx === paths.length - 1;
        const name = path
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        return { name, href, active: isLast };
      })
    ];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-[72px] shrink-0 zc-nav-surface border-b border-border flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="lg:hidden text-muted-foreground hover:text-brand-blue p-2 rounded-lg hover:bg-muted transition-colors duration-150"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-muted-foreground/50">/</span>}
              {crumb.active ? (
                <span className="text-foreground font-semibold">{crumb.name}</span>
              ) : (
                <button
                  onClick={() => router.push(crumb.href)}
                  className="text-muted-foreground hover:text-brand-blue transition-colors duration-150"
                >
                  {crumb.name}
                </button>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <button
          onClick={() => router.push('/notifications')}
          className="relative text-muted-foreground hover:text-brand-blue p-2.5 rounded-lg hover:bg-muted transition-colors duration-150"
          title="Notifications"
        >
          <Bell className="w-[18px] h-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-card">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="w-px h-6 bg-border" />

        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold text-foreground leading-tight">
                {user.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {user.email}
              </div>
            </div>

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((open) => !open)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                className="w-9 h-9 rounded-xl bg-brand-navy dark:bg-brand-blue text-white flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-slate-800 dark:hover:bg-blue-500"
              >
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.name}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </button>

              {isUserMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-popover p-1.5 shadow-premium z-30"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
