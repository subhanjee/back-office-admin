'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
} from 'recharts';

interface Props {
  data: any[];
  xKey?: string;
  dataKey: string;
  height?: number | string;
  stroke?: string;
  areaFill?: string;
}

export default function SmoothLineChart({
  data,
  xKey = 'date',
  dataKey,
  height = '100%',
  stroke = '#2563EB',
  areaFill = 'rgba(37,99,235,0.12)',
}: Props) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            wrapperStyle={{ outline: 'none', borderRadius: 12 }}
            contentStyle={{ background: '#ffffff', border: '1px solid #E2E8F0', color: '#0F172A', borderRadius: 12, boxShadow: '0 8px 24px -8px rgba(15, 23, 42, 0.16)' }}
          />
          <Area type="monotone" dataKey={dataKey} stroke={stroke} fill={areaFill} strokeWidth={0} isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={stroke}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            isAnimationActive={true}
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
