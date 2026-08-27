'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, Search, Eye, MousePointerClick, Bell, BellRing, ArrowLeft,
  ExternalLink, Ship, Smartphone, Monitor, Tablet, TrendingUp, Activity,
} from 'lucide-react';
import AnalyticsChart from '../../../../components/charts/AnalyticsChart';
import DateRangePicker, { DateRange, defaultRange } from '../../../../components/DateRangePicker';
import adminApi from '../../../../api/admin';

interface Overview {
  totalUsers: number; newUsers: number; searches: number; cruiseViews: number;
  affiliateClicks: number; trackPrice: number; priceAlerts: number;
}
interface TrendPoint { date: string; count: number; [key: string]: string | number }
interface TopCruise { cruiseId: number; title: string; shipName: string | null; views: number; trackPrice: number; affiliateClicks: number }
interface TopSearch { query: string; count: number; previousCount: number; change: number }
interface DeviceRow { device: string; count: number; pct: number }
interface FunnelStep { step: string; count: number; stepRate: number | null; rateFromTop: number | null }
interface EventRow { eventType: string; count: number }

const nf = (n: number) => Number(n || 0).toLocaleString('en-US');

const TREND_METRICS = [
  { key: 'searches', label: 'Searches', color: '#2563EB' },
  { key: 'affiliateClicks', label: 'Affiliate Clicks', color: '#16A34A' },
  { key: 'cruiseViews', label: 'Cruise Views', color: '#0EA5A4' },
  { key: 'trackPrice', label: 'Track Price', color: '#F59E0B' },
  { key: 'priceAlerts', label: 'Price Alerts', color: '#DC2626' },
  { key: 'pageViews', label: 'Page Views', color: '#8B5CF6' },
];

const DEVICE_ICON: Record<string, typeof Monitor> = { Desktop: Monitor, Mobile: Smartphone, Tablet: Tablet, Unknown: Monitor };

