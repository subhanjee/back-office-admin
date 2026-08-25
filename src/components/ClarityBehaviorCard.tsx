'use client';

import React, { useEffect, useState } from 'react';
import {
  Eye,
  ExternalLink,
  MousePointerClick,
  Users,
  UserCheck,
  Bot,
  ScrollText,
  MousePointer2,
  Undo2,
  AlertTriangle,
} from 'lucide-react';
import adminApi from '../api/admin';

interface Signal { sessions: number; pct: number }
interface ClarityStats {
  configured: boolean;
  numOfDays?: number;
  rateLimited?: boolean;
  error?: string;
  dashboardUrl: string;
  traffic?: { sessions: number; bots: number; distinctUsers: number; pagesPerSession: number };
  engagement?: { avgScrollDepth: number; totalTime: number; activeTime: number };
  behavior?: {
    rageClicks: Signal;
    deadClicks: Signal;
    quickBacks: Signal;
    excessiveScroll: Signal;
    scriptErrors: Signal;
  };
  generatedAt?: string;
}

const nf = (n: number) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 1 });

// Tailwind can't see dynamically-built class strings, so each accent is spelled out in full.
const ACCENTS: Record<string, { badge: string; tint: string; bar: string; text: string }> = {
  blue: { badge: 'bg-brand-blue/10 text-brand-blue', tint: 'from-brand-blue/[0.07]', bar: 'bg-brand-blue', text: 'text-brand-blue' },
  teal: { badge: 'bg-brand-teal/10 text-brand-teal', tint: 'from-brand-teal/[0.07]', bar: 'bg-brand-teal', text: 'text-brand-teal' },
  success: { badge: 'bg-success/10 text-success', tint: 'from-success/[0.07]', bar: 'bg-success', text: 'text-success' },
  warning: { badge: 'bg-warning/10 text-warning', tint: 'from-warning/[0.07]', bar: 'bg-warning', text: 'text-warning' },
  danger: { badge: 'bg-danger/10 text-danger', tint: 'from-danger/[0.07]', bar: 'bg-danger', text: 'text-danger' },
};

export default function ClarityBehaviorCard() {
  const [stats, setStats] = useState<ClarityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    adminApi.analytics
      .clarity(3)
      .then((res) => {
        if (active) setStats(res.data.data ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const dashboardUrl = stats?.dashboardUrl || 'https://clarity.microsoft.com/';

  return (
    <div className="zc-card overflow-hidden p-0">
      {/* Gradient header */}
      <div className="relative flex items-center justify-between gap-3 px-6 py-5 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-teal">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 0%, rgba(255,255,255,0.25), transparent 45%), radial-gradient(circle at 90% 120%, rgba(94,234,212,0.35), transparent 50%)',
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="zc-icon-badge bg-white/15 text-white backdrop-blur-sm ring-1 ring-white/25">
            <Eye className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-white font-semibold text-base leading-tight">User behaviour</h3>
            <p className="text-white/70 text-xs mt-0.5">
              Microsoft Clarity{stats?.numOfDays ? ` · last ${stats.numOfDays} days` : ''}
            </p>
          </div>
        </div>
        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 backdrop-blur-sm ring-1 ring-white/25 transition-colors whitespace-nowrap shrink-0"
        >
          Recordings & heatmaps <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="zc-shimmer p-4 rounded-2xl bg-muted/20 border border-border">
                <div className="h-9 w-9 bg-muted rounded-xl mb-3" />
                <div className="h-3 w-16 bg-muted rounded mb-2" />
                <div className="h-6 w-12 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : !stats || !stats.configured ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-center">
            <span className="zc-icon-badge mx-auto mb-3 bg-brand-blue/10 text-brand-blue">
              <Eye className="w-5 h-5" />
            </span>
            <p className="text-foreground font-semibold mb-1">Clarity API not connected</p>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
              Add a Clarity Data Export API token on the backend
              (<code className="text-xs px-1 py-0.5 rounded bg-muted">CLARITY_API_TOKEN</code>) to show live
              behaviour stats here. Recordings and heatmaps are always available in the dashboard.
            </p>
            <a
              href={dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="zc-btn-primary inline-flex items-center gap-1.5 text-sm"
            >
              Open Clarity dashboard <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : stats.rateLimited || stats.error ? (
          <div className="rounded-2xl border border-warning/30 bg-warning-light p-4 text-sm text-warning-hover flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {stats.rateLimited
              ? 'Clarity API rate limit reached (≈10 requests/day). Stats will refresh automatically later.'
              : stats.error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Traffic + engagement KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Sessions', value: nf(stats.traffic?.sessions ?? 0), icon: Users, accent: 'blue' },
                { label: 'Distinct users', value: nf(stats.traffic?.distinctUsers ?? 0), icon: UserCheck, accent: 'teal' },
                { label: 'Pages / session', value: nf(stats.traffic?.pagesPerSession ?? 0), icon: MousePointerClick, accent: 'success' },
                { label: 'Avg scroll depth', value: `${nf(stats.engagement?.avgScrollDepth ?? 0)}%`, icon: ScrollText, accent: 'warning' },
              ].map((k) => {
                const a = ACCENTS[k.accent];
                const Icon = k.icon;
                return (
                  <div
                    key={k.label}
                    className={`group relative overflow-hidden p-4 rounded-2xl border border-border bg-gradient-to-br ${a.tint} to-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-premium`}
                  >
                    <span className={`zc-icon-badge ${a.badge} mb-3`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <h4 className="text-2xl font-bold text-foreground tabular-nums leading-none">{k.value}</h4>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-1.5">
                      {k.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Friction signals */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-4 w-1 rounded-full bg-gradient-to-b from-brand-blue to-brand-teal" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Friction signals</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Rage clicks', sig: stats.behavior?.rageClicks, icon: MousePointer2, accent: 'danger' },
                  { label: 'Dead clicks', sig: stats.behavior?.deadClicks, icon: MousePointerClick, accent: 'warning' },
                  { label: 'Quick backs', sig: stats.behavior?.quickBacks, icon: Undo2, accent: 'teal' },
                  { label: 'Script errors', sig: stats.behavior?.scriptErrors, icon: AlertTriangle, accent: 'danger' },
                ].map((b) => {
                  const a = ACCENTS[b.accent];
                  const pct = Math.max(0, Math.min(100, b.sig?.pct ?? 0));
                  const Icon = b.icon;
                  return (
                    <div key={b.label} className="p-4 rounded-2xl border border-border bg-card transition-all duration-200 hover:shadow-soft">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                          <Icon className={`w-3.5 h-3.5 ${a.text}`} />
                          {b.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold text-foreground tabular-nums">{nf(b.sig?.sessions ?? 0)}</span>
                        <span className="text-[11px] text-muted-foreground">sessions</span>
                      </div>
                      <div className="mt-2.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${a.bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">{nf(pct)}% of sessions</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60">
              {stats.traffic && stats.traffic.bots > 0 ? (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" /> {nf(stats.traffic.bots)} bot sessions excluded above
                </p>
              ) : <span />}
              {stats.generatedAt ? (
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  Updated {new Date(stats.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
