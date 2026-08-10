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
  if (error) return <div className="p-8 text-danger">Error: {error}</div>;
  if (!summary) return <div className="p-8 text-foreground">Unable to load insights</div>;

  const { demand, booking, ops } = summary;

  return (
    <div className="space-y-8 zc-reveal">
      <div>
        <h1 className="zc-page-title flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-warning" />
          Predictive Insights
        </h1>
        <p className="zc-page-subtitle">
          Heuristic recommendations (Phase 6) — upgradeable to LLM-backed analysis
        </p>
      </div>

      <section className="zc-card p-6 space-y-4">
        <h2 className="zc-section-title flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-warning" /> Demand forecast
        </h2>
        <p className="text-sm text-brand-blue">{demand?.recommendation}</p>
        <div className="flex flex-wrap gap-2">
          {(demand?.topQueries || []).map((q: any) => (
            <span key={q.query} className="text-xs px-3 py-1 rounded-full bg-muted/30 text-foreground">
              {q.query} ({q.count})
            </span>
          ))}
        </div>
      </section>

      <section className="zc-card p-6">
        <h2 className="zc-section-title mb-2">Booking window</h2>
        <p className="text-sm text-success">{booking?.recommendation}</p>
        <p className="text-xs text-muted-foreground mt-2">Confidence: {booking?.confidence}</p>
      </section>

      <section className="zc-card p-6 space-y-3">
        <h2 className="zc-section-title">Operational recommendations</h2>
        {(ops?.recommendations || []).map((r: any, i: number) => (
          <div
            key={i}
            className={`p-4 rounded-xl border text-sm ${
              r.priority === 'critical' ? 'border-danger/30 bg-danger/5' :
              r.priority === 'high' ? 'border-warning/30 bg-warning/5' : 'border-border bg-muted/10'
            }`}
          >
            <span className="text-xs uppercase font-bold text-muted-foreground">{r.area}</span>
            <p className="text-foreground mt-1">{r.message}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
