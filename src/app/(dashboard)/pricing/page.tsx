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
  const [cruiseQuery, setCruiseQuery] = useState('');
  const [cruiseResults, setCruiseResults] = useState<any[]>([]);
  const [selectedCruise, setSelectedCruise] = useState<any | null>(null);
  const [otaComparison, setOtaComparison] = useState<any[]>([]);
  const [cruiseSeries, setCruiseSeries] = useState<any[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);
  const [elasticitySummary, setElasticitySummary] = useState<any | null>(null);
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

  // Fetch lowest prices for explorer quick card
  const [lowestPrices, setLowestPrices] = useState<any[]>([]);
  useEffect(() => {
    const loadLowest = async () => {
      try {
        const res = await adminApi.pricing.lowest();
        const data = res.data.data || res.data || [];
        setLowestPrices(Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn('Failed to load lowest prices:', e);
        setLowestPrices([]);
      }
    };
    loadLowest();
  }, []);

  // DO NOT return early before hooks; render spinner after hooks declared

  // Estimate elasticity and revenue impact when series or conversions update
  React.useEffect(() => {
    const compute = () => {
      if (!cruiseSeries || cruiseSeries.length === 0) {
        setElasticitySummary(null);
        return;
      }

      const items = cruiseSeries.map((p: any) => {
        const d = p.date ? new Date(p.date) : (p.timestamp ? new Date(p.timestamp) : null);
        return { date: d, price: typeof p.price === 'number' ? p.price : parseFloat(p.price || 0) || 0 };
      }).filter((x: any) => x.date instanceof Date && !isNaN(x.date.getTime()));
      if (items.length < 2) {
        setElasticitySummary(null);
        return;
      }
      items.sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

      const mid = Math.floor(items.length / 2);
      const oldItems = items.slice(0, mid);
      const newItems = items.slice(mid);
      const avg = (arr: any[]) => arr.reduce((s, x) => s + x.price, 0) / Math.max(1, arr.length);
      const oldPrice = avg(oldItems);
      const newPrice = avg(newItems);

      // build conversion map from conversions array if available
      const convMap: Record<string, number> = {};
      (conversions || []).forEach((c: any) => {
        const d = c.date || c.day || c.timestamp || c.ts || c._date;
        const date = d ? String(d).substring(0, 10) : null;
        const val = c.count || c.conversions || c.value || c.bookings || c.total || 0;
        if (date) convMap[date] = (convMap[date] || 0) + (typeof val === 'number' ? val : parseFloat(val || 0) || 0);
      });

      const sumConv = (arr: any[]) => {
        return arr.reduce((s: number, x: any) => {
          const key = x.date ? x.date.toISOString().substring(0, 10) : null;
          return s + (key && convMap[key] ? convMap[key] : 0);
        }, 0);
      };

      const oldConv = sumConv(oldItems);
      const newConv = sumConv(newItems);

      if (oldPrice <= 0 || oldConv <= 0) {
        setElasticitySummary(null);
        return;
      }

      const deltaQ = (newConv - oldConv) / Math.max(1, oldConv);
      const deltaP = (newPrice - oldPrice) / Math.max(1, oldPrice);
      const elasticity = deltaP === 0 ? null : deltaQ / deltaP;
      const revenueOld = oldPrice * oldConv;
      const revenueNew = newPrice * newConv;
      const revenueChange = revenueNew - revenueOld;

      setElasticitySummary({ elasticity, revenueChange, elasticityLabel: elasticity === null ? 'n/a' : elasticity.toFixed(2) });
    };
    compute();
  }, [cruiseSeries, conversions]);

  // derived view data (avoid IIFEs inside JSX)
  const cabinChartData = React.useMemo(() => {
    if (!cruiseSeries || cruiseSeries.length === 0) return [];
    const byCabin: Record<string, { sum: number; count: number }> = {};
    cruiseSeries.forEach((p: any) => {
      const key = p.cabinType || 'Unknown';
      const price = typeof p.price === 'number' ? p.price : parseFloat(p.price || 0) || 0;
      byCabin[key] = byCabin[key] || { sum: 0, count: 0 };
      byCabin[key].sum += price;
      byCabin[key].count += 1;
    });
    return Object.keys(byCabin).map((k) => ({ name: k, value: Math.round(byCabin[k].sum / byCabin[k].count) }));
  }, [cruiseSeries]);

  const volatilityRows = React.useMemo(() => {
    if (!cruiseSeries || cruiseSeries.length === 0) return [];
    const groups: Record<string, number[]> = {};
    cruiseSeries.forEach((p: any) => {
      const key = p.cabinType || 'Unknown';
      const price = typeof p.price === 'number' ? p.price : parseFloat(p.price || 0) || 0;
      groups[key] = groups[key] || [];
      groups[key].push(price);
    });
    return Object.keys(groups).map((k) => {
      const arr = groups[k];
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const sd = Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length) || 0;
      const cov = mean ? sd / mean : 0;
      return { cabin: k, cov };
    });
  }, [cruiseSeries]);

  const heatmap = React.useMemo(() => {
    if (!cruiseSeries || cruiseSeries.length === 0) return { months: [], cabins: [], cells: [] };
    const map: Record<string, Record<string, number[]>> = {};
    cruiseSeries.forEach((p: any) => {
      const d = p.date ? new Date(p.date) : (p.timestamp ? new Date(p.timestamp) : null);
      const month = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : 'unknown';
      const cabin = p.cabinType || 'Unknown';
      map[month] = map[month] || {};
      map[month][cabin] = map[month][cabin] || [];
      const price = typeof p.price === 'number' ? p.price : parseFloat(p.price || 0) || 0;
      map[month][cabin].push(price);
    });
    const months = Object.keys(map).sort();
    const cabins = Array.from(new Set(cruiseSeries.map((p: any) => p.cabinType || 'Unknown')));
    const cells: Array<{ month: string; cabin: string; cov: number }> = [];
    months.forEach((m) => {
      cabins.forEach((c) => {
        const arr = map[m][c] || [];
        if (arr.length === 0) cells.push({ month: m, cabin: c, cov: 0 });
        else {
          const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
          const sd = Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length) || 0;
          const cov = mean ? sd / mean : 0;
          cells.push({ month: m, cabin: c, cov });
        }
      });
    });
    return { months, cabins, cells };
  }, [cruiseSeries]);

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

      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

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
                </thead>
                <tbody>
                  {anomalies.map((a: any) => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-muted/10 transition">
                      <td className="py-2 px-3 text-white text-xs">{a.anomalyType}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">#{a.cruiseId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
