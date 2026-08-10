'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Database, Server, Cpu, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import api from '../../../api/api';

interface WorkerStatus {
  name: string;
  status: string;
  cpu: number;
  memory: number;
  uptime: number;
  restarts: number;
}

interface HealthData {
  status: string;
  timestamp: string;
  services: {
    database: { status: string; latencyMs: number };
    redis: { status: string; latencyMs: number; totalKeys: number };
    pm2: { status: string; workers: WorkerStatus[] };
  };
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealthData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const response = await api.get('/admin/system/health');
      setHealth(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch system health');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m ${seconds % 60}s`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading System Diagnostics..." />;
  }

  return (
    <div className="space-y-8 zc-reveal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="zc-page-title flex items-center gap-2">
            <Activity className="w-6 h-6 text-brand-blue" />
            System Health
          </h1>
          <p className="zc-page-subtitle">
            Real-time diagnostics and infrastructure monitoring
          </p>
        </div>
        <button
          onClick={fetchHealthData}
          disabled={isRefreshing}
          className="zc-btn-outline"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-danger-light border border-danger/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-danger">Error fetching diagnostics</h3>
            <p className="text-xs text-danger/80">{error}</p>
          </div>
        </div>
      )}

      {health && (
        <div className="space-y-6">
          {/* Global Status */}
          <div className={`p-6 rounded-2xl border ${health.status === 'healthy' ? 'bg-success-light border-success/20' : 'bg-warning-light border-warning/20'} flex items-center justify-between`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${health.status === 'healthy' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                {health.status === 'healthy' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="zc-section-title uppercase tracking-wider">
                  {health.status === 'healthy' ? 'All Systems Operational' : 'Degraded Performance'}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated: {new Date(health.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database Service */}
            <div className="zc-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-brand-blue" />
                  <h3 className="zc-section-title">PostgreSQL Database</h3>
                </div>
                <span className={health.services.database.status === 'healthy' ? 'zc-badge-success' : 'zc-badge-danger'}>
                  {health.services.database.status.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/5 rounded-xl border border-border">
                  <span className="block text-xs text-muted-foreground mb-1">Latency</span>
                  <span className="text-xl font-bold text-foreground">{health.services.database.latencyMs} ms</span>
                </div>
              </div>
            </div>

            {/* Redis Service */}
            <div className="zc-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-danger" />
                  <h3 className="zc-section-title">Redis Cache</h3>
                </div>
                <span className={health.services.redis.status === 'healthy' ? 'zc-badge-success' : 'zc-badge-danger'}>
                  {health.services.redis.status.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/5 rounded-xl border border-border">
                  <span className="block text-xs text-muted-foreground mb-1">Latency</span>
                  <span className="text-xl font-bold text-foreground">{health.services.redis.latencyMs} ms</span>
                </div>
                <div className="p-3 bg-muted/5 rounded-xl border border-border">
                  <span className="block text-xs text-muted-foreground mb-1">Total Keys</span>
                  <span className="text-xl font-bold text-foreground">{health.services.redis.totalKeys.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PM2 Workers */}
          <div className="zc-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-warning" />
                <h3 className="zc-section-title">PM2 Workers & Processes</h3>
              </div>
              <span className={health.services.pm2.status === 'active' ? 'zc-badge-success' : 'zc-badge-danger'}>
                  {health.services.pm2.status.toUpperCase()}
              </span>
            </div>

            {health.services.pm2.workers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                No PM2 workers detected. Make sure PM2 is running and processes are managed by it.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr>
                      <th className="zc-table-head-cell">Process Name</th>
                      <th className="zc-table-head-cell">Status</th>
                      <th className="zc-table-head-cell">CPU</th>
                      <th className="zc-table-head-cell">Memory</th>
                      <th className="zc-table-head-cell">Uptime</th>
                      <th className="zc-table-head-cell">Restarts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {health.services.pm2.workers.map((worker, idx) => (
                      <tr key={idx} className="zc-table-row">
                        <td className="zc-table-cell font-medium text-foreground">{worker.name}</td>
                        <td className="zc-table-cell">
                          <span className={worker.status === 'online' ? 'zc-badge-success' : 'zc-badge-danger'}>
                            {worker.status}
                          </span>
                        </td>
                        <td className="zc-table-cell text-muted-foreground">{worker.cpu}%</td>
                        <td className="zc-table-cell text-muted-foreground">{worker.memory} MB</td>
                        <td className="zc-table-cell text-muted-foreground">{formatUptime(worker.uptime)}</td>
                        <td className="zc-table-cell text-muted-foreground">{worker.restarts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
