import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { analyticsApi } from '../src/api';
import { CardShell } from '../components';

const cardStyle = {
  background: 'linear-gradient(135deg, hsl(var(--bg-subtle)) 0%, hsl(var(--surface)) 100%)',
  border: '1px solid hsl(var(--border))',
  borderRadius: '24px',
  padding: '24px',
  backdropFilter: 'blur(16px)',
  position: 'relative',
  overflow: 'hidden',
};

// Metadata fallback: same chart the original page shipped with. Kept so
// the section has *something* to look at until real data arrives.
const metaData = [
  { week: 'Week 1', assigned: 5, submitted: 4, overdue: 1 },
  { week: 'Week 2', assigned: 6, submitted: 5, overdue: 1 },
  { week: 'Week 3', assigned: 4, submitted: 4, overdue: 0 },
  { week: 'Week 4', assigned: 7, submitted: 6, overdue: 1 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10,12,28,0.97)',
      border: '1px solid hsl(var(--border))',
      borderRadius: '14px',
      padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontSize: '11px', color: 'hsl(var(--fg-muted))', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.08em' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '2px', background: p.fill }} />
          <span style={{ fontSize: '12px', color: 'hsl(var(--fg-muted))', textTransform: 'capitalize' }}>{p.name}</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--fg))', fontFamily: 'DM Mono', marginLeft: 'auto' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AssignmentCompletion({ range }) {
  const assignmentsQuery = useQuery({
    queryKey: ['analytics', 'assignments', range],
    queryFn: () => analyticsApi.getAssignments(range),
  });

  const liveRows = assignmentsQuery.data || [];
  const hasLive = liveRows.length > 0;
  const data = hasLive ? liveRows : metaData;
  const isLive = hasLive;

  const totalAssigned = data.reduce((s, d) => s + d.assigned, 0);
  const totalSubmitted = data.reduce((s, d) => s + d.submitted, 0);
  const rate = totalAssigned > 0 ? Math.round((totalSubmitted / totalAssigned) * 100) : 0;

  return (
    <CardShell
      isLoading={assignmentsQuery.isLoading}
      error={assignmentsQuery.error}
      isEmpty={!isLive}
      emptyIcon="📝"
      emptyTitle="No assignments yet"
      emptyDescription="Create or complete an assignment to see your weekly trend."
      skeletonHeight={320}
    >
      <div style={cardStyle}>
        <div style={{
          position: 'absolute', bottom: '-20px', right: '10%',
          width: '100px', height: '60px',
          background: '#10b981', opacity: 0.08, filter: 'blur(30px)', pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(var(--fg-muted))', marginBottom: '4px' }}>
              Assignment Completion
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'hsl(var(--fg))', fontFamily: "'DM Mono', monospace" }}>
              {rate}%<span style={{ fontSize: '13px', color: 'hsl(var(--fg-muted))', marginLeft: '6px' }}>rate</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '4px 10px', borderRadius: '8px',
              background: isLive ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${isLive ? 'rgba(52,211,153,0.25)' : 'hsl(var(--border))'}`,
              fontSize: '11px', color: isLive ? 'hsl(var(--success))' : 'hsl(var(--fg-muted))', fontWeight: 600,
            }}>
              {isLive ? 'live' : 'sample'}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { label: 'Assigned', color: 'rgba(99,102,241,0.8)' },
                { label: 'Submitted', color: '#10b981' },
                { label: 'Overdue', color: 'hsl(var(--danger))' },
              ].map(({ label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'hsl(var(--fg-muted))' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '2px', background: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barCategoryGap="30%" barGap={4} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(var(--fg-muted))', fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--fg-subtle))' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--bg-muted))' }} />
            <Bar dataKey="assigned" fill="rgba(99,102,241,0.6)" radius={[4, 4, 0, 0]} animationDuration={800} />
            <Bar dataKey="submitted" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={900} />
            <Bar dataKey="overdue" fill="#f87171" radius={[4, 4, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}
