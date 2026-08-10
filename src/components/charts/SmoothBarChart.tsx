'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface Props {
  data: any[];
  xKey?: string;
  dataKey: string;
  height?: number | string;
  color?: string;
  barRadius?: [number, number, number, number];
}

export default function SmoothBarChart({
  data,
  xKey = 'name',
  dataKey,
  height = '100%',
  color = '#2563EB',
  barRadius = [6, 6, 0, 0],
}: Props) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            wrapperStyle={{ outline: 'none', borderRadius: 12 }}
            contentStyle={{ background: '#ffffff', border: '1px solid #E2E8F0', color: '#0F172A', borderRadius: 12, boxShadow: '0 8px 24px -8px rgba(15, 23, 42, 0.16)' }}
          />
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={barRadius}
            animationDuration={600}
            isAnimationActive={true}
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
