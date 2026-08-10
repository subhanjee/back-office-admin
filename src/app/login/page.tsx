'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Lock, Mail, Loader2, AlertCircle, ShieldCheck, Gauge } from 'lucide-react';
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
    <main className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden">
        <ZapCruisePageBackground />
        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16 text-white">
          {/* Brand logo — rendered white for the dark ocean panel (both themes) */}
          <ZapCruiseLogo
            variant="full"
            className="h-16 w-auto object-contain"
          />

          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl xl:text-[2.75rem] leading-[1.15] font-bold tracking-tight">
              Cruise decision intelligence, for your whole team.
            </h1>
            <p className="text-white/70 text-base leading-relaxed">
              Monitor pricing, users, and platform health from a single administrative back-office.
            </p>
          </div>

          <div className="flex items-center gap-6 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <ShieldCheck className="w-4 h-4 text-brand-aqua shrink-0" />
              Role-based access control
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Gauge className="w-4 h-4 text-brand-aqua shrink-0" />
              Real-time system health
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full lg:w-[54%] items-center justify-center bg-card p-6 sm:p-10">
        <div className="w-full max-w-sm zc-reveal">
          <ZapCruiseLogo variant="full" className="h-16 w-auto object-contain mb-10" />

          <div className="mb-8">
            <h2 className="zc-page-title text-[1.75rem]">Welcome back</h2>
            <p className="zc-page-subtitle">Sign in to access the administrator back-office</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message Box */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-light border border-danger/20 text-danger text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Authentication error</span>
                  <p className="mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="zc-label">
                Email address
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
                  className="zc-input pl-10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="zc-label">
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
                  className="zc-input pl-10"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full zc-btn-primary justify-center mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
