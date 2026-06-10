'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Ship, Route } from 'lucide-react';
import adminApi from '../../../api/admin';

export default function IntelligencePage() {
  const [cruises, setCruises] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, r, l] = await Promise.all([
          adminApi.intelligence.cruisePopularity(),
          adminApi.intelligence.routes(),
          adminApi.intelligence.cruiseLines(),
        ]);
        setCruises(c.data.data || []);
        setRoutes(r.data.data || []);
        setLines(l.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-8 text-white">Loading cruise intelligence...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
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
          <ol className="space-y-2 text-sm">
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

        <div className="glass-panel p-6 rounded-2xl border border-border">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Route className="w-5 h-5" /> Top routes (portList)
          </h2>
          <ol className="space-y-2 text-sm max-h-80 overflow-y-auto">
            {routes.map((row, i) => (
              <li key={i} className="p-2 rounded-lg bg-muted/10">
                <p className="text-white text-xs truncate">{row.route}</p>
                <p className="text-muted-foreground text-xs mt-1">score {row.score}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-border">
        <h2 className="font-semibold text-white mb-4">Cruise line performance</h2>
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr><th className="text-left py-2">Line</th><th className="text-right py-2">Clicks</th></tr>
          </thead>
          <tbody>
            {lines.map((l: any) => (
              <tr key={l.cruiseLineId} className="border-t border-border/50">
                <td className="py-2 text-white">{l.name}</td>
                <td className="py-2 text-right text-blue-400">{l.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
