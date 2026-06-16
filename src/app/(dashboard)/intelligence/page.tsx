'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Ship, Route } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import adminApi from '../../../api/admin';

export default function IntelligencePage() {
  const [cruises, setCruises] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const results = await Promise.allSettled([
          adminApi.intelligence.cruisePopularity(),
          adminApi.intelligence.routes(),
          adminApi.intelligence.cruiseLines(),
        ]);

        const [c, r, l] = results;

        if (c.status === 'fulfilled') {
          setCruises(c.value.data.data || []);
        }
        if (r.status === 'fulfilled') {
          setRoutes(r.value.data.data || []);
        }
        if (l.status === 'fulfilled') {
          setLines(l.value.data.data || []);
        }

        const rejected = results.find((item): item is PromiseRejectedResult => item.status === 'rejected');
        if (rejected) {
          const err = rejected.reason;
          setError(err?.response?.data?.message || err?.message || 'Failed to load intelligence data');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading cruise intelligence..." />;

  return (
    <div className="space-y-8 animate-fade-in">
      {error ? (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-400 text-red-100">
          <strong className="block font-semibold">Intelligence load error:</strong>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : null}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-6 h-6 text-purple-400" />
          Cruise Intelligence
        </h1>
        <p className="text-sm text-white mt-1">Popularity and performance reports (30-day window)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Ship className="w-5 h-5" /> Top cruises by clicks
          </h2>
          <div style={{ maxHeight: '50vh', overflowY: 'auto' }} className="space-y-2 text-sm">
            <ol>
              {cruises.map((row, i) => (
                <li key={row.cruiseId} className="flex justify-between p-2 rounded-lg bg-muted/10">
                  <span className="text-white truncate max-w-[240px]">
                    {i + 1}. {row.cruise?.title || `Cruise #${row.cruiseId}`}
                  </span>
                  <span className="text-blue-400">{row.clicks}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Route className="w-5 h-5" /> Top routes (portList)
          </h2>
          <div className="max-h-[50vh] overflow-y-auto pr-12">
            <table className="w-full text-sm table-fixed">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="text-left py-2">Route</th>
                  <th className="text-right py-2 pr-12 w-24">Score</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((row, i) => (
                  <tr key={i} className="border-t border-border/50 bg-muted/10">
                    <td className="py-2 align-top">
                      <div className="text-xs text-white pr-4 break-words whitespace-normal overflow-x-hidden">
                        {row.route}
                      </div>
                    </td>
                    <td className="py-2 text-right text-muted-foreground text-xs pr-12 w-24">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-border">
        <h2 className="font-semibold text-white mb-4">Cruise line performance</h2>
        <div style={{ maxHeight: '50vh', overflowY: 'auto' }} className="pr-4">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="text-left py-2">Line</th>
                <th className="text-right py-2 pr-6">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l: any) => (
                <tr key={l.cruiseLineId} className="border-t border-border/50">
                  <td className="py-2 text-white">{l.name}</td>
                  <td className="py-2 text-right text-blue-400 pr-6">{l.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
