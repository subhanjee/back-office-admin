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
      className={`zc-nav-surface border-r border-slate-200/70 h-screen shrink-0 transition-[width] duration-300 ease-out flex flex-col z-20 ${
        isOpen ? 'w-64' : 'w-[76px]'
      }`}
    >
      {/* Header Logo */}
      <div
        className={`border-b border-slate-100 shrink-0 flex items-center ${
          isOpen ? 'h-[72px] justify-between px-5' : 'h-[72px] justify-center px-3'
        }`}
      >
        <Link href="/" className="flex items-center hover:opacity-70 transition-opacity duration-150 min-w-0">
          {isOpen ? (
            <ZapCruiseLogo variant="full" className="h-7 w-auto object-contain" />
          ) : (
            <ZapCruiseLogo variant="mark" className="relative block h-9 w-9 overflow-hidden shrink-0 rounded-lg" />
          )}
        </Link>
        {isOpen && (
          <button
            onClick={toggle}
            className="text-slate-400 hover:text-brand-blue p-1.5 rounded-lg hover:bg-slate-100 transition-colors duration-150 shrink-0"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
      {!isOpen && (
        <button
          onClick={toggle}
          className="mx-auto mt-3 text-slate-400 hover:text-brand-blue p-1.5 rounded-lg hover:bg-slate-100 transition-colors duration-150 shrink-0"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Navigation Links */}
      <div className="flex-1 py-5 overflow-y-auto overflow-x-hidden px-3 space-y-6">
        {menuGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter(checkItemVisibility);
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className="space-y-1">
              {isOpen ? (
                <h3 className="px-3 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {group.title}
                </h3>
              ) : (
                <div className="h-px bg-slate-100 my-3 mx-2" />
              )}

              <ul className="space-y-0.5">
                {visibleItems.map((item, itemIdx) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <li key={itemIdx}>
                      <Link
                        href={item.href}
                        title={!isOpen ? item.name : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 ease-out group relative ${
                          isActive
                            ? 'bg-brand-blue/8 text-brand-blue font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-brand-blue" />
                        )}
                        <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors duration-150 ${
                          isActive ? 'text-brand-blue' : 'text-slate-400 group-hover:text-slate-600'
                        }`} strokeWidth={2} />
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
        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
          <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
            RBAC Role
          </div>
          <div className="zc-badge-info self-start">
            {adminProfile.adminRole.replace('_', ' ')}
          </div>
        </div>
      )}
    </aside>
  );
}
