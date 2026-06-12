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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-400" />
            System Health
          </h1>
          <p className="text-sm text-white mt-1">
            Real-time diagnostics and infrastructure monitoring
          </p>
        </div>
        <button
          onClick={fetchHealthData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 cursor-pointer text-white border border-blue-500/20 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-red-400">Error fetching diagnostics</h3>
            <p className="text-xs text-red-400/80">{error}</p>
          </div>
        </div>
      )}

      {health && (
        <div className="space-y-6">
          {/* Global Status */}
          <div className={`p-6 rounded-2xl border ${health.status === 'healthy' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'} flex items-center justify-between`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${health.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {health.status === 'healthy' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                  {health.status === 'healthy' ? 'All Systems Operational' : 'Degraded Performance'}
                </h2>
                <p className="text-xs text-white mt-1">
                  Last updated: {new Date(health.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database Service */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-white">PostgreSQL Database</h3>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  health.services.database.status === 'healthy' 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {health.services.database.status.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/5 rounded-xl border border-border">
                  <span className="block text-xs text-muted-foreground mb-1">Latency</span>
                  <span className="text-xl font-bold text-white">{health.services.database.latencyMs} ms</span>
                </div>
              </div>
            </div>

            {/* Redis Service */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-red-400" />
                  <h3 className="font-semibold text-white">Redis Cache</h3>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  health.services.redis.status === 'healthy' 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {health.services.redis.status.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/5 rounded-xl border border-border">
                  <span className="block text-xs text-muted-foreground mb-1">Latency</span>
                  <span className="text-xl font-bold text-white">{health.services.redis.latencyMs} ms</span>
                </div>
                <div className="p-3 bg-muted/5 rounded-xl border border-border">
                  <span className="block text-xs text-muted-foreground mb-1">Total Keys</span>
                  <span className="text-xl font-bold text-white">{health.services.redis.totalKeys.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PM2 Workers */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">PM2 Workers & Processes</h3>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  health.services.pm2.status === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
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
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/5">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Process Name</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">CPU</th>
                      <th className="px-4 py-3">Memory</th>
                      <th className="px-4 py-3">Uptime</th>
                      <th className="px-4 py-3 rounded-r-lg">Restarts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {health.services.pm2.workers.map((worker, idx) => (
                      <tr key={idx} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{worker.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            worker.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {worker.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{worker.cpu}%</td>
                        <td className="px-4 py-3 text-muted-foreground">{worker.memory} MB</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatUptime(worker.uptime)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{worker.restarts}</td>
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
