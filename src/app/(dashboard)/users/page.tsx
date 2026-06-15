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
  const [roleFilter, setRoleFilter] = useState('');
  
  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter) params.append('role', roleFilter);

      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-orange-500" />
            Users Management
          </h1>
          <p className="text-sm text-white mt-1">
            View and manage customer accounts
          </p>
        </div>
        <button
          onClick={() => fetchUsers(pagination.page)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white cursor-pointer border border-orange-500/20 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-white cursor-not-allowed' : 'text-white cursor-pointer'}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-xl space-y-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full  border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
          >
            <option value="">All Roles</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 cursor-pointer text-white rounded-lg font-medium text-sm transition-colors"
            >
              Search
            </button>
            {(searchQuery || roleFilter) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 bg-muted hover:bg-muted/80 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/5 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Status / Role</th>
                <th className="px-6 py-4 font-semibold">Activity</th>
                <th className="px-6 py-4 font-semibold">Plan</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
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
                  <tr key={user.id} className="hover:bg-muted/5 transition-colors group cursor-pointer" onClick={() => router.push(`/users/${user.id}`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {user.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                          {user.country && <div className="text-[10px] text-muted-foreground uppercase mt-0.5">{user.country}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2 items-start">
                        {user.isSuspended ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 inline-flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            SUSPENDED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ACTIVE
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' : 'bg-muted text-muted-foreground'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-xs text-white">
                          <span className="font-semibold text-blue-400">{user._count.trackedSailings}</span> Tracks
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold text-white">{user._count.affiliateClicks}</span> Clicks
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-xs text-white">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/users/${user.id}`);
                        }}
                        className="p-2 cursor-pointer bg-orange-500/20 rounded-lg text-orange-400 transition-colors inline-flex border border-transparent hover:border-orange-500/30"
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
              Showing <span className="font-medium text-white">{users.length}</span> of <span className="font-medium text-white">{pagination.total}</span> users
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-border bg-background hover:bg-muted text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-white px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg border border-border bg-background hover:bg-muted text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
