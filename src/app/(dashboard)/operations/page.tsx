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
    <div className="space-y-8 zc-reveal">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="zc-page-title flex items-center gap-2">
            <Cpu className="w-6 h-6 text-brand-blue" />
            ETL & Operations
          </h1>
          <p className="zc-page-subtitle">Queues, ETL runs, and data quality snapshots</p>
        </div>
        <button onClick={load} className="zc-btn-outline">
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
            <div key={s.label} className="zc-card p-4">
              <p className="text-xs text-muted-foreground uppercase">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="zc-card p-6">
        <h2 className="zc-section-title mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-brand-blue" /> Queue status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(queues).map(([key, q]: [string, any]) => (
            <div key={key} className="p-4 rounded-xl border border-border bg-muted/5">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-foreground text-sm">{q.name || key}</span>
                <span className={q.failed > 0 ? 'zc-badge-danger' : 'zc-badge-success'}>
                  {q.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">waiting {q.waiting} · active {q.active} · failed {q.failed}</p>
              {q.failed > 0 && (
                <button onClick={() => loadFailed(q.name)} className="mt-3 text-xs text-brand-blue hover:text-brand-navy hover:underline flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> View failed jobs
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedQueue && (
        <div className="zc-card p-6">
          <h3 className="zc-section-title mb-3">Failed jobs — {selectedQueue}</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {failedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No failed jobs</p>
            ) : (
              failedJobs.map((j) => (
                <div key={j.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/10 text-sm">
                  <span className="text-muted-foreground font-mono">{j.id}</span>
                  <button onClick={() => retry(selectedQueue, j.id)} className="text-brand-blue hover:text-brand-navy flex items-center gap-1">
                    <Play className="w-3 h-3" /> Retry
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="zc-card p-6">
        <h2 className="zc-section-title mb-4">Recent ETL runs</h2>
        {etlStatus && (
          <p className="text-sm text-muted-foreground mb-4">
            Redis coordination keys: {etlStatus.totalKeys ?? 0}
          </p>
        )}
        <div className="overflow-x-auto">
          <div className="zc-table-shell">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="zc-table-head-cell">OTA</th>
                  <th className="zc-table-head-cell">Line</th>
                  <th className="zc-table-head-cell">Status</th>
                  <th className="zc-table-head-cell">Started</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(runs) ? runs : []).map((r: any) => (
                  <tr key={r.id} className="zc-table-row">
                    <td className="zc-table-cell text-foreground">{r.otaName}</td>
                    <td className="zc-table-cell">{r.cruiseLineKey}</td>
                    <td className="zc-table-cell">{r.status}</td>
                    <td className="zc-table-cell text-muted-foreground">{new Date(r.startedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
