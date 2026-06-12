'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, RefreshCw, AlertTriangle, Database, Play } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import adminApi from '../../../api/admin';

export default function OperationsPage() {
  const [queues, setQueues] = useState<Record<string, any>>({});
  const [etlStatus, setEtlStatus] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [dataQuality, setDataQuality] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [failedJobs, setFailedJobs] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [q, status, runRes, dq] = await Promise.all([
        adminApi.etl.queues(),
        adminApi.etl.status(),
        adminApi.etl.runs({ limit: 10 }),
        adminApi.etl.dataQuality(),
      ]);
      setQueues(q.data.data || {});
      setEtlStatus(status.data.data);
      setRuns(runRes.data.data?.runs ?? []);
      setDataQuality(dq.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const loadFailed = async (name: string) => {
    setSelectedQueue(name);
    const res = await adminApi.etl.failedJobs(name);
    setFailedJobs(res.data.data?.jobs || []);
  };

  const retry = async (name: string, jobId: string) => {
    await adminApi.etl.retryJob(name, jobId);
    await loadFailed(name);
  };

  if (loading) {
    return <LoadingSpinner message="Loading operations..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-blue-400" />
            ETL & Operations
          </h1>
          <p className="text-sm text-white mt-1">Queues, ETL runs, and data quality snapshots</p>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-lg border border-border text-sm text-white flex cursor-pointer bg-orange-500 items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {dataQuality && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Cruises', value: dataQuality.totalCruises },
            { label: 'Active sailings', value: dataQuality.totalActiveSailings },
            { label: 'Stale cruises', value: dataQuality.staleCruises },
            { label: 'Freshness (h)', value: dataQuality.dataFreshnessHours?.toFixed?.(1) ?? dataQuality.dataFreshnessHours },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 rounded-xl">
              <p className="text-xs text-muted-foreground uppercase">{s.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="glass-panel rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" /> Queue status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(queues).map(([key, q]: [string, any]) => (
            <div key={key} className="p-4 rounded-xl border border-border bg-muted/5">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-white text-sm">{q.name || key}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${q.failed > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {q.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">waiting {q.waiting} · active {q.active} · failed {q.failed}</p>
              {q.failed > 0 && (
                <button onClick={() => loadFailed(q.name)} className="mt-3 text-xs text-blue-400 hover:underline flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> View failed jobs
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedQueue && (
        <div className="glass-panel rounded-2xl p-6 border border-border">
          <h3 className="text-white font-semibold mb-3">Failed jobs — {selectedQueue}</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {failedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No failed jobs</p>
            ) : (
              failedJobs.map((j) => (
                <div key={j.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/10 text-sm">
                  <span className="text-muted-foreground font-mono">{j.id}</span>
                  <button onClick={() => retry(selectedQueue, j.id)} className="text-blue-400 flex items-center gap-1">
                    <Play className="w-3 h-3" /> Retry
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-white mb-4">Recent ETL runs</h2>
        {etlStatus && (
          <p className="text-sm text-muted-foreground mb-4">
            Redis coordination keys: {etlStatus.totalKeys ?? 0}
          </p>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-2">OTA</th>
              <th className="py-2">Line</th>
              <th className="py-2">Status</th>
              <th className="py-2">Started</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(runs) ? runs : []).map((r: any) => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="py-2 text-white">{r.otaName}</td>
                <td className="py-2">{r.cruiseLineKey}</td>
                <td className="py-2">{r.status}</td>
                <td className="py-2 text-muted-foreground">{new Date(r.startedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
