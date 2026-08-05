'use client';

import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import AnalyticsChart from '../../../../components/charts/AnalyticsChart';
import { normalizeAffiliateStats } from '../../../../lib/affiliateAnalytics';
import { MousePointerClick, TrendingUp, MonitorSmartphone, Globe, Bed, Download } from 'lucide-react';
import adminApi from '../../../../api/admin';

const COLORS = ['#2563EB', '#0EA5A4', '#16A34A', '#F59E0B', '#0F172A', '#64748B'];

export default function AffiliateAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await adminApi.analytics.affiliate();
        console.log('Affiliate stats response:', res.data);
        setStats(res.data.data);
      } catch (err: any) {
        console.error('Affiliate analytics error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load affiliate analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Affiliate Analytics...</div>;
  }

  if (error) {
    return <div className="p-8 text-danger">Error: {error}</div>;
  }

  const normalized = normalizeAffiliateStats(stats);
  const totalClicks = normalized.overview.totalClicks;
  const last7Days = normalized.overview.last7Days;
  const uniqueOtas = normalized.overview.uniqueOtas;
  const recentCount = normalized.overview.recentCount;
  const byOtaData = normalized.overview.byOta;
  const byCabinData = normalized.overview.byCabin;
  const byDeviceData = normalized.overview.byDevice;
  const recentClicks = normalized.overview.recent;

  return (
    <div className="space-y-6 zc-reveal pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="zc-page-title flex items-center gap-3">
            <MousePointerClick className="w-6 h-6 text-success" />
            Affiliate Analytics
          </h1>
          <p className="zc-page-subtitle">Detailed breakdown of outbound clicks and conversions.</p>
        </div>
        {/* <button className="zc-btn-primary">
          <Download className="w-4 h-4" />
          Export CSV
        </button> */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="zc-card p-6">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Clicks</span>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{totalClicks || 0}</h3>
        </div>
        <div className="zc-card p-6">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Last 7 Days</span>
          <h3 className="text-3xl font-bold text-success mt-2">{last7Days || 0}</h3>
        </div>
        <div className="zc-card p-6">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Unique OTAs</span>
          <h3 className="text-3xl font-bold text-brand-blue mt-2">{uniqueOtas || 0}</h3>
        </div>
        <div className="zc-card p-6">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent (24h)</span>
          <h3 className="text-3xl font-bold text-brand-teal mt-2">{recentCount || 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks by OTA Chart */}
        <div className="zc-card p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-6 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            Clicks by OTA
          </h3>
          {byOtaData.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-sm text-muted-foreground text-center px-4">
              <p className="font-medium text-slate-900 mb-2">No OTA click data available for the last 7 days.</p>
              <p className="text-xs text-muted-foreground">The summary card may still show all-time click totals, so this chart can be blank if recent click activity is absent.</p>
            </div>
          ) : (
            <AnalyticsChart data={byOtaData} xKey="name" yKey="clicks" height={280} color="#16A34A" legends={[{ label: 'Total Clicks', color: '#16A34A' }]} />
          )}
        </div>

        {/* Cabin Types Pie */}
        <div className="zc-card p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-6 uppercase tracking-wider flex items-center gap-2">
            <Bed className="w-4 h-4 text-brand-teal" />
            Clicks by Cabin Type
          </h3>
          <div className="h-72 flex justify-center">
            {byCabinData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground text-center px-4">
                No cabin chart data available. Check the affiliate API response in the browser console.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '0.5rem', color: '#0F172A', boxShadow: '0 8px 24px -8px rgba(15, 23, 42, 0.16)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748B' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      
      {/* Recent Clicks Table */}
      <div className="zc-card p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-6 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand-blue" />
          Recent Affiliate Clicks (Latest 20)
        </h3>

        <div className="overflow-x-auto">
          <div className="zc-table-shell">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="zc-table-head-cell">Date</th>
                  <th className="zc-table-head-cell">OTA</th>
                  <th className="zc-table-head-cell">Sailing ID</th>
                  <th className="zc-table-head-cell">Cabin</th>
                  <th className="zc-table-head-cell">Device</th>
                  <th className="zc-table-head-cell text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {recentClicks.length > 0 ? (
                  recentClicks.map((click: any) => (
                    <tr key={click.id} className="zc-table-row">
                      <td className="zc-table-cell text-muted-foreground font-mono text-xs whitespace-nowrap">
                        {new Date(click.createdAt).toLocaleString()}
                      </td>
                      <td className="zc-table-cell font-medium text-slate-900">{click.otaName || ''}</td>
                      <td className="zc-table-cell text-muted-foreground font-mono text-xs">{click.sailingId}</td>
                      <td className="zc-table-cell">
                        {click.cabinType ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                            {click.cabinType}
                          </span>
                        ) : null}
                      </td>
                      <td className="zc-table-cell text-muted-foreground text-xs uppercase">{click.deviceType || ''}</td>
                      <td className="zc-table-cell text-success font-mono text-right font-medium">
                        ${click.priceAtClick?.toFixed(2) || '---'}
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
    </div>
  );
}
