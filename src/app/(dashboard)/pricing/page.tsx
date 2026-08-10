'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, ArrowDown } from 'lucide-react';
import AnalyticsChart from '../../../components/charts/AnalyticsChart';
import LoadingSpinner from '../../../components/LoadingSpinner';
import adminApi from '../../../api/admin';

export default function PricingPage() {
  const [drops, setDrops] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [seasonal, setSeasonal] = useState<any[]>([]);
  const [booking, setBooking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="zc-card p-6">
          <h2 className="zc-section-title mb-4 flex items-center gap-2">
            <ArrowDown className="w-5 h-5 text-success" /> Recent price drops
          </h2>
          <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
            {drops.map((d: any, i: number) => (
              <li key={i} className="p-3 rounded-lg bg-muted/10 flex justify-between">
                <span className="text-foreground truncate max-w-[200px]">{d.cruiseTitle}</span>
                <span className="text-success font-medium">-{d.dropPct}%</span>
              </li>
            ))}
          </ul>
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
