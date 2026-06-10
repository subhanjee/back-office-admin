'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '../../store/sidebarStore';
import { useAuthStore } from '../../store/authStore';
import { hasPermission } from '../../lib/permissions';
import ZapCruiseLogo from './ZapCruiseLogo';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  TrendingUp, 
  Database, 
  Cpu, 
  ShieldAlert, 
  Activity,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sparkles,
  MapPin,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  permission?: 'users.list' | 'analytics.view' | 'catalog.view' | 'etl.view' | 'system.view' | 'audit.view' | 'rbac.manage';
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();
  const { adminProfile } = useAuthStore();

  const menuGroups: SidebarGroup[] = [
    {
      title: 'Core',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Users', href: '/users', icon: Users, permission: 'users.list' },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { name: 'Analytics', href: '/analytics', icon: BarChart3, permission: 'analytics.view' },
        { name: 'Cruise Intel', href: '/intelligence', icon: MapPin, permission: 'analytics.view' },
        { name: 'Pricing', href: '/pricing', icon: TrendingUp, permission: 'analytics.view' },
        { name: 'AI Insights', href: '/insights', icon: Sparkles, permission: 'analytics.view' },
      ]
    },
    {
      title: 'Data & Workers',
      items: [
        { name: 'Catalog', href: '/catalog', icon: Database, permission: 'catalog.view' },
        { name: 'Operations', href: '/operations', icon: Cpu, permission: 'etl.view' },
      ]
    },
    {
      title: 'Security & System',
      items: [
        { name: 'Notifications', href: '/notifications', icon: Bell, permission: 'system.view' },
        { name: 'Security & Audit', href: '/security', icon: ShieldAlert, permission: 'audit.view' },
        { name: 'System Health', href: '/system', icon: Activity, permission: 'system.view' },
        { name: 'RBAC', href: '/rbac', icon: ShieldAlert, permission: 'rbac.manage' },
      ]
    }
  ];

  const checkItemVisibility = (item: SidebarItem) => {
    if (!item.permission) return true;
    return hasPermission(adminProfile, item.permission);
  };

  return (
    <aside 
      className={`zc-nav-surface border-r border-gray-200 h-screen shrink-0 transition-all duration-300 ease-in-out flex flex-col z-20 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Header Logo — same as client Navbar */}
      <div
        className={`border-b border-gray-200 shrink-0 ${
          isOpen ? 'h-16 flex items-center justify-between px-4' : 'py-3 flex flex-col items-center gap-2 px-2'
        }`}
      >
        <Link href="/" className="flex items-center justify-center hover:opacity-80 transition-opacity bg-white rounded-lg px-2 py-1">
          <ZapCruiseLogo className={isOpen ? 'h-10 w-auto max-w-[180px]' : 'h-8 w-auto max-w-[56px]'} />
        </Link>
        <button
          onClick={toggle}
          className="text-gray-700 hover:text-blue-600 p-1 rounded-md hover:bg-gray-100 transition-colors shrink-0"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 overflow-y-auto px-3 space-y-6">
        {menuGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter(checkItemVisibility);
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className="space-y-2">
              {isOpen ? (
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.title}
                </h3>
              ) : (
                <div className="h-px bg-gray-200/80 my-4 mx-2" />
              )}

              <ul className="space-y-1">
                {visibleItems.map((item, itemIdx) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <li key={itemIdx}>
                      <Link
                        href={item.href}
                        title={!isOpen ? item.name : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group relative ${
                          isActive 
                            ? 'bg-gray-50 text-blue-600 font-medium' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${
                          isActive ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'
                        }`} />
                        {isOpen && (
                          <span className="text-sm">{item.name}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      {isOpen && adminProfile && (
        <div className="p-4 border-t border-gray-200 flex flex-col gap-1 bg-gray-50">
          <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">
            RBAC Role
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-blue-600 border border-gray-200 self-start">
            {adminProfile.adminRole.replace('_', ' ')}
          </div>
        </div>
      )}
    </aside>
  );
}
