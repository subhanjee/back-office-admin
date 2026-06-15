'use client';

import React, { useMemo } from 'react';

interface DataPoint {
  [key: string]: string | number | Date;
}

interface AnalyticsChartProps {
  data: DataPoint[];
  xKey: string;
  yKey: string;
  title?: string;
  legends?: Array<{ label: string; color: string }>;
  height?: number;
  color?: string;
  gridLines?: number;
}

export default function AnalyticsChart({
  data,
  xKey,
  yKey,
  title,
  legends = [{ label: 'Average', color: 'rgb(59, 130, 246)' }],
  height = 220,
  color = '#3b82f6',
  gridLines = 3,
}: AnalyticsChartProps) {
  const chartWidth = 517;
  const margins = { top: 20, right: 20, bottom: 40, left: 55 };
  const innerWidth = chartWidth - margins.left - margins.right;
  const innerHeight = height - margins.top - margins.bottom;

  const { minY, maxY, scaledPoints, xLabels, yLabels } = useMemo(() => {
    if (!data || data.length === 0) {
      return { minY: 0, maxY: 100, scaledPoints: [], xLabels: [], yLabels: [] };
    }

    // Extract values and find min/max
    const values = data.map((d) => {
      const v = d[yKey];
      return typeof v === 'number' ? v : parseFloat(String(v)) || 0;
    });

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const actualMax = maxVal || 1;
    const padding = actualMax === minVal ? actualMax * 0.1 || 1 : (maxVal - minVal) * 0.1;
    const min = actualMax === minVal ? 0 : Math.max(0, minVal - padding);
    const max = maxVal + padding;
    const range = max - min || 1;

    // Generate Y-axis labels (grid lines)
    const yLabelsArray: Array<{ value: number; label: string; y: number }> = [];
    for (let i = 0; i <= gridLines; i++) {
      const val = min + (range * i) / gridLines;
      yLabelsArray.push({
        value: val,
        label: Number.isInteger(val) ? String(Math.round(val)) : val.toFixed(2),
        y: margins.top + innerHeight - ((val - min) / range) * innerHeight,
      });
    }

    // Scale data points
    const scaled = data.map((d, idx) => {
      const v = typeof d[yKey] === 'number' ? d[yKey] : parseFloat(String(d[yKey])) || 0;
      const xPos = margins.left + (idx / Math.max(1, data.length - 1)) * innerWidth;
      const yPos = margins.top + innerHeight - ((v - min) / range) * innerHeight;
      return { x: xPos, y: yPos, value: v };
    });

    // X-axis labels (show first, middle, last)
    const xLabelsArray: Array<{ label: string; x: number }> = [];
    if (data.length > 0) {
      const step = Math.max(1, Math.floor(data.length / 3));
      [0, step, data.length - 1].forEach((idx) => {
        if (idx < data.length) {
          const xPos = margins.left + (idx / Math.max(1, data.length - 1)) * innerWidth;
          const labelVal = data[idx][xKey];
          const label = labelVal instanceof Date
            ? labelVal.toLocaleString('en-US', { month: 'short' })
            : String(labelVal).substring(0, 10);
          xLabelsArray.push({ label, x: xPos });
        }
      });
    }

    return {
      minY: min,
      maxY: max,
      scaledPoints: scaled,
      xLabels: xLabelsArray,
      yLabels: yLabelsArray,
    };
  }, [data, xKey, yKey, gridLines]);

  // Generate smooth line path
  const linePath = useMemo(() => {
    if (scaledPoints.length === 0) return '';
    if (scaledPoints.length === 1) {
      const p = scaledPoints[0];
      return `M ${p.x} ${p.y}`;
    }

    // Catmull-Rom spline for smooth curves
    const points = scaledPoints;
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i + 2 < points.length ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  }, [scaledPoints]);

  return (
    <div className="w-full rounded-2xl bg-white p-3 zc-pop">
      {!data || data.length === 0 ? (
        <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
          <div className="text-center">
            <p className="text-sm text-gray-500 font-medium">No data available</p>
            <p className="text-xs text-gray-400">Check back soon for data</p>
          </div>
        </div>
      ) : (
        <>
          <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} className="block">
        {/* Bottom axis line */}
        <line
          x1={margins.left}
          y1={margins.top + innerHeight}
          x2={chartWidth - margins.right}
          y2={margins.top + innerHeight}
          stroke="#9ca3af"
          strokeWidth="1"
        />

        {/* Left axis line */}
        <line
          x1={margins.left}
          y1={margins.top}
          x2={margins.left}
          y2={margins.top + innerHeight}
          stroke="#9ca3af"
          strokeWidth="1"
        />

        {/* Y-axis grid lines and labels */}
        {yLabels.map((label, i) => (
          <g key={`y-${i}`}>
            {i > 0 && i < yLabels.length - 1 && (
              <line
                x1={margins.left}
                y1={label.y}
                x2={chartWidth - margins.right}
                y2={label.y}
                stroke="#e5e7eb"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            )}
            <text
              x={margins.left - 8}
              y={label.y}
              textAnchor="end"
              fontSize="10"
              fill="#6b7280"
              dy="0.3em"
            >
              {label.label}
            </text>
          </g>
        ))}

        {/* X-axis ticks and labels */}
        {xLabels.map((label, i) => (
          <g key={`x-${i}`}>
            <line
              x1={label.x}
              y1={margins.top + innerHeight}
              x2={label.x}
              y2={margins.top + innerHeight + 4}
              stroke="#9ca3af"
              strokeWidth="1"
            />
            <text
              x={label.x}
              y={margins.top + innerHeight + 14}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {label.label}
            </text>
          </g>
        ))}

        {/* Chart line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {scaledPoints.map((point, i) => (
          <circle
            key={`point-${i}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={color}
            stroke="white"
            strokeWidth="1"
            className="zc-point-pop"
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-between gap-2 mt-2 text-[10px]">
        {legends.map((leg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: leg.color }}
            />
            <span className="text-gray-600">{leg.label}</span>
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
}
