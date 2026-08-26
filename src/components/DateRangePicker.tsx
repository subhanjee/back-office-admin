'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

export interface DateRange {
  startDate: string; // ISO
  endDate: string; // ISO
  label: string;
}

const DAY = 24 * 60 * 60 * 1000;

/** Preset builders — all return exact UTC instants, so backend [start,end) is unambiguous. */
function preset(label: string): DateRange {
  const now = new Date();
  const end = now;
  let start = new Date(now.getTime() - 30 * DAY);
  switch (label) {
    case 'Today': {
      const s = new Date(now);
      s.setHours(0, 0, 0, 0);
      start = s;
      break;
    }
    case 'Last 3 Days': start = new Date(now.getTime() - 3 * DAY); break;
    case 'Last 7 Days': start = new Date(now.getTime() - 7 * DAY); break;
    case 'Last 30 Days': start = new Date(now.getTime() - 30 * DAY); break;
    case 'Last 90 Days': start = new Date(now.getTime() - 90 * DAY); break;
    case 'Last 6 Months': { const s = new Date(now); s.setMonth(s.getMonth() - 6); start = s; break; }
    case 'Last 12 Months': { const s = new Date(now); s.setFullYear(s.getFullYear() - 1); start = s; break; }
  }
  return { startDate: start.toISOString(), endDate: end.toISOString(), label };
}

export const PRESETS = [
  'Today', 'Last 3 Days', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Last 6 Months', 'Last 12 Months',
];

export function defaultRange(): DateRange {
  return preset('Last 30 Days');
}

export default function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const applyPreset = (label: string) => {
    onChange(preset(label));
    setOpen(false);
  };

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    const s = new Date(customFrom);
    s.setHours(0, 0, 0, 0);
    const e = new Date(customTo);
    e.setHours(23, 59, 59, 999);
    if (s > e) return;
    const label = `${customFrom} → ${customTo}`;
    onChange({ startDate: s.toISOString(), endDate: e.toISOString(), label });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="zc-btn-secondary text-sm"
      >
        <Calendar className="w-4 h-4" />
        <span className="max-w-[200px] truncate">{value.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 z-30 zc-card p-2 shadow-premium zc-pop">
          <div className="space-y-0.5">
            {PRESETS.map((label) => {
              const active = value.label === label;
              return (
                <button
                  key={label}
                  onClick={() => applyPreset(label)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                    active ? 'bg-brand-blue/10 text-brand-blue font-semibold' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                  {active && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase px-1 mb-2">Custom range</p>
            <div className="flex items-center gap-2 px-1">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="zc-input text-xs py-1.5"
                aria-label="Start date"
              />
              <span className="text-muted-foreground text-xs">→</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="zc-input text-xs py-1.5"
                aria-label="End date"
              />
            </div>
            <button
              onClick={applyCustom}
              disabled={!customFrom || !customTo}
              className="zc-btn-primary w-full mt-2 text-sm py-2 disabled:opacity-50"
            >
              Apply custom range
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
