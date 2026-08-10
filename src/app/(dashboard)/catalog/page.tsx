'use client';

import React, { useEffect, useState } from 'react';
import { Database, Search, Ship } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
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
    <div className="space-y-6 zc-reveal">
      <div>
        <h1 className="zc-page-title flex items-center gap-2">
          <Database className="w-6 h-6 text-brand-blue" />
          Catalog Management
        </h1>
        <p className="zc-page-subtitle">Browse and correct cruise catalog data</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="zc-card p-3 text-center">
              <p className="text-xs text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
              <p className="text-xl font-bold text-foreground">{String(v)}</p>
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
            className="zc-input pl-10"
          />
        </div>
        <button type="submit" className="zc-btn-primary">Search</button>
      </form>

      <div className="zc-table-shell">
        {loading ? (
          <LoadingSpinner message="Loading catalog..." containerHeight="min-h-[40vh]" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="zc-table-head-cell">ID</th>
                <th className="zc-table-head-cell">Title</th>
                <th className="zc-table-head-cell">Ship / Line</th>
                <th className="zc-table-head-cell">Sailings</th>
              </tr>
            </thead>
            <tbody>
              {cruises.map((c) => (
                <tr key={c.id} className="zc-table-row">
                  <td className="zc-table-cell font-mono text-muted-foreground">{c.id}</td>
                  <td className="zc-table-cell text-foreground max-w-xs truncate">{c.title}</td>
                  <td className="zc-table-cell">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Ship className="w-3 h-3" />
                      {c.ship?.name} · {c.ship?.cruiseLine?.name}
                    </span>
                  </td>
                  <td className="zc-table-cell">{c._count?.sailings ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
