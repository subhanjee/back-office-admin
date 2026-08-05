'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { 
  Users, 
  MousePointerClick, 
  Ship, 
  CalendarRange, 
  AlertTriangle, 
  Activity, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import api from '../../api/api';

interface HealthData {
  status: string;
  timestamp: string;
  services: {
    database: { status: string; latencyMs: number };
    redis: { status: string; latencyMs: number; totalKeys: number };
    pm2: { status: string; workers: any[] };
  };
}

interface AuditLog {
  id: string;
  adminEmail: string;
  adminRole: string;
  action: string;
  resource: string;
  createdAt: string;
}

export default function DashboardHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch System Health
        const healthPromise = api.get('/admin/system/health');
        // Fetch Audit Logs
        const auditPromise = api.get('/admin/audit/logs?limit=5');
        // Fetch Analytics Overview
        const overviewPromise = api.get('/admin/analytics/overview');

        const [healthRes, auditRes, overviewRes] = await Promise.all([
          healthPromise, auditPromise, overviewPromise
        ]);

        setHealth(healthRes.data.data);
        setAuditLogs(auditRes.data.data.logs);
        setOverview(overviewRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { name: 'Total Users', value: overview?.totalUsers || '0', change: `${overview?.dau || 0} DAU`, icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/8' },
    { name: 'Affiliate Clicks', value: overview?.totalClicks || '0', change: `${overview?.totalSearches || 0} Searches`, icon: MousePointerClick, color: 'text-success', bg: 'bg-success/8' },
    { name: 'Active Cruises', value: overview?.activeCruises || '0', change: 'Live from DB', icon: Ship, color: 'text-brand-teal', bg: 'bg-brand-teal/8' },
    { name: 'Active Sailings', value: overview?.activeSailings || '0', change: 'Live from DB', icon: CalendarRange, color: 'text-warning', bg: 'bg-warning/8' },
  ];

  if (loading) {
    return (
      <div className="space-y-8 zc-reveal">
        {/* Welcome Banner Skeleton */}
        <div className="zc-card flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 h-auto md:h-[104px]">
          <div className="space-y-3 w-full max-w-md">
            <div className="h-6 bg-slate-200 animate-pulse rounded-md w-3/4"></div>
            <div className="h-4 bg-slate-200 animate-pulse rounded-md w-1/2"></div>
          </div>
          <div className="h-6 bg-slate-200 animate-pulse rounded-full w-48 shrink-0"></div>
        </div>

        {/* KPI Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="zc-card p-6 h-[140px] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="h-4 bg-slate-200 animate-pulse rounded-md w-1/2"></div>
                <div className="w-10 h-10 bg-slate-200 animate-pulse rounded-xl"></div>
              </div>
              <div className="space-y-2">
                <div className="h-8 bg-slate-200 animate-pulse rounded-md w-1/3"></div>
                <div className="h-3 bg-slate-200 animate-pulse rounded-md w-1/4"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Health Panel Skeleton */}
          <div className="lg:col-span-2 zc-card p-6 space-y-6 h-auto sm:h-[300px]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="h-5 bg-slate-200 animate-pulse rounded-md w-1/3"></div>
              <div className="h-4 bg-slate-200 animate-pulse rounded-md w-24"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="h-24 bg-slate-200 animate-pulse rounded-xl"></div>
              <div className="h-24 bg-slate-200 animate-pulse rounded-xl"></div>
            </div>
          </div>

          {/* Logs Panel Skeleton */}
          <div className="zc-card p-6 space-y-6 flex flex-col h-auto sm:h-[300px]">
             <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="h-5 bg-slate-200 animate-pulse rounded-md w-1/2"></div>
              <div className="h-4 bg-slate-200 animate-pulse rounded-md w-20"></div>
            </div>
            <div className="space-y-4 flex-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-200 animate-pulse rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 zc-reveal">
      {/* Welcome Banner */}
      <div className="zc-card flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
        <div>
          <h1 className="zc-page-title">
            Welcome back, {user?.name}
          </h1>
          <p className="zc-page-subtitle">
            Here is what is happening across the ZapCruise platform today.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 z-10">
          <span className="text-xs text-slate-400">System Status</span>
          <span className={health?.status === 'healthy' ? 'zc-badge-success' : 'zc-badge-warning'}>
            {health?.status === 'healthy' ? 'All systems operational' : 'Degraded performance'}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="zc-card zc-card-hover p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="zc-stat-label uppercase tracking-wider text-xs">{stat.name}</span>
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-all duration-300 ease-out group-hover:scale-105`}>
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{stat.value}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-brand-blue" />
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Health Strip & Active Workers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Services Status & Health Panel */}
        <div className="lg:col-span-2 zc-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="zc-section-title flex items-center gap-2">
              <Activity className="w-[18px] h-[18px] text-brand-blue" />
              Core infrastructure health
            </h2>
            <button
              onClick={() => router.push('/system')}
              className="text-xs text-brand-blue hover:text-brand-navy flex items-center gap-1.5 transition-colors duration-150 font-medium cursor-pointer"
            >
              Detailed view
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Database Card */}
            <div className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">PostgreSQL DB</span>
                <span className={health?.services.database.status === 'healthy' ? 'zc-badge-success' : 'zc-badge-danger'}>
                  {health?.services.database.status.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-900">
                <Globe className="w-[18px] h-[18px] text-slate-400" />
                <span className="text-lg font-bold tabular-nums">{health?.services.database.latencyMs || 0} ms</span>
                <span className="text-xs text-slate-400">query latency</span>
              </div>
            </div>

            {/* Redis Cache Card */}
            <div className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Redis Cache</span>
                <span className={health?.services.redis.status === 'healthy' ? 'zc-badge-success' : 'zc-badge-danger'}>
                  {health?.services.redis.status.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-900">
                <Zap className="w-[18px] h-[18px] text-slate-400" />
                <span className="text-lg font-bold tabular-nums">{health?.services.redis.totalKeys || 0}</span>
                <span className="text-xs text-slate-400">cached keys</span>
              </div>
            </div>
          </div>

          {/* PM2 processes miniature status */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              PM2 scraper workers & evaluators ({health?.services.pm2.workers.length || 0})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {health?.services.pm2.workers.slice(0, 4).map((worker, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/40 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 truncate max-w-[100px]">{worker.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    worker.status === 'online' ? 'bg-success' : 'bg-danger'
                  }`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Audit Logs Panel */}
        <div className="zc-card p-6 space-y-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="zc-section-title flex items-center gap-2">
              <Clock className="w-[18px] h-[18px] text-brand-blue" />
              Recent operations
            </h2>
            <button
              onClick={() => router.push('/security')}
              className="text-xs text-brand-blue hover:text-brand-navy flex items-center gap-1.5 transition-colors duration-150 font-medium cursor-pointer"
            >
              All logs
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Logs Feed */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {auditLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-8">
                <ShieldCheck className="w-10 h-10 text-slate-200 mb-2" />
                <span className="text-xs">No recent administrative logs</span>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/40 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="zc-badge-info">{log.action}</span>
                    <span className="text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{log.adminEmail}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      {log.resource}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
