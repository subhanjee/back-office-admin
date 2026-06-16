'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AnalyticsChart from '../../../components/charts/AnalyticsChart';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { MousePointerClick, Search, Users, Activity, GitBranch } from 'lucide-react';
import adminApi from '../../../api/admin';

export default function AnalyticsOverview() {
  const [overview, setOverview] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [searchTrends, setSearchTrends] = useState<any[]>([]);
  const [searchStats, setSearchStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use Promise.allSettled so one failing call doesn't wipe out all data
        const results = await Promise.allSettled([
          adminApi.analytics.overview(),
          adminApi.analytics.userActivity(),
          adminApi.analytics.funnel(30),
          adminApi.analytics.searchTrends(30),
          adminApi.analytics.search(),
        ]);

        const [o, a, f, t, s] = results;

        if (o.status === 'fulfilled') {
          setOverview(o.value.data.data);
        }
        if (a.status === 'fulfilled') {
          setActivity(a.value.data.data);
        }
        if (f.status === 'fulfilled') {
          const funnelData = f.value.data.data;
          setFunnel(funnelData && typeof funnelData === 'object' ? funnelData : { steps: [] });
        } else {
          setFunnel({ steps: [] });
        }
        if (t.status === 'fulfilled') {
          const trendData = t.value.data.data || [];
          setSearchTrends(Array.isArray(trendData) ? trendData : []);
        } else {
          setSearchTrends([]);
        }
        if (s.status === 'fulfilled') {
          setSearchStats(s.value.data.data || null);
        } else {
          setSearchStats(null);
        }

        // Show warning if any call failed
        const failedCalls = results.filter(r => r.status === 'rejected');
        if (failedCalls.length > 0) {
          console.warn('Some analytics calls failed:', failedCalls.map(r => (r as PromiseRejectedResult).reason?.message));
        }
      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const defaultFunnelSteps = [
    { eventType: 'SEARCH', count: 0, rateFromTop: 0 },
    { eventType: 'VIEW_CRUISE', count: 0, rateFromTop: 0 },
    { eventType: 'VIEW_SAILING', count: 0, rateFromTop: 0 },
    { eventType: 'CLICK_OTA', count: 0, rateFromTop: 0 },
    { eventType: 'TRACK_SAILING', count: 0, rateFromTop: 0 },
    { eventType: 'REGISTER', count: 0, rateFromTop: 0 },
  ];

  const funnelSteps = useMemo(() => {
    const raw = funnel ?? {};
    let steps: any[] = [];

    if (Array.isArray(raw)) {
      steps = raw;
    } else if (Array.isArray(raw.steps)) {
      steps = raw.steps;
    } else if (Array.isArray(raw.data)) {
      steps = raw.data;
    } else if (Array.isArray(raw.results)) {
      steps = raw.results;
    } else if (raw && typeof raw === 'object') {
      const entries = Object.entries(raw).filter(([, value]) => typeof value !== 'undefined');

      if (entries.length > 0 && entries.every(([, value]) => typeof value === 'number' || typeof value === 'string')) {
        steps = entries.map(([key, value]) => ({ eventType: key, count: value }));
      }
    }

    const parseNumber = (value: any) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const normalized = value.replace(/[^0-9.-]+/g, '');
        const parsed = parseFloat(normalized);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const normalizeCount = (step: any) => {
      const rawCount = step?.count ?? step?.value ?? step?.total ?? step?.users ?? step?.metric ?? step?._count?.total ?? 0;
      return parseNumber(rawCount);
    };

    const normalizeEvent = (step: any, index: number) => {
      return (
        step?.eventType || step?.event || step?.name || step?.label || step?.type || `step_${index}`
      );
    };

    const normalized = steps.map((step: any, index: number) => ({
      ...step,
      eventType: normalizeEvent(step, index),
      count: normalizeCount(step),
      rateFromTop: parseNumber(step?.rateFromTop ?? step?.rate ?? step?.percentage ?? 0),
    }));

    if (normalized.length === 0) {
      return defaultFunnelSteps;
    }

    const baseCount = Math.max(...normalized.map((step) => step.count), 0);

    return normalized.map((step) => ({
      ...step,
      rateFromTop:
        step.rateFromTop > 0
          ? Math.round(step.rateFromTop)
          : baseCount > 0
          ? Math.round((step.count / baseCount) * 100)
          : 0,
      count: step.count,
    }));
  }, [funnel]);

  if (loading) {
    return <LoadingSpinner message="Loading Analytics..." />;
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

      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-400">
          ⚠️ {error}
        </div>
      )}

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
            {funnelSteps.map((s: any) => (
              <div key={s.eventType} className="flex justify-between text-sm p-2 rounded-lg bg-muted/10">
                <span className="text-white">{s.eventType}</span>
                {/* ({s.rateFromTop}%) */}
                <span className="text-muted-foreground">{s.count} </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-bold text-white mb-4">Search volume (30d)</h3>
          <AnalyticsChart data={searchTrends} xKey="date" yKey="count" height={220} color="#8b5cf6" legends={[{ label: 'Search Volume', color: '#8b5cf6' }]} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 text-emerald-400" /> Affiliate Performance
          </h3>
          <Link href="/analytics/affiliate" className="inline-flex px-4 py-2 bg-orange-500  bg-emerald-600 text-white rounded-lg text-sm font-medium">
            View Affiliate Report
          </Link>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-400" /> Top Search Queries (30d)
          </h3>
          {searchStats && searchStats.trending && searchStats.trending.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                {(searchStats.totalSearches || 0).toLocaleString()} total searches
              </p>
              {searchStats.trending.map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/10">
                  <span className="text-sm text-white flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}.</span>
                    {t.query}
                  </span>
                  <span className="text-xs font-mono text-purple-400">{t.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-center">
              <Search className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No search data available yet</p>
              <p className="text-xs text-muted-foreground mt-1">Searches will appear here as users query the platform</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
