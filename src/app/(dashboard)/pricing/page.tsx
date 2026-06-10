'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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

  if (loading) return <div className="p-8 text-white">Loading pricing intelligence...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
          Pricing Intelligence
        </h1>
        <p className="text-sm text-white mt-1">Price drops, anomalies, seasonal trends, booking windows</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <ArrowDown className="w-5 h-5 text-emerald-400" /> Recent price drops
          </h2>
          <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
            {drops.map((d: any, i: number) => (
              <li key={i} className="p-3 rounded-lg bg-muted/10 flex justify-between">
                <span className="text-white truncate max-w-[200px]">{d.cruiseTitle}</span>
                <span className="text-emerald-400 font-medium">-{d.dropPct}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Price anomalies
          </h2>
          <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
            {anomalies.length === 0 ? (
              <li className="text-muted-foreground">No stored anomalies</li>
            ) : (
              anomalies.map((a: any) => (
                <li key={a.id} className="p-3 rounded-lg bg-muted/10">
                  <span className="text-white">{a.anomalyType}</span>
                  <span className="text-muted-foreground ml-2">cruise #{a.cruiseId}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-border">
        <h2 className="text-white font-semibold mb-4">Seasonal average price by month</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seasonal}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #333' }} />
              <Bar dataKey="avgPrice" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-border">
        <h2 className="text-white font-semibold mb-4">Best booking window (avg price by lead time)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {booking.map((b: any) => (
            <div key={b.bucket} className="p-4 rounded-xl bg-muted/10 border border-border">
              <p className="text-xs text-muted-foreground">{b.bucket}</p>
              <p className="text-lg font-bold text-white">${b.avgPrice?.toFixed?.(0) ?? b.avgPrice}</p>
              <p className="text-xs text-muted-foreground">n={b.sampleSize}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
