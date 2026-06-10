'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, UserPlus, Shield, UserCog, AlertCircle } from 'lucide-react';
import api from '../../../api/api';
import { useAuthStore } from '../../../store/authStore';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

interface AdminProfile {
  id: string;
  userId: string;
  adminRole: string;
  isSuspended: boolean;
  createdAt: string;
  user: {
    email: string;
    name: string;
  }
}

const AVAILABLE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'ANALYST',
  'OPERATIONS',
  'SUPPORT',
  'READ_ONLY'
];

export default function RbacManagementPage() {
  const { adminProfile: currentUserProfile } = useAuthStore();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('READ_ONLY');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/rbac/roles');
      setProfiles(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch admin profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingId(userId);
      await api.put(`/admin/rbac/roles/${userId}`, { adminRole: newRole });
      await fetchProfiles(); // refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setInviteLoading(true);
      setInviteError(null);
      await api.post('/admin/rbac/invite', { email: inviteEmail, adminRole: inviteRole });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('READ_ONLY');
      await fetchProfiles();
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to invite/assign admin');
    } finally {
      setInviteLoading(false);
    }
  };

  // Only SUPER_ADMIN can manage roles
  const canManage = currentUserProfile?.adminRole === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
            Role-Based Access Control
          </h1>
          <p className="text-sm text-white mt-1">
            Manage administrative roles and platform access levels
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProfiles}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-white border border-border rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {canManage && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-blue-500/20"
            >
              <UserPlus className="w-4 h-4" />
              Assign Admin
            </button>
          )}
        </div>
      </div>

      {!canManage && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-amber-400">View-Only Mode</h3>
            <p className="text-xs text-amber-400/80">
              Only users with the <strong>SUPER_ADMIN</strong> role can manage other administrators. You can view the current assignments but cannot make changes.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-red-400">Error</h3>
            <p className="text-xs text-red-400/80">{error}</p>
          </div>
        </div>
      )}

      {/* Admin Users Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/5 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Joined At</th>
                {canManage && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                      Loading profiles...
                    </div>
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No admin profiles found.
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                          {profile.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white">{profile.user.name}</div>
                          <div className="text-xs text-muted-foreground">{profile.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canManage && profile.userId !== currentUserProfile?.userId ? (
                        <div className="relative">
                          <select
                            value={profile.adminRole}
                            onChange={(e) => handleRoleChange(profile.userId, e.target.value)}
                            disabled={updatingId === profile.userId}
                            className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-400 focus:outline-none focus:border-blue-500 transition-colors appearance-none pr-8 cursor-pointer disabled:opacity-50"
                          >
                            {AVAILABLE_ROLES.map(role => (
                              <option key={role} value={role}>{role.replace('_', ' ')}</option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <Shield className="w-3.5 h-3.5 text-blue-400/50" />
                          </div>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" />
                          {profile.adminRole.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {profile.isSuspended ? (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/10 text-red-400">
                          SUSPENDED
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-xs">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {updatingId === profile.userId ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-500 inline-block" />
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            {profile.userId === currentUserProfile?.userId ? 'Current User' : ''}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCog className="w-5 h-5 text-blue-400" />
                Assign Admin Role
              </h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {inviteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  {inviteError}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white">User Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter user's email address..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <p className="text-xs text-muted-foreground">The user must already exist in the platform.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white">Admin Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                >
                  {AVAILABLE_ROLES.map(role => (
                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inviteLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Assign Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
