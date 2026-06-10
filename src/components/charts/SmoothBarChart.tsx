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
  barRadius?: number | number[];
}

export default function SmoothBarChart({
  data,
  xKey = 'name',
  dataKey,
  height = '100%',
  color = '#8b5cf6',
  barRadius = [6, 6, 0, 0],
}: Props) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.06} vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            wrapperStyle={{ outline: 'none', borderRadius: 8 }}
            contentStyle={{ background: '#0f1724', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', borderRadius: 8 }}
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
