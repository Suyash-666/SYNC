import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { analyticsApi } from '../src/api';
import { CardShell } from '../components';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10,12,28,0.95)',
      border: '1px solid rgba(245,158,11,0.3)',
      borderRadius: '12px',
      padding: '10px 14px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontSize: '11px', color: 'hsl(var(--fg-muted))', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 800, color: 'hsl(var(--warning))', fontFamily: "'DM Mono', monospace" }}>
        {payload[0].value}<span style={{ fontSize: '12px', marginLeft: '3px', color: 'hsl(var(--fg-muted))' }}>hrs</span>
      </div>
    </div>
  );
};

function genData(days = 30) {
  const out = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    out.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: Math.round(1 + Math.random() * 4),
    });
  }
  return out;
}

const cardStyle = {
  background: 'linear-gradient(135deg, hsl(var(--bg-subtle)) 0%, hsl(var(--surface)) 100%)',
  border: '1px solid hsl(var(--border))',
  borderRadius: '24px',
  padding: '24px',
  backdropFilter: 'blur(16px)',
  position: 'relative',
  overflow: 'hidden',
};

export default function StudyHoursChart({ range }) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;

  const studyHoursQuery = useQuery({
    queryKey: ['analytics', 'study-hours', range],
    queryFn: () => analyticsApi.getStudyHours(range),
  });

  // Live data — the supabase impl currently returns
  // { daily: [{ date, hours }] } (and may be a placeholder). Only use it
  // if it actually has a non-empty daily series.
  const liveDaily = studyHoursQuery.data?.daily || [];
  const hasLive = Array.isArray(liveDaily) && liveDaily.length > 0;

  // The metadata series kept from the original card; only shown when no
  // real data has come in yet so the page never looks empty.
  const placeholder = useMemo(() => genData(days), [days]);

  const data = hasLive
    ? liveDaily.map((d) => ({
        date: typeof d.date === 'string' && d.date.length > 6
          ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : d.date,
        hours: d.hours || 0,
      }))
    : placeholder;
  const total = data.reduce((s, d) => s + d.hours, 0);
  const isLive = hasLive;

  return (
    <CardShell
      isLoading={studyHoursQuery.isLoading}
      error={studyHoursQuery.error}
      isEmpty={false}
      skeletonHeight={320}
    >
      <div style={cardStyle}>
        <div style={{
          position: 'absolute', bottom: '-30px', left: '30%',
          width: '160px', height: '80px',
          background: 'hsl(var(--warning))', opacity: 0.08, filter: 'blur(40px)', pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(var(--fg-muted))', marginBottom: '4px' }}>
              Study Hours Trend
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'hsl(var(--fg))', fontFamily: "'DM Mono', monospace" }}>
              {total}<span style={{ fontSize: '14px', color: 'hsl(var(--fg-muted))', marginLeft: '6px' }}>hrs total</span>
            </div>
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: '10px',
            background: isLive ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)',
            border: `1px solid ${isLive ? 'rgba(52,211,153,0.25)' : 'rgba(245,158,11,0.25)'}`,
            fontSize: '12px', color: isLive ? 'hsl(var(--success))' : 'hsl(var(--warning))', fontWeight: 600,
          }}>
            {isLive ? 'live' : `${days}d sample`}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--fg-subtle))', fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} interval={days <= 7 ? 0 : Math.floor(days / 7)} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--fg-subtle))' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="hours" stroke="#f59e0b" strokeWidth={2.5}
              fillOpacity={1} fill="url(#studyGrad)" animationDuration={1000} dot={false}
              activeDot={{ r: 5, fill: 'hsl(var(--warning))', stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}
