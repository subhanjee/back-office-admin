'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, UserPlus, Shield, UserCog, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
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
      setError(null);
      await api.patch(`/admin/rbac/roles/${userId}`, { adminRole: newRole });
      await fetchProfiles();
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
    <div className="space-y-6 zc-reveal pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="zc-page-title flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-brand-blue" />
            Role-Based Access Control
          </h1>
          <p className="zc-page-subtitle">
            Manage administrative roles and platform access levels
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProfiles}
            disabled={loading}
            className="zc-btn-outline"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {canManage && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="zc-btn-primary"
            >
              <UserPlus className="w-4 h-4" />
              Assign Admin
            </button>
          )}
        </div>
      </div>

      {!canManage && (
        <div className="p-4 bg-warning-light border border-warning/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-warning">View-Only Mode</h3>
            <p className="text-xs text-warning/80">
              Only users with the <strong>SUPER_ADMIN</strong> role can manage other administrators. You can view the current assignments but cannot make changes.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-danger-light border border-danger/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-danger">Error</h3>
            <p className="text-xs text-danger/80">{error}</p>
          </div>
        </div>
      )}

      {/* Admin Users Table */}
      <div className="zc-table-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr>
                <th className="zc-table-head-cell">User</th>
                <th className="zc-table-head-cell">Role</th>
                <th className="zc-table-head-cell">Status</th>
                <th className="zc-table-head-cell">Joined At</th>
                {canManage && <th className="zc-table-head-cell text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <LoadingSpinner message="Loading profiles..." containerHeight="min-h-[20vh]" />
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
                  <tr key={profile.id} className="zc-table-row">
                    <td className="zc-table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                          {profile.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{profile.user.name}</div>
                          <div className="text-xs text-muted-foreground">{profile.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="zc-table-cell whitespace-nowrap">
                      {canManage && profile.userId !== currentUserProfile?.userId ? (
                        <select
                          value={profile.adminRole}
                          onChange={(e) => handleRoleChange(profile.userId, e.target.value)}
                          disabled={updatingId === profile.userId}
                          className="zc-select"
                        >
                          {AVAILABLE_ROLES.map(role => (
                            <option key={role} value={role}>{role.replace('_', ' ')}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="zc-badge-info">
                          <Shield className="w-3.5 h-3.5" />
                          {profile.adminRole.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="zc-table-cell whitespace-nowrap">
                      {profile.isSuspended ? (
                        <span className="zc-badge-danger">
                          SUSPENDED
                        </span>
                      ) : (
                        <span className="zc-badge-success">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="zc-table-cell whitespace-nowrap text-muted-foreground text-xs">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </td>
                    {canManage && (
                      <td className="zc-table-cell whitespace-nowrap text-right">
                        {updatingId === profile.userId ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-brand-blue inline-block" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="zc-card zc-pop shadow-premium-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/5">
              <h3 className="zc-section-title flex items-center gap-2">
                <UserCog className="w-5 h-5 text-brand-blue" />
                Assign Admin Role
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {inviteError && (
                <div className="p-3 bg-danger-light border border-danger/30 rounded-lg text-xs text-danger">
                  {inviteError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="zc-label">User Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter user's email address..."
                  className="zc-input"
                />
                <p className="text-xs text-muted-foreground">The user must already exist in the platform.</p>
              </div>

              <div className="space-y-1.5">
                <label className="zc-label">Admin Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="zc-select"
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
                  className="zc-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="zc-btn-primary flex-1"
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
