'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { normalizeAffiliateStats } from '../../../../lib/affiliateAnalytics';
import { MousePointerClick, TrendingUp, Globe, Bed, RefreshCw } from 'lucide-react';
import adminApi from '../../../../api/admin';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  color: '#111827',
};

function OtaTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div style={tooltipStyle} className="px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-gray-900">{row.name}</p>
      <p className="text-emerald-600">{row.clicks} click{row.clicks === 1 ? '' : 's'}</p>
    </div>
  );
}

function CabinTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div style={tooltipStyle} className="px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-gray-900">{row.name}</p>
      <p className="text-purple-600">{row.value} click{row.value === 1 ? '' : 's'}</p>
    </div>
  );
}

export default function AffiliateAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const res = await adminApi.analytics.affiliate();
      setStats(res.data.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Affiliate analytics error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load affiliate analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const normalized = useMemo(() => normalizeAffiliateStats(stats), [stats]);
  const totalClicks = normalized.overview.totalClicks;
  const last7Days = normalized.overview.last7Days;
  const uniqueOtas = normalized.overview.uniqueOtas;
  const recentCount = normalized.overview.recentCount;
  const byOtaData = normalized.overview.byOta;
  const byCabinData = normalized.overview.byCabin;
  const recentClicks = normalized.overview.recent;

  const chartVersion = useMemo(
    () =>
      `${byOtaData.map((d) => `${d.name}:${d.clicks}`).join('|')}|${byCabinData
        .map((d) => `${d.name}:${d.value}`)
        .join('|')}`,
    [byOtaData, byCabinData],
  );

  if (loading && !stats) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Affiliate Analytics...</div>;
  }

  if (error && !stats) {
    return <div className="p-8 text-red-400">Error: {error}</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <MousePointerClick className="w-6 h-6 text-emerald-400" />
            Affiliate Analytics
          </h1>
          <p className="text-sm text-white mt-1">
            Outbound clicks and conversions.
            {lastUpdated ? (
              <span className="text-muted-foreground ml-1">
                Last updated {lastUpdated.toLocaleTimeString()}
              </span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 cursor-pointer border border-border text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Clicks</span>
          <h3 className="text-3xl font-bold text-white mt-2">{totalClicks || 0}</h3>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Last 7 Days</span>
          <h3 className="text-3xl font-bold text-emerald-400 mt-2">{last7Days || 0}</h3>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Unique OTAs</span>
          <h3 className="text-3xl font-bold text-blue-400 mt-2">{uniqueOtas || 0}</h3>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent (24h)</span>
          <h3 className="text-3xl font-bold text-purple-400 mt-2">{recentCount || 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Clicks by OTA <span className="text-xs font-normal text-muted-foreground normal-case">(last 7 days)</span>
          </h3>
          {byOtaData.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-sm text-muted-foreground text-center px-4">
              <p className="font-medium text-white mb-2">No OTA click data in the last 7 days.</p>
            </div>
          ) : (
            <div className="h-72" key={`ota-${chartVersion}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byOtaData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#111827', fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={56}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#111827', fontSize: 11 }}
                    stroke="#9ca3af"
                  />
                  <RechartsTooltip
                    content={<OtaTooltip />}
                    cursor={{ fill: 'rgba(16,185,129,0.12)' }}
                    wrapperStyle={{ outline: 'none' }}
                    contentStyle={{ backgroundColor: '#ffffff', border: 'none', padding: 0, boxShadow: 'none' }}
                  />
                  <Bar dataKey="clicks" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <Bed className="w-4 h-4 text-purple-400" />
            Clicks by Cabin Type <span className="text-xs font-normal text-muted-foreground normal-case">(last 7 days)</span>
          </h3>
          <div className="h-72 flex justify-center">
            {byCabinData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground text-center px-4">
                No cabin-type clicks yet. Clicks are recorded when users open an OTA from a specific cabin row.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" key={`cabin-${chartVersion}`}>
                <PieChart>
                  <Pie
                    data={byCabinData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {byCabinData.map((entry: any, index: number) => (
                      <Cell key={`cell-${entry.name}-${entry.value}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={<CabinTooltip />}
                    wrapperStyle={{ outline: 'none' }}
                    contentStyle={{ backgroundColor: '#ffffff', border: 'none', padding: 0, boxShadow: 'none' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-border">
        <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          Recent Affiliate Clicks (Latest 20)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/10 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">OTA</th>
                <th className="px-4 py-3 font-medium">Sailing ID</th>
                <th className="px-4 py-3 font-medium">Cabin</th>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {recentClicks.length > 0 ? (
                recentClicks.map((click: any) => (
                  <tr key={click.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">
                      {new Date(click.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{click.otaName || ''}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{click.sailingId}</td>
                    <td className="px-4 py-3">
                      {click.cabinType ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {click.cabinType}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs uppercase">{click.deviceType || ''}</td>
                    <td className="px-4 py-3 text-emerald-400 font-mono text-right font-medium">
                      {click.priceAtClick != null ? `$${Number(click.priceAtClick).toFixed(2)}` : '---'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No recent affiliate clicks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
