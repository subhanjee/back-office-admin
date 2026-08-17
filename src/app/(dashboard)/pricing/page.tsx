'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, ArrowDown, Gauge } from 'lucide-react';
import AnalyticsChart from '../../../components/charts/AnalyticsChart';
import LoadingSpinner from '../../../components/LoadingSpinner';
import adminApi from '../../../api/admin';

interface CdiDistribution {
  sampleSize: number;
  distribution: { buyNow: number; goodTimeToBuy: number; neutral: number; wait: number };
  counts: { buyNow: number; goodTimeToBuy: number; neutral: number; wait: number };
  generatedAt: string;
}

export default function PricingPage() {
  const [drops, setDrops] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [seasonal, setSeasonal] = useState<any[]>([]);
  const [booking, setBooking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // CDI distribution loads on its own (a sampled scan) so it never blocks the page.
  const [cdi, setCdi] = useState<CdiDistribution | null>(null);
  const [cdiLoading, setCdiLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [d, a, s, b] = await Promise.all([
          adminApi.pricing.drops({ limit: 15 }),
          adminApi.pricing.anomalies({ limit: 10 }),
          adminApi.pricing.seasonal(),
          adminApi.pricing.bookingWindow(),
        ]);
        setDrops(d.data.data || []);
        setAnomalies(a.data.data?.anomalies || a.data.data || []);
        setSeasonal(s.data.data || []);
        setBooking(b.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let active = true;
    adminApi.pricing
      .cdiDistribution()
      .then((res) => {
        if (active) setCdi(res.data.data ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCdiLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingSpinner message="Loading pricing intelligence..." />;

  return (
    <div className="space-y-8 zc-reveal">
      <div>
        <h1 className="zc-page-title flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-success" />
          Pricing Intelligence
        </h1>
        <p className="zc-page-subtitle">Price drops, anomalies, seasonal trends, booking windows</p>
      </div>

      {/* Cruise Decision Intelligence — recommendation distribution across the catalogue */}
      <div className="zc-card p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="zc-section-title flex items-center gap-2">
              <Gauge className="w-5 h-5 text-brand-blue" /> Recommendation distribution
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Cruise Decision Intelligence mix across a random sample of the catalogue. Buy Now is
              intentionally the rarest state; Neutral is the default when evidence is weak or mixed.
            </p>
          </div>
          {cdi && cdi.sampleSize > 0 ? (
            <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
              sample {cdi.sampleSize} ·{' '}
              {new Date(cdi.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : null}
        </div>

        {cdiLoading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 w-32 bg-muted rounded mb-2" />
                <div className="h-2 w-full bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ) : !cdi || cdi.sampleSize === 0 ? (
          <div className="text-sm text-muted-foreground py-4">
            No recommendation data available yet.
          </div>
        ) : (
          <div className="space-y-3.5">
            {[
              { label: 'Buy Now', pct: cdi.distribution.buyNow, count: cdi.counts.buyNow, color: '#10b981' },
              { label: 'Good Time to Buy', pct: cdi.distribution.goodTimeToBuy, count: cdi.counts.goodTimeToBuy, color: '#14b8a6' },
              { label: 'Neutral', pct: cdi.distribution.neutral, count: cdi.counts.neutral, color: '#94a3b8' },
              { label: 'Wait', pct: cdi.distribution.wait, count: cdi.counts.wait, color: '#f59e0b' },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                    {r.label}
                  </span>
                  <span className="tabular-nums text-foreground font-semibold">
                    {r.pct}% <span className="text-muted-foreground font-normal">({r.count})</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${r.pct}%`, backgroundColor: r.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="zc-card p-6">
        <h2 className="zc-section-title mb-4 flex items-center gap-2">
          <ArrowDown className="w-5 h-5 text-success" /> Recent price drops
        </h2>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Cruise</th>
                <th className="text-left py-2 px-3 font-semibold text-muted-foreground">OTA</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Previous</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Current</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Drop %</th>
              </tr>
            </thead>
            <tbody>
              {drops.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted-foreground">
                    No recent price drops
                  </td>
                </tr>
              ) : (
                drops.map((d: any, i: number) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/10 transition">
                    <td className="py-3 px-3 text-foreground max-w-[280px] truncate" title={d.cruiseTitle}>
                      {d.cruiseTitle}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{d.otaName ?? '—'}</td>
                    <td className="py-3 px-3 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                      {d.previousPrice != null ? `$${Number(d.previousPrice).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-foreground font-medium tabular-nums whitespace-nowrap">
                      {d.currentPrice != null ? `$${Number(d.currentPrice).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-success font-semibold tabular-nums whitespace-nowrap">
                      -{d.dropPct}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="zc-card p-6">
        <h2 className="zc-section-title mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" /> Price anomalies
        </h2>
        <table className="w-full text-sm max-h-64 overflow-y-auto">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground">Anomaly Type</th>
              <th className="text-left py-2 px-3 text-muted-foreground">Cruise ID</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center py-4 text-muted-foreground">
                  No stored anomalies
                </td>
              </tr>
            ) : (
              anomalies.map((a: any) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-muted/10 transition">
                  <td className="py-3 px-3 text-foreground">{a.anomalyType}</td>
                  <td className="py-3 px-3 text-muted-foreground">#{a.cruiseId}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="zc-card p-6">
        <h2 className="zc-section-title mb-4">Seasonal average price by month</h2>
        {seasonal && seasonal.length > 0 ? (
          <AnalyticsChart
            data={seasonal}
            xKey="month"
            yKey="avgPrice"
            height={220}
            color="#2563EB"
            legends={[{ label: 'Average Price', color: '#2563EB' }]}
          />
        ) : (
          <div className="p-4 text-muted-foreground">No seasonal data</div>
        )}
      </div>

      <div className="zc-card p-6">
        <h2 className="zc-section-title mb-4">Best booking window (avg price by lead time)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {booking.map((b: any) => (
            <div key={b.bucket} className="p-4 rounded-xl bg-muted/10 border border-border">
              <p className="text-xs text-muted-foreground">{b.bucket}</p>
              <p className="text-lg font-bold text-foreground">${b.avgPrice?.toFixed?.(0) ?? b.avgPrice}</p>
              <p className="text-xs text-muted-foreground">n={b.sampleSize}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ); 
}
