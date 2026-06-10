'use client';

import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import adminApi from '../../../api/admin';

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.notifications.list({ limit: 50 });
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-400" />
            Admin Notifications
          </h1>
          <p className="text-sm text-white mt-1">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 text-sm border border-blue-500/30">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-white">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-white glass-panel p-8 rounded-xl text-center">No notifications yet</p>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={`glass-panel p-4 rounded-xl border flex justify-between gap-4 ${
                n.isRead ? 'border-border opacity-70' : 'border-blue-500/30'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    n.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                    n.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>{n.severity}</span>
                  <span className="text-xs text-muted-foreground">{n.type}</span>
                </div>
                <h3 className="text-white font-medium mt-1">{n.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.isRead && (
                <button onClick={() => markOne(n.id)} className="text-xs text-blue-400 shrink-0 h-fit">
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
