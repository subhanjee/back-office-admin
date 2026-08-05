'use client';

import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import adminApi from '../../../api/admin';

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.notifications.list({ limit: '50' });
      const data = res.data.data;
      setItems(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    await adminApi.notifications.markAllRead();
    load();
  };

  const markOne = async (id: string) => {
    await adminApi.notifications.markRead(id);
    load();
  };

  return (
    <div className="space-y-6 zc-reveal">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="zc-page-title flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-blue" />
            Admin Notifications
          </h1>
          <p className="zc-page-subtitle">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue/20 text-brand-blue text-sm border border-brand-blue/30">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <LoadingSpinner message="Loading notifications..." containerHeight="min-h-[40vh]" />
        ) : items.length === 0 ? (
          <p className="text-slate-500 zc-card p-8 text-center">No notifications yet</p>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={`zc-card p-4 border flex justify-between gap-4 ${
                n.isRead ? 'border-border opacity-70' : 'border-brand-blue/30'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={
                    n.severity === 'CRITICAL' ? 'zc-badge-danger' :
                    n.severity === 'WARNING' ? 'zc-badge-warning' : 'zc-badge-info'
                  }>{n.severity}</span>
                  <span className="text-xs text-muted-foreground">{n.type}</span>
                </div>
                <h3 className="text-slate-900 font-medium mt-1">{n.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.isRead && (
                <button onClick={() => markOne(n.id)} className="text-xs text-brand-blue hover:text-brand-navy shrink-0 h-fit">
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
