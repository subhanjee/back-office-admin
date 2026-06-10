'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { MousePointerClick, TrendingUp, MonitorSmartphone, Globe, Bed, Download } from 'lucide-react';
import api from '../../../../../api/api';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];

export default function AffiliateAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/analytics/affiliate/stats');
        setStats(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Affiliate Analytics...</div>;
  }

  // Formatting for charts
  const byOtaData = stats?.overview?.byOta?.map((item: any) => ({
    name: item.otaName || 'Unknown',
    clicks: item._count.id
  })) || [];

  const byCabinData = stats?.byCabin?.map((item: any) => ({
    name: item.cabinType || 'Unknown',
    value: item._count.id
  })) || [];

  const byDeviceData = stats?.byDevice?.map((item: any) => ({
    name: item.deviceType || 'Unknown',
    value: item._count.id
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <MousePointerClick className="w-6 h-6 text-emerald-400" />
            Affiliate Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed breakdown of outbound clicks and conversions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-muted/20 hover:bg-muted/40 border border-border text-white rounded-lg transition-colors text-sm font-medium">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Clicks</span>
          <h3 className="text-3xl font-bold text-white mt-2">{stats?.overview?.total || 0}</h3>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Last 7 Days</span>
          <h3 className="text-3xl font-bold text-emerald-400 mt-2">{stats?.overview?.last7Days || 0}</h3>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Unique OTAs</span>
          <h3 className="text-3xl font-bold text-blue-400 mt-2">{stats?.overview?.byOta?.length || 0}</h3>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent (24h)</span>
          <h3 className="text-3xl font-bold text-purple-400 mt-2">{stats?.overview?.recent?.length || 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks by OTA Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Clicks by OTA
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byOtaData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#fff' }}
                />
                <Bar dataKey="clicks" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cabin Types Pie */}
        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <Bed className="w-4 h-4 text-purple-400" />
            Clicks by Cabin Type
          </h3>
          <div className="h-72 flex justify-center">
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
                  stroke="none"
                >
                  {byCabinData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent Clicks Table */}
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
              {stats?.overview?.recent?.length > 0 ? (
                stats.overview.recent.map((click: any) => (
                  <tr key={click.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">
                      {new Date(click.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{click.otaName}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{click.sailingId}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {click.cabinType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs uppercase">{click.deviceType || 'Unknown'}</td>
                    <td className="px-4 py-3 text-emerald-400 font-mono text-right font-medium">
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
  );
}
