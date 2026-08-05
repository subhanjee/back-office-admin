'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  Eye,
  Info
} from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import api from '../../../api/api';

interface AuditLog {
  id: string;
  adminEmail: string;
  adminRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  details?: any;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AuditLogViewerPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchEmail, setSearchEmail] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '15');
      
      if (searchEmail) params.append('adminEmail', searchEmail);
      if (actionFilter) params.append('action', actionFilter);
      if (resourceFilter) params.append('resource', resourceFilter);

      const response = await api.get(`/admin/audit/logs?${params.toString()}`);
      setLogs(response.data.data.logs);
      setPagination(response.data.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [searchEmail, actionFilter, resourceFilter]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleClearFilters = () => {
    setSearchEmail('');
    setActionFilter('');
    setResourceFilter('');
    // The effect will trigger fetchLogs(1) because dependencies change
  };

  return (
    <div className="space-y-6 zc-reveal pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="zc-page-title flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-blue" />
            Audit Logs
          </h1>
          <p className="zc-page-subtitle">
            Track and monitor administrative actions across the platform
          </p>
        </div>
        <button
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
          className="zc-btn-outline"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="zc-card p-4 space-y-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Admin Email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="zc-input pl-9"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="zc-select"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="USER_SUSPENDED">USER_SUSPENDED</option>
            <option value="USER_ACTIVATED">USER_ACTIVATED</option>
            <option value="ROLE_UPDATED">ROLE_UPDATED</option>
            <option value="CRUISE_UPDATED">CRUISE_UPDATED</option>
            <option value="SYSTEM_SETTINGS_UPDATED">SYSTEM_SETTINGS_UPDATED</option>
          </select>

          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="zc-select"
          >
            <option value="">All Resources</option>
            <option value="Auth">Auth</option>
            <option value="User">User</option>
            <option value="AdminProfile">AdminProfile</option>
            <option value="Cruise">Cruise</option>
            <option value="Sailing">Sailing</option>
            <option value="System">System</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="zc-btn-primary flex-1"
            >
              Apply Filters
            </button>
            {(searchEmail || actionFilter || resourceFilter) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="zc-btn-ghost px-4"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-danger-light border border-danger/30 rounded-xl text-sm text-danger">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="zc-table-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr>
                <th className="zc-table-head-cell">Timestamp</th>
                <th className="zc-table-head-cell">Admin</th>
                <th className="zc-table-head-cell">Action</th>
                <th className="zc-table-head-cell">Resource</th>
                <th className="zc-table-head-cell text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <LoadingSpinner message="Loading logs..." containerHeight="min-h-[20vh]" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No audit logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="zc-table-row">
                    <td className="zc-table-cell whitespace-nowrap text-muted-foreground font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="zc-table-cell">
                      <div className="font-medium text-slate-900">{log.adminEmail}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{log.adminRole}</div>
                    </td>
                    <td className="zc-table-cell whitespace-nowrap">
                      <span className="zc-badge-info">
                        {log.action}
                      </span>
                    </td>
                    <td className="zc-table-cell whitespace-nowrap">
                      <span className="text-slate-900 font-medium">{log.resource}</span>
                      {log.resourceId && (
                        <span className="ml-2 text-xs text-muted-foreground font-mono">#{log.resourceId.slice(0, 8)}...</span>
                      )}
                    </td>
                    <td className="zc-table-cell text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 hover:bg-muted/20 rounded-lg text-brand-blue transition-colors inline-flex"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between bg-muted/5">
            <span className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-slate-900">{logs.length}</span> of <span className="font-medium text-slate-900">{pagination.total}</span> logs
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="zc-btn-secondary p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-900 px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="zc-btn-secondary p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="zc-card zc-pop shadow-premium-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/5">
              <h3 className="zc-section-title flex items-center gap-2">
                <Info className="w-5 h-5 text-brand-blue" />
                Audit Log Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-muted-foreground hover:text-slate-900 transition-colors p-1"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider">Action</span>
                  <span className="zc-badge-info">
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider">Timestamp</span>
                  <span className="text-sm font-mono text-slate-900">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider">Admin Email</span>
                  <span className="text-sm text-slate-900">{selectedLog.adminEmail}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider">Admin Role</span>
                  <span className="text-sm text-slate-900">{selectedLog.adminRole}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider">Resource</span>
                  <span className="text-sm text-slate-900">{selectedLog.resource}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider">Resource ID</span>
                  <span className="text-sm font-mono text-slate-900">{selectedLog.resourceId || 'N/A'}</span>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <span className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider">IP Address</span>
                    <span className="text-sm font-mono text-slate-900">{selectedLog.ipAddress}</span>
                  </div>
                )}
              </div>

              {selectedLog.details && (
                <div className="space-y-2">
                  <span className="block text-xs text-muted-foreground uppercase tracking-wider">Payload / Details</span>
                  <div className="bg-muted/10 p-4 rounded-xl border border-border overflow-x-auto">
                    <pre className="text-xs font-mono text-brand-blue">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border bg-muted/5 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="zc-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
