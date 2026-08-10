 'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User as UserIcon, 
  ShieldAlert, 
  ChevronLeft,
  Mail,
  CalendarDays,
  Activity,
  History,
  Key,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import api from '../../../../api/api';

export default function UserDetailsPage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const { userId } = use(params);
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Forms state
  const [actionLoading, setActionLoading] = useState(false);
  const [quota, setQuota] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/users/${userId}`);
      const data = response.data.data;
      setUser(data);
      setQuota(data.max_tracked_cruises?.toString() || '100');
      if (data.plan_expiry_date) {
        setExpiryDate(new Date(data.plan_expiry_date).toISOString().split('T')[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleToggleSuspend = async () => {
    if (!confirm(`Are you sure you want to ${user.isSuspended ? 'activate' : 'suspend'} this user?`)) return;
    
    try {
      setActionLoading(true);
      await api.put(`/admin/users/${userId}/status`, {
        action: user.isSuspended ? 'ACTIVATED' : 'SUSPENDED',
        reason: 'Admin action via dashboard'
      });
      showSuccess(`User ${user.isSuspended ? 'activated' : 'suspended'} successfully`);
      await fetchUserDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.put(`/admin/users/${userId}/quota`, {
        maxTrackedCruises: parseInt(quota, 10),
        planExpiryDate: expiryDate ? new Date(expiryDate).toISOString() : null
      });
      showSuccess('User quota updated successfully');
      await fetchUserDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update quota');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!confirm('Are you sure you want to send a password reset link to this user?')) return;
    
    try {
      setActionLoading(true);
      await api.post(`/admin/users/${userId}/reset-password`);
      showSuccess('Password reset link triggered successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to trigger password reset');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading User Details..." />;
  }

  if (error && !user) {
    return (
      <div className="p-6 bg-danger-light border border-danger/30 rounded-xl text-danger">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 zc-reveal pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/users')}
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="zc-page-title flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-blue/20 to-brand-teal/20 text-brand-blue border border-brand-blue/20 flex items-center justify-center text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              {user?.name}
            </h1>
            <p className="zc-page-subtitle flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              {user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user?.isSuspended ? (
            <span className="zc-badge-danger">
              <ShieldAlert className="w-4 h-4" />
              SUSPENDED
            </span>
          ) : (
            <span className="zc-badge-success">
              <CheckCircle2 className="w-4 h-4" />
              ACTIVE
            </span>
          )}
          <span className={user?.role === 'ADMIN' ? 'zc-badge-info' : 'zc-badge-neutral'}>
            {user?.role}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-light border border-danger/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger/80">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-success-light border border-success/30 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <p className="text-sm text-success/80">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats & Meta */}
        <div className="space-y-6">
          <div className="zc-card p-6">
            <h3 className="zc-section-title mb-4 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-blue" />
              Activity Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/5 border border-border">
                <span className="text-sm text-muted-foreground">Tracked Sailings</span>
                <span className="text-lg font-bold text-foreground">{user?._count?.trackedSailings || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/5 border border-border">
                <span className="text-sm text-muted-foreground">Affiliate Clicks</span>
                <span className="text-lg font-bold text-foreground">{user?._count?.affiliateClicks || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/5 border border-border">
                <span className="text-sm text-muted-foreground">Posts / Reviews</span>
                <span className="text-lg font-bold text-foreground">{user?._count?.posts || 0}</span>
              </div>
            </div>
          </div>

          <div className="zc-card p-6">
            <h3 className="zc-section-title mb-4 uppercase tracking-wider">
              Profile Meta
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-xs text-foreground">{user?.id}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Country</span>
                <span className="text-foreground uppercase">{user?.country || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Joined At</span>
                <span className="text-foreground">{new Date(user?.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted-foreground">Admin Profile</span>
                <span className={user?.adminProfile ? 'text-success' : 'text-muted-foreground'}>
                  {user?.adminProfile ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Plan & Quota Management */}
          <div className="zc-card p-6">
            <h3 className="zc-section-title mb-4 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-teal" />
              Plan & Quota Settings
            </h3>
            <form onSubmit={handleUpdateQuota} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Max Tracked Cruises</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={quota}
                    onChange={(e) => setQuota(e.target.value)}
                    className="zc-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Plan Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="zc-input"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="zc-btn-primary"
                >
                  {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Update Plan Settings
                </button>
              </div>
            </form>
          </div>

          {/* Security & Access Management */}
          <div className="zc-card p-6">
            <h3 className="zc-section-title mb-4 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-danger" />
              Access Control & Security
            </h3>

            <div className="space-y-4">
              {/* Suspend / Activate Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/5">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Account Status</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user?.isSuspended
                      ? 'Re-activate this user to allow them to log in and use the platform.'
                      : 'Suspend this user to prevent them from logging in.'}
                  </p>
                </div>
                <button
                  onClick={handleToggleSuspend}
                  disabled={actionLoading}
                  className={`whitespace-nowrap ${user?.isSuspended ? 'zc-btn-success' : 'zc-btn-danger'}`}
                >
                  {user?.isSuspended ? 'Activate Account' : 'Suspend Account'}
                </button>
              </div>

              {/* Password Reset Trigger */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/5">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Password Reset</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Send an email to the user with a secure link to reset their password.
                  </p>
                </div>
                <button
                  onClick={handlePasswordReset}
                  disabled={actionLoading}
                  className="zc-btn-primary whitespace-nowrap"
                >
                  <Key className="w-4 h-4" />
                  Send Reset Link
                </button>
              </div>
            </div>
          </div>

          {/* History Timeline */}
          <div className="zc-card p-6">
            <h3 className="zc-section-title mb-4 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-brand-blue" />
              Status & Audit History
            </h3>

            <div className="space-y-4">
              {user?.statusHistory && user.statusHistory.length > 0 ? (
                <div className="relative border-l border-border ml-3 space-y-6 pb-2">
                  {user.statusHistory.map((status: any, idx: number) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute w-3 h-3 rounded-full bg-brand-blue border-[3px] border-background -left-[6.5px] top-1.5" />
                      <div className="bg-muted/5 border border-border rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={
                            status.action.includes('SUSPEND') ? 'zc-badge-danger' :
                            status.action.includes('QUOTA') ? 'zc-badge-info' :
                            'zc-badge-success'
                          }>
                            {status.action}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {new Date(status.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{status.reason || 'No reason provided'}</p>
                        {status.metadata && (
                          <pre className="text-xs text-muted-foreground bg-background border border-border p-2 rounded-lg overflow-x-auto mt-2">
                            {JSON.stringify(status.metadata, null, 2)}
                          </pre>
                        )}
                        <p className="text-[10px] text-muted-foreground uppercase pt-2 border-t border-border/50">
                          Performed By: <span className="font-mono text-foreground">{status.performedBy}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                  No status history found for this user.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
