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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
          Pricing Intelligence
        </h1>
        <p className="text-sm text-white mt-1">Price drops, anomalies, seasonal trends, booking windows</p>
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
        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <ArrowDown className="w-5 h-5 text-emerald-400" /> Recent price drops
          </h2>
          <div className="hide-scrollbar max-h-70 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10  bg-white">
                <tr className="text-muted-foreground">
                  <th className="text-left py-2 px-3">Cruise</th>
                  <th className="text-left py-2 px-3">OTA</th>
                  <th className="text-right py-2 px-3">Previous</th>
                  <th className="text-right py-2 px-3">Current</th>
                  <th className="text-right py-2 px-3">Drop %</th>
                </tr>
              </thead>
              <tbody>
                {drops.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted-foreground">No recent price drops</td>
                  </tr>
                ) : (
                  drops.map((d: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/10 transition">
                      <td className="py-2 px-3 text-white text-xs whitespace-normal break-words">
                        {d.cruiseTitle}
                      </td>                      <td className="py-2 px-3 text-muted-foreground text-xs">{d.otaName}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground text-xs">${d.previousPrice?.toFixed?.(0) ?? d.previousPrice}</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-medium text-xs">${d.currentPrice?.toFixed?.(0) ?? d.currentPrice}</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-medium text-xs">-{d.dropPct}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Price anomalies
          </h2>
          {anomalies.length === 0 ? (
            <div className="h-70 flex items-center justify-center">
              <div className="text-center">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="w-4 h-8 bg-muted/20 rounded"></div>
                  ))}
                </div>
                <p className="text-muted-foreground text-sm">No anomalies detected</p>
                <p className="text-muted-foreground text-xs mt-1">System is working normally</p>
              </div>
            </div>
          ) : (
            <div className="hide-scrollbar max-h-40 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground">Type</th>
                    <th className="text-left py-2 px-3 text-muted-foreground">Cruise ID</th>
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

      {/* Top Deals Section */}
      {/* <div className="glass-panel p-6 rounded-2xl border border-border"> */}
        {/* <h2 className="text-white font-semibold mb-4">Pricing Explorer</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <input
              value={cruiseQuery}
              onChange={(e) => setCruiseQuery(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const res = await adminApi.pricing.cruises({ search: cruiseQuery, limit: 10 });
                  setCruiseResults(res.data.data?.cruises || res.data.data || []);
                }
              }}
              placeholder="Search cruises by name and press Enter"
              className="w-full p-2 rounded border border-border bg-muted/5 text-white"
            />
            <div className="mt-2 max-h-40 overflow-y-auto">
              {cruiseResults.map((c) => (
                <button
                  key={c.id}
                  onClick={async () => {
                    setSelectedCruise(c);
                    setOtaComparison([]);
                    setCruiseSeries([]);
                    try {
                      const [oRes, sRes] = await Promise.all([
                        adminApi.pricing.otaComparison(c.id),
                        adminApi.pricing.cruiseSeries(c.id),
                      ]);
                        setOtaComparison(oRes.data.data || []);
                        const series = sRes.data.data || [];
                        setCruiseSeries(series);
                        // try to fetch recent conversion data (last 90 days)
                        try {
                          const conv = await adminApi.analytics.conversion(90);
                          setConversions(conv.data.data || []);
                        } catch (err) {
                          setConversions([]);
                        }
                        // elasticity/revenue will be computed by effect after data loads
                    } catch (err) {
                      console.error('Explorer load failed', err);
                    }
                  }}
                  className="w-full text-left p-2 rounded hover:bg-muted/10"
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm text-muted-foreground mb-2">Lowest prices (48h)</h3>
            <ul className="space-y-2 max-h-40 overflow-y-auto text-sm">
              {lowestPrices.map((p) => (
                <li key={`${p.cruiseId}-${p.otaName}`} className="flex justify-between">
                  <span className="text-white truncate max-w-[160px]">{p.cruiseTitle}</span>
                  <span className="text-emerald-400">${p.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div> */}

        {/* <h2 className="text-white font-semibold mb-4">Top Deals (Lowest Prices — 48h)</h2>
        {lowestPrices && lowestPrices.length > 0 ? (
          <div className="hide-scrollbar max-h-96 overflow-y-auto border border-border/50 rounded-lg">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-2 px-2">Cruise</th>
                  <th className="text-left py-2 px-2">Duration</th>
                  <th className="text-left py-2 px-2">Region</th>
                  <th className="text-right py-2 px-2">Price</th>
                  <th className="text-left py-2 px-2">OTA</th>
                  <th className="text-left py-2 px-2 text-xs">Last Seen</th>
                  <th className="text-center py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lowestPrices.slice(0, 20).map((p: any, idx: number) => (
                  <tr key={p.cruiseId || idx} className={`border-b border-border/50 hover:bg-muted/10 transition ${idx < 3 ? 'bg-emerald-400/5' : ''}`}>
                    <td className="py-2 px-2 text-white truncate max-w-[180px] text-xs font-medium">{p.cruiseTitle}</td>
                    <td className="py-2 px-2 text-muted-foreground text-xs">{p.duration ?? p.durationDays ?? '-'} d</td>
                    <td className="py-2 px-2 text-muted-foreground text-xs truncate max-w-[120px]">{p.region || p.portList || p.route || '-'}</td>
                    <td className="py-2 px-2 text-right text-emerald-400 font-bold text-sm">${p.price?.toFixed?.(0) ?? p.price}</td>
                    <td className="py-2 px-2 text-muted-foreground text-xs">{p.otaName}</td>
                    <td className="py-2 px-2 text-muted-foreground text-xs">{p.lastSeen ? new Date(p.lastSeen).toLocaleDateString() : '-'}</td>
                    <td className="py-2 px-2 text-center">
                      {p.link ? (
                        <a href={p.link} target="_blank" rel="noreferrer" className="px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition">View</a>
                      ) : (
                        <button className="px-2 py-1 rounded text-xs bg-muted/10 text-muted-foreground" disabled>—</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center rounded-lg border border-border/50 bg-muted/5">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-muted-foreground font-medium">No deals available</p>
              <p className="text-muted-foreground text-xs mt-1">Checking last 7 days of pricing...</p>
            </div>
          </div>
        )}
      </div> */}

      <div className="glass-panel p-6 rounded-2xl border border-border">
        <h2 className="text-white font-semibold mb-4">Seasonal average price by month</h2>
        {seasonal && seasonal.length > 0 ? (
          <AnalyticsChart
            data={seasonal}
            xKey="month"
            yKey="avgPrice"
            height={220}
            color="#3b82f6"
            legends={[{ label: 'Average Price', color: '#3b82f6' }]}
          />
        ) : (
          <div className="p-4 text-muted-foreground">No seasonal data</div>
        )}
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
