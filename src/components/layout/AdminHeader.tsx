'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useSidebarStore } from '../../store/sidebarStore';
import { Bell, LogOut, User as UserIcon, Menu } from 'lucide-react';
import api from '../../api/api';

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
    <header className="h-16 shrink-0 zc-nav-surface border-b border-gray-200 flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="lg:hidden text-gray-700 hover:text-blue-600 p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-gray-400">/</span>}
              {crumb.active ? (
                <span className="text-gray-900 font-medium">{crumb.name}</span>
              ) : (
                <button
                  onClick={() => router.push(crumb.href)}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {crumb.name}
                </button>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/notifications')}
          className="relative text-gray-700 hover:text-blue-600 p-2 rounded-md hover:bg-gray-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="w-px h-6 bg-gray-200" />

        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold text-gray-900 leading-tight">
                {user.name}
              </div>
              <div className="text-xs text-white">
                {user.email}
              </div>
            </div>
            
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((open) => !open)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                className="w-10 h-10 rounded-md bg-gray-50 border border-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={user.name} 
                    className="w-full h-full rounded-md object-cover"
                  />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
              </button>

              {isUserMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 rounded-md border border-gray-200 bg-white p-1 shadow-lg z-30"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
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
