'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import ZapCruisePageBackground from '../../components/layout/ZapCruisePageBackground';
import ZapCruiseLogo from '../../components/layout/ZapCruiseLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login, checkAuth, user, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Clear any stale errors and verify existing session on load
  useEffect(() => {
    clearError();

    const verifyAuth = async () => {
      if (!user) {
        await checkAuth();
      }
    };

    verifyAuth();
  }, [user, clearError, checkAuth]);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const success = await login(email, password);
    if (success) {
      router.push('/');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative p-6 overflow-hidden">
      <ZapCruisePageBackground />

      <div className="w-full max-w-md z-10 space-y-8">
        {/* Portal Branding logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="bg-white rounded-2xl px-6 py-3 shadow-sm">
            <ZapCruiseLogo className="h-14 w-auto" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Administrator Portal
            </h1>
            <p className="text-sm text-white/80">
              Sign in to access the administrator back-office
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl relative text-gray-900">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Error Message Box */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Authentication Error</span>
                  <p className="mt-0.5 text-red-300/80 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/95 border border-black/10 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0099FF] transition-all text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/95 border border-black/10 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0099FF] transition-all text-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