export default function HistoricalAnalyticsPage() {
  const [range, setRange] = useState<DateRange>(defaultRange());
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [trendBucket, setTrendBucket] = useState('day');
  const [metric, setMetric] = useState('searches');
  const [topCruises, setTopCruises] = useState<TopCruise[]>([]);
  const [topSearches, setTopSearches] = useState<TopSearch[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [clarityUrl, setClarityUrl] = useState('https://clarity.microsoft.com/');
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);

  const params = { startDate: range.startDate, endDate: range.endDate };

  // Everything except the trend reloads when the range changes.
  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.allSettled([
      adminApi.analytics.report.overview(params),
      adminApi.analytics.report.topCruises({ ...params, limit: 10 }),
      adminApi.analytics.report.topSearches({ ...params, limit: 8 }),
      adminApi.analytics.report.devices(params),
      adminApi.analytics.report.funnel(params),
      adminApi.analytics.report.eventsBreakdown(params),
    ]).then(([o, tc, ts, d, f, ev]) => {
      if (!active) return;
      if (o.status === 'fulfilled') setOverview(o.value.data.data);
      if (tc.status === 'fulfilled') setTopCruises(tc.value.data.data || []);
      if (ts.status === 'fulfilled') setTopSearches(ts.value.data.data || []);
      if (d.status === 'fulfilled') setDevices(d.value.data.data?.devices || []);
      if (f.status === 'fulfilled') setFunnel(f.value.data.data || []);
      if (ev.status === 'fulfilled') setEvents(ev.value.data.data?.events || []);
      setLoading(false);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.startDate, range.endDate]);

  // Trend reloads on range OR metric change.
  const loadTrend = useCallback(() => {
    let active = true;
    setTrendLoading(true);
    adminApi.analytics.report
      .trends({ ...params, metric })
      .then((res) => {
        if (!active) return;
        setTrend(res.data.data?.series || []);
        setTrendBucket(res.data.data?.bucket || 'day');
      })
      .catch(() => active && setTrend([]))
      .finally(() => active && setTrendLoading(false));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.startDate, range.endDate, metric]);

  useEffect(() => loadTrend(), [loadTrend]);

  useEffect(() => {
    adminApi.analytics.clarity().then((res) => {
      const url = res.data.data?.dashboardUrl;
      if (url) setClarityUrl(url);
    }).catch(() => {});
  }, []);

  const activeMetric = TREND_METRICS.find((m) => m.key === metric) || TREND_METRICS[0];

  const cards = [
    { label: 'Total Users', value: overview?.totalUsers, sub: overview ? `+${nf(overview.newUsers)} new` : '', icon: Users, color: 'text-brand-blue' },
    { label: 'Searches', value: overview?.searches, icon: Search, color: 'text-brand-teal' },
    { label: 'Cruise Views', value: overview?.cruiseViews, icon: Eye, color: 'text-success' },
    { label: 'Affiliate Clicks', value: overview?.affiliateClicks, icon: MousePointerClick, color: 'text-warning' },
    { label: 'Track Price', value: overview?.trackPrice, icon: Bell, color: 'text-brand-blue' },
    { label: 'Price Alerts', value: overview?.priceAlerts, icon: BellRing, color: 'text-danger' },
  ];

  return (
    <div className="space-y-6 zc-reveal pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/analytics" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Analytics
          </Link>
          <h1 className="zc-page-title flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand-blue" /> Historical Analytics
          </h1>
          <p className="zc-page-subtitle">First-party business & product analytics — retained long-term.</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {/* Clarity separation banner */}
      <div className="zc-card p-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-brand-blue/[0.04] to-transparent">
        <p className="text-sm text-muted-foreground max-w-2xl">
          <span className="font-semibold text-foreground">ZapCruise Analytics</span> covers long-term trends,
          searches, conversions & funnels. <span className="font-semibold text-foreground">Microsoft Clarity</span> handles
          session recordings, heatmaps & rage/dead clicks.
        </p>
        <a href={clarityUrl} target="_blank" rel="noopener noreferrer" className="zc-btn-secondary text-sm whitespace-nowrap">
          Open Microsoft Clarity <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="zc-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">{c.label}</span>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-muted rounded mt-3 animate-pulse" />
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground mt-3 tabular-nums">{nf(c.value ?? 0)}</h3>
                  {c.sub ? <p className="text-[11px] text-success font-medium mt-0.5">{c.sub}</p> : null}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Trend chart */}
      <div className="zc-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="zc-section-title">Activity over time <span className="text-xs font-normal text-muted-foreground">· by {trendBucket}</span></h2>
          <div className="flex flex-wrap gap-1.5">
            {TREND_METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  metric === m.key ? 'bg-brand-blue text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {trendLoading ? (
          <div className="h-56 bg-muted/20 rounded-xl animate-pulse" />
        ) : (
          <AnalyticsChart
            data={trend}
            xKey="date"
            yKey="count"
            height={260}
            color={activeMetric.color}
            legends={[{ label: activeMetric.label, color: activeMetric.color }]}
          />
        )}
      </div>

      {/* Top searches + Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="zc-card p-6">
          <h2 className="zc-section-title mb-4 flex items-center gap-2"><Search className="w-5 h-5 text-brand-teal" /> Top searches</h2>
          {topSearches.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No searches in this range.</p>
          ) : (
            <div className="space-y-1.5">
              {topSearches.map((s, i) => (
                <div key={s.query} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/10">
                  <span className="text-sm text-foreground flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                    <span className="truncate">{s.query}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    {s.change !== 0 && (
                      <span className={`text-[11px] font-medium ${s.change > 0 ? 'text-success' : 'text-danger'}`}>
                        {s.change > 0 ? '▲' : '▼'} {Math.abs(s.change)}
                      </span>
                    )}
                    <span className="text-xs font-mono text-brand-teal tabular-nums">{nf(s.count)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="zc-card p-6">
          <h2 className="zc-section-title mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-brand-blue" /> Device breakdown</h2>
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No device data in this range.</p>
          ) : (
            <div className="space-y-4">
              {devices.map((d) => {
                const Icon = DEVICE_ICON[d.device] || Monitor;
                return (
                  <div key={d.device}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2 font-medium text-foreground"><Icon className="w-4 h-4 text-muted-foreground" /> {d.device}</span>
                      <span className="tabular-nums text-foreground font-semibold">{d.pct}% <span className="text-muted-foreground font-normal">({nf(d.count)})</span></span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-brand-blue transition-all duration-500" style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Funnel */}
      <div className="zc-card p-6">
        <h2 className="zc-section-title mb-4">Product funnel</h2>
        <div className="space-y-2">
          {funnel.map((s, i) => {
            const width = s.rateFromTop != null ? Math.max(4, s.rateFromTop) : 4;
            return (
              <div key={s.step} className="flex items-center gap-3">
                <div className="w-40 shrink-0 text-sm text-foreground">{s.step}</div>
                <div className="flex-1 h-9 rounded-lg bg-muted/20 overflow-hidden relative">
                  <div className="h-full rounded-lg bg-gradient-to-r from-brand-blue to-brand-teal flex items-center px-3" style={{ width: `${width}%` }}>
                    <span className="text-xs font-semibold text-white tabular-nums whitespace-nowrap">{nf(s.count)}</span>
                  </div>
                </div>
                <div className="w-28 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                  {i === 0 ? 'start' : s.stepRate != null ? `${s.stepRate}% from prev` : 'insufficient'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All events by type — surfaces custom / auto-tracked events */}
      <div className="zc-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="zc-section-title flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-blue" /> All events by type
          </h2>
          <span className="text-xs text-muted-foreground">every tracked event, including custom ones</span>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No events in this range.</p>
        ) : (
          <div className="space-y-2.5">
            {events.map((e) => {
              const max = events[0]?.count || 1;
              const pct = Math.max(2, Math.round((e.count / max) * 100));
              return (
                <div key={e.eventType}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-mono text-xs text-foreground truncate" title={e.eventType}>{e.eventType}</span>
                    <span className="tabular-nums text-foreground font-semibold">{nf(e.count)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-brand-blue transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top cruises */}
      <div className="zc-card p-6">
        <h2 className="zc-section-title mb-4 flex items-center gap-2"><Ship className="w-5 h-5 text-brand-teal" /> Most active cruises</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="zc-table-head-cell">Cruise</th>
                <th className="zc-table-head-cell text-right">Views</th>
                <th className="zc-table-head-cell text-right">Track Price</th>
                <th className="zc-table-head-cell text-right">Affiliate Clicks</th>
              </tr>
            </thead>
            <tbody>
              {topCruises.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">No cruise activity in this range.</td></tr>
              ) : (
                topCruises.map((c) => (
                  <tr key={c.cruiseId} className="border-b border-border/50 hover:bg-muted/10 transition">
                    <td className="py-3 px-4 text-foreground max-w-[360px]">
                      <div className="truncate" title={c.title}>{c.title}</div>
                      {c.shipName && <div className="text-xs text-muted-foreground truncate">{c.shipName}</div>}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">{nf(c.views)}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">{nf(c.trackPrice)}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-foreground font-semibold">{nf(c.affiliateClicks)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
