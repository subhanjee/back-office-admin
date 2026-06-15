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
  stroke = '#8b5cf6',
  areaFill = 'rgba(139,92,246,0.12)',
}: Props) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.06} vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            wrapperStyle={{ outline: 'none', borderRadius: 8 }}
            contentStyle={{ background: '#0f1724', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', borderRadius: 8 }}
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
