'use client';

import React, { useEffect, useState } from 'react';
import { Database, Search, Ship } from 'lucide-react';
import adminApi from '../../../api/admin';

export default function CatalogPage() {
  const [stats, setStats] = useState<any>(null);
  const [cruises, setCruises] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (q = '') => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        adminApi.catalog.stats(),
        adminApi.catalog.cruises({ search: q, limit: 20 }),
      ]);
      setStats(s.data.data);
      setCruises(c.data.data?.cruises || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-400" />
          Catalog Management
        </h1>
        <p className="text-sm text-white mt-1">Browse and correct cruise catalog data</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="glass-card p-3 rounded-xl text-center">
              <p className="text-xs text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
              <p className="text-xl font-bold text-white">{String(v)}</p>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cruises, ship, line..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted/20 border border-border text-sm text-white"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Search</button>
      </form>

      <div className="glass-panel rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <p className="p-8 text-muted-foreground">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/20 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Ship / Line</th>
                <th className="px-4 py-3 text-left">Sailings</th>
              </tr>
            </thead>
            <tbody>
              {cruises.map((c) => (
                <tr key={c.id} className="border-t border-border/50 hover:bg-muted/10">
                  <td className="px-4 py-3 font-mono text-muted-foreground">{c.id}</td>
                  <td className="px-4 py-3 text-white max-w-xs truncate">{c.title}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Ship className="w-3 h-3" />
                      {c.ship?.name} · {c.ship?.cruiseLine?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">{c._count?.sailings ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
