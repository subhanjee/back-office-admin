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
    { name: 'Total Users', value: overview?.totalUsers || '0', change: `${overview?.dau || 0} DAU`, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'Affiliate Clicks', value: overview?.totalClicks || '0', change: `${overview?.totalSearches || 0} Searches`, icon: MousePointerClick, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'Active Cruises', value: overview?.activeCruises || '0', change: 'Live from DB', icon: Ship, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { name: 'Active Sailings', value: overview?.activeSailings || '0', change: 'Live from DB', icon: CalendarRange, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-gray-600">
            Here is what is happening across the ZapCruise platform today.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 z-10">
          <span className="text-xs text-muted-foreground">System Status:</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            health?.status === 'healthy' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
            {health?.status === 'healthy' ? 'ALL SYSTEMS OPERATIONAL' : 'DEGRADED PERFORMANCE'}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-card p-6 rounded-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.name}</span>
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Health Strip & Active Workers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Services Status & Health Panel */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-border p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Core Infrastructure Health
            </h2>
            <button 
              onClick={() => router.push('/system')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors font-medium"
            >
              Detailed View
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Database Card */}
            <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">PostgreSQL DB</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  health?.services.database.status === 'healthy' 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {health?.services.database.status.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <span className="text-lg font-bold">{health?.services.database.latencyMs || 0} ms</span>
                <span className="text-xs text-muted-foreground">query latency</span>
              </div>
            </div>

            {/* Redis Cache Card */}
            <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Redis Cache</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  health?.services.redis.status === 'healthy' 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {health?.services.redis.status.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Zap className="w-5 h-5 text-muted-foreground" />
                <span className="text-lg font-bold">{health?.services.redis.totalKeys || 0}</span>
                <span className="text-xs text-muted-foreground">cached keys</span>
              </div>
            </div>
          </div>

          {/* PM2 processes miniature status */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              PM2 Scraper Workers & Evaluators ({health?.services.pm2.workers.length || 0})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {health?.services.pm2.workers.slice(0, 4).map((worker, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-border bg-muted/5 flex items-center justify-between">
                  <span className="text-xs font-medium text-white truncate max-w-[100px]">{worker.name}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    worker.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'
                  }`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Audit Logs Panel */}
        <div className="glass-panel rounded-2xl border border-border p-6 space-y-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Recent Operations
            </h2>
            <button 
              onClick={() => router.push('/security')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors font-medium"
            >
              All Logs
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Logs Feed */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {auditLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center py-8">
                <ShieldCheck className="w-10 h-10 text-muted-foreground/35 mb-2" />
                <span className="text-xs">No recent administrative logs</span>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl border border-border bg-muted/5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-400">{log.action}</span>
                    <span className="text-muted-foreground font-mono">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{log.adminEmail}</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase font-bold tracking-wider">
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
