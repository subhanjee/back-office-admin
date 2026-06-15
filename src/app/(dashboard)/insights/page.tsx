'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Lightbulb } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import adminApi from '../../../api/admin';

export default function InsightsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.insights.summary()
      .then((res) => {
        setSummary(res.data.data);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load insights:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load insights');
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner message="Loading AI insights..." />;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
  if (!summary) return <div className="p-8 text-white">Unable to load insights</div>;

  const { demand, booking, ops } = summary;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400" />
          Predictive Insights
        </h1>
        <p className="text-sm text-white mt-1">
          Heuristic recommendations (Phase 6) — upgradeable to LLM-backed analysis
        </p>
      </div>

      <section className="glass-panel p-6 rounded-2xl border border-border space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" /> Demand forecast
        </h2>
        <p className="text-sm text-blue-300/90">{demand?.recommendation}</p>
        <div className="flex flex-wrap gap-2">
          {(demand?.topQueries || []).map((q: any) => (
            <span key={q.query} className="text-xs px-3 py-1 rounded-full bg-muted/30 text-white">
              {q.query} ({q.count})
            </span>
          ))}
        </div>
      </section>

      <section className="glass-panel p-6 rounded-2xl border border-border">
        <h2 className="text-lg font-semibold text-white mb-2">Booking window</h2>
        <p className="text-sm text-emerald-300/90">{booking?.recommendation}</p>
        <p className="text-xs text-muted-foreground mt-2">Confidence: {booking?.confidence}</p>
      </section>

      <section className="glass-panel p-6 rounded-2xl border border-border space-y-3">
        <h2 className="text-lg font-semibold text-white">Operational recommendations</h2>
        {(ops?.recommendations || []).map((r: any, i: number) => (
          <div
            key={i}
            className={`p-4 rounded-xl border text-sm ${
              r.priority === 'critical' ? 'border-red-500/30 bg-red-500/5' :
              r.priority === 'high' ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-muted/10'
            }`}
          >
            <span className="text-xs uppercase font-bold text-muted-foreground">{r.area}</span>
            <p className="text-white mt-1">{r.message}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
