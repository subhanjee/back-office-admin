'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { MousePointerClick, Search, Users, Activity, GitBranch } from 'lucide-react';
import adminApi from '../../../api/admin';

export default function AnalyticsOverview() {
  const [overview, setOverview] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [searchTrends, setSearchTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [o, a, f, t] = await Promise.all([
          adminApi.analytics.overview(),
          adminApi.analytics.userActivity(),
          adminApi.analytics.funnel(30),
          adminApi.analytics.searchTrends(30),
        ]);
        setOverview(o.data.data);
        setActivity(a.data.data);
        setFunnel(f.data.data);
        setSearchTrends(t.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Analytics...</div>;
  }

  const kpis = [
    { label: 'Total Users', value: overview?.totalUsers || 0, icon: Users, color: 'text-blue-400' },
    { label: 'DAU', value: activity?.dau ?? overview?.dau ?? 0, icon: Activity, color: 'text-emerald-400' },
    { label: 'MAU', value: activity?.mau || 0, icon: Users, color: 'text-indigo-400' },
    { label: 'Total Searches', value: overview?.totalSearches || 0, icon: Search, color: 'text-purple-400' },
    { label: 'Total Clicks', value: overview?.totalClicks || 0, icon: MousePointerClick, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Analytics Overview</h1>
        <p className="text-sm text-white mt-1">Platform-wide statistics, funnel, and usage metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="glass-card p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <h3 className="text-2xl font-bold text-white mt-3">{Number(kpi.value).toLocaleString()}</h3>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" /> Conversion funnel (30d)
          </h3>
          <div className="space-y-2">
            {(funnel?.steps || []).map((s: any) => (
              <div key={s.eventType} className="flex justify-between text-sm p-2 rounded-lg bg-muted/10">
                <span className="text-white">{s.eventType}</span>
                <span className="text-muted-foreground">{s.count} ({s.rateFromTop}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-bold text-white mb-4">Search volume (30d)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={searchTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={10} tickFormatter={(v) => v?.slice(5)} />
                <YAxis stroke="#888" fontSize={10} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #333' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 text-emerald-400" /> Affiliate Performance
          </h3>
          <Link href="/analytics/affiliate" className="inline-flex px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
            View Affiliate Report
          </Link>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-400" /> Search trends API
          </h3>
          <p className="text-sm text-muted-foreground">Top queries available at <code className="text-xs">/admin/analytics/search/stats</code></p>
        </div>
      </div>
    </div>
  );
}
