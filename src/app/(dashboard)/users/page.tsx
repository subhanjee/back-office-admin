'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users as UsersIcon, 
  Search, 
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CalendarDays
} from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import api from '../../../api/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  country: string | null;
  max_tracked_cruises: number;
  plan_expiry_date: string | null;
  createdAt: string;
  isSuspended: boolean;
  _count: {
    trackedSailings: number;
    affiliateClicks: number;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UsersListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      
      if (searchQuery) params.append('search', searchQuery);

      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 zc-reveal pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="zc-page-title flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-brand-blue" />
            Users Management
          </h1>
          <p className="zc-page-subtitle">
            View and manage customer accounts
          </p>
        </div>
        <button
          onClick={() => fetchUsers(pagination.page)}
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
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="zc-input pl-9"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="zc-select"
          >
            <option value="">All Roles</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="zc-btn-primary flex-1"
            >
              Search
            </button>
            {searchQuery && (
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

      {/* Users Table */}
      <div className="zc-table-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr>
                <th className="zc-table-head-cell">User</th>
                <th className="zc-table-head-cell">Status / Role</th>
                <th className="zc-table-head-cell">Activity</th>
                <th className="zc-table-head-cell">Plan</th>
                <th className="zc-table-head-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <LoadingSpinner message="Loading users..." containerHeight="min-h-[20vh]" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="zc-table-row group cursor-pointer" onClick={() => router.push(`/users/${user.id}`)}>
                    <td className="zc-table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-blue/20 to-brand-teal/20 text-brand-blue border border-brand-blue/20 flex items-center justify-center shrink-0 font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground group-hover:text-brand-blue transition-colors">
                            {user.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                          {user.country && <div className="text-[10px] text-muted-foreground uppercase mt-0.5">{user.country}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="zc-table-cell whitespace-nowrap">
                      <div className="flex flex-col gap-2 items-start">
                        {user.isSuspended ? (
                          <span className="zc-badge-danger">
                            <ShieldAlert className="w-3 h-3" />
                            SUSPENDED
                          </span>
                        ) : (
                          <span className="zc-badge-success">
                            ACTIVE
                          </span>
                        )}
                        <span className={user.role === 'ADMIN' ? 'zc-badge-info' : 'zc-badge-neutral'}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="zc-table-cell whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-xs text-foreground">
                          <span className="font-semibold text-brand-blue">{user._count.trackedSailings}</span> Tracks
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{user._count.affiliateClicks}</span> Clicks
                        </div>
                      </div>
                    </td>
                    <td className="zc-table-cell whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-xs text-foreground">
                          Quota: <span className="font-semibold">{user.max_tracked_cruises}</span>
                        </div>
                        {user.plan_expiry_date && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(user.plan_expiry_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="zc-table-cell whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/users/${user.id}`);
                        }}
                        className="p-2 cursor-pointer bg-brand-blue/10 rounded-lg text-brand-blue transition-colors inline-flex border border-transparent hover:border-brand-blue/30"
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
        {!loading && users.length > 0 && (
          <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between bg-muted/5">
            <span className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{users.length}</span> of <span className="font-medium text-foreground">{pagination.total}</span> users
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="zc-btn-secondary p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-foreground px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="zc-btn-secondary p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
