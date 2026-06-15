'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_WIDTH = 400;
const CHART_HEIGHT = 200;
const PADDING = { top: 20, right: 20, bottom: 30, left: 55 };

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function formatChartAxisDate(dateStr: string) {
  try {
    // accept YYYY-MM-DD or ISO-like input
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch (e) {
    return dateStr;
  }
}

function xAxisLabelIndices(dateCount: number, chartWidth: number) {
  if (dateCount <= 0) return [];
  if (dateCount === 1) return [0];
  const maxLabels = chartWidth < 340 ? 4 : chartWidth < 480 ? 6 : chartWidth < 640 ? 8 : 10;
  if (dateCount <= maxLabels) return Array.from({ length: dateCount }, (_, i) => i);
  const step = Math.ceil((dateCount - 1) / (maxLabels - 1));
  const indices: number[] = [];
  for (let i = 0; i < dateCount; i += step) indices.push(i);
  if (indices[indices.length - 1] !== dateCount - 1) indices.push(dateCount - 1);
  return indices;
}

export default function PriceHistoryChart({
  dates = [],
  series = [],
  currency = 'USD',
  convertCurrency,
  height = CHART_HEIGHT,
}: {
  dates?: string[];
  series?: Array<{ otaName?: string; color?: string; data: Array<{ date: string; price: number | null }> }>;
  currency?: string;
  convertCurrency?: (n: number) => number;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(DEFAULT_WIDTH);
  const animationKey = useMemo(() => `${chartWidth}-${dates?.join('|') || ''}-${series?.map((s) => s.otaName).join(',') || ''}`, [chartWidth, dates, series]);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const entry = entries?.[0];
      const next = Math.floor(entry?.contentRect?.width || 0);
      if (next > 0) setChartWidth(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { xScale, yScale, minPrice, maxPrice } = useMemo(() => {
    if (!dates?.length || !series?.length) return { xScale: null, yScale: null, minPrice: 0, maxPrice: 1 } as any;
    const innerW = chartWidth - PADDING.left - PADDING.right;
    const innerH = height - PADDING.top - PADDING.bottom;
    const allPrices: number[] = [];
    series.forEach((s) => s.data.forEach((p) => { if (p.price != null && !Number.isNaN(p.price)) allPrices.push(p.price); }));
    let min = allPrices.length ? Math.min(...allPrices) : 0;
    let max = allPrices.length ? Math.max(...allPrices) : 1;
    if (max <= min) max = min + 1;
    min = Math.max(0, min - 50);
    max = max + 50;
    const x = (index: number) => PADDING.left + (index / Math.max(1, dates.length - 1)) * innerW;
    const y = (value: number) => PADDING.top + innerH - ((value - min) / (max - min)) * innerH;
    return { xScale: x, yScale: y, minPrice: min, maxPrice: max };
  }, [dates, series, chartWidth, height]);

  const xLabelIndices = useMemo(() => xAxisLabelIndices(dates?.length || 0, chartWidth), [dates, chartWidth]);
  const xLabelIndexSet = useMemo(() => new Set(xLabelIndices), [xLabelIndices]);

  if (!dates?.length || !series?.length || !xScale || !yScale) return null;

  const formatPrice = (v: any) => {
    const num = typeof v === 'number' && !Number.isNaN(v) ? v : 0;
    const converted = typeof convertCurrency === 'function' ? convertCurrency(num) : num;
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(converted);
    } catch (e) {
      return String(converted);
    }
  };

  const paths = series.map((serie) => {
    const points = serie.data.map((p, i) => ({ x: xScale(i), y: yScale(p.price as number) }));
    const d = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
    return { d, color: serie.color || '#8B5CF6' };
  });

  const pointGroups = series.flatMap((serie) => serie.data.map((p, i) => ({ i, price: p.price, otaName: serie.otaName, color: serie.color })));

  return (
    <div ref={containerRef} className="w-full rounded-2xl bg-white p-3 zc-pop">
      <svg width={chartWidth} height={height} className="block" key={animationKey}>
        <line x1={PADDING.left} y1={height - PADDING.bottom} x2={chartWidth - PADDING.right} y2={height - PADDING.bottom} stroke="#9ca3af" strokeWidth={1} />
        <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={height - PADDING.bottom} stroke="#9ca3af" strokeWidth={1} />

        {[0, 0.5, 1].map((t) => {
          const price = minPrice + t * (maxPrice - minPrice);
          const y = PADDING.top + (height - PADDING.top - PADDING.bottom) * (1 - t);
          const converted = typeof convertCurrency === 'function' ? convertCurrency(price) : price;
          return (
            <g key={String(t)}>
              {t !== 0 && t !== 1 && (
                <line x1={PADDING.left} y1={y} x2={chartWidth - PADDING.right} y2={y} stroke="#e5e7eb" strokeDasharray="3 3" strokeWidth={1} />
              )}
              <text x={PADDING.left - 8} y={y} textAnchor="end" fontSize={10} fill="#6b7280">{formatPrice(converted)}</text>
            </g>
          );
        })}

        {dates.map((date, i) => (
          <g key={`${date}-${i}`}>
            <line x1={xScale(i)} y1={height - PADDING.bottom} x2={xScale(i)} y2={height - PADDING.bottom + 4} stroke="#9ca3af" strokeWidth={1} />
            {xLabelIndexSet.has(i) ? (
              <text x={xScale(i)} y={height - PADDING.bottom + 14} textAnchor="middle" fontSize={10} fill="#6b7280">{formatChartAxisDate(date)}</text>
            ) : null}
          </g>
        ))}

        {paths.map((p, idx) => (
          <g key={idx}>
            <path d={p.d} fill="none" stroke={p.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}

        {series.map((serie, sIdx) => serie.data.map((point, i) => (
          <circle key={`${sIdx}-${i}`} cx={xScale(i)} cy={yScale(point.price as number)} r={4} fill={serie.color || '#8B5CF6'} stroke="white" strokeWidth={1} className="zc-point-pop" />
        )))}
      </svg>

      <div className="flex flex-wrap justify-between gap-2 mt-2 text-[10px]">
        {series.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color || '#8B5CF6' }} />
            <span className="text-gray-600">{s.otaName || `Series ${i + 1}`}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-900" />
          <span className="text-gray-600">Multiple</span>
        </div>
      </div>
    </div>
  );
}
