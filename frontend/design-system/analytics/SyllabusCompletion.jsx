import React from 'react';
import { useQuery } from '@tanstack/react-query';
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

// Metadata fallback. Kept intact so the section always has *something*
// to look at even before the user has any subject syllabus data.
const metaData = [
  { subject: 'Algorithms', pct: 80, icon: '⚡' },
  { subject: 'DBMS',       pct: 60, icon: '🗄️' },
  { subject: 'OS',         pct: 45, icon: '💻' },
  { subject: 'AI',         pct: 70, icon: '🤖' },
  { subject: 'Networks',   pct: 55, icon: '🌐' },
  { subject: 'Web',        pct: 90, icon: '🌍' },
];

function colorFor(v) {
  if (v < 50) return { bar: 'hsl(var(--warning))', glow: 'rgba(245,158,11,0.3)', text: '#fcd34d', label: 'At Risk' };
  if (v < 75) return { bar: 'hsl(var(--info))', glow: 'rgba(34,211,238,0.3)', text: '#67e8f9', label: 'On Track' };
  return { bar: 'hsl(var(--success))', glow: 'rgba(52,211,153,0.3)', text: '#6ee7b7', label: 'Ahead' };
}

export default function SyllabusCompletion({ range }) {
  const subjectsQuery = useQuery({
    queryKey: ['analytics', 'subjects', range],
    queryFn: analyticsApi.getSubjects,
  });

  const subjects = subjectsQuery.data || [];
  const hasLive = subjects.length > 0;

  // Map supabase rows { subject:{id,name}, topicsCompleted, topicsTotal }
  // to the bar shape { subject, pct, icon }. If a subject has no topics
  // we skip it so empty buckets don't drag the average to 0.
  const live = subjects
    .filter((s) => (s.topicsTotal || 0) > 0)
    .map((s) => ({
      subject: s.subject?.name || 'Subject',
      pct: Math.round(((s.topicsCompleted || 0) / s.topicsTotal) * 100),
      icon: '📘',
    }));

  const data = hasLive ? live : metaData;
  const isLive = hasLive;
  const avg = Math.round(data.reduce((s, d) => s + d.pct, 0) / data.length);

  return (
    <CardShell
      isLoading={subjectsQuery.isLoading}
      error={subjectsQuery.error}
      isEmpty={false}
      skeletonHeight={360}
    >
      <div style={cardStyle}>
        <div style={{
          position: 'absolute', top: '-10px', right: '-10px',
          width: '80px', height: '80px',
          background: 'hsl(var(--info))', opacity: 0.07, filter: 'blur(30px)', pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(var(--fg-muted))', marginBottom: '4px' }}>
              Syllabus Completion
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'hsl(var(--fg))', fontFamily: "'DM Mono', monospace" }}>
              {avg}%<span style={{ fontSize: '13px', color: 'hsl(var(--fg-muted))', marginLeft: '6px' }}>avg</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '4px 10px', borderRadius: '8px',
              background: isLive ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${isLive ? 'rgba(52,211,153,0.25)' : 'hsl(var(--border))'}`,
              fontSize: '11px', color: isLive ? 'hsl(var(--success))' : 'hsl(var(--fg-muted))', fontWeight: 600,
            }}>
              {isLive ? 'live' : 'sample'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[{ l: 'Ahead', c: 'hsl(var(--success))' }, { l: 'On Track', c: 'hsl(var(--info))' }, { l: 'At Risk', c: 'hsl(var(--warning))' }].map(({ l, c }) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'hsl(var(--fg-muted))' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '2px', background: c }} />
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data.map((item) => {
            const c = colorFor(item.pct);
            return (
              <div key={item.subject}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>{item.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--fg-muted))' }}>{item.subject}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: c.glow, color: c.text, fontWeight: 600 }}>
                      {c.label}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: c.text, fontFamily: 'DM Mono' }}>{item.pct}%</span>
                  </div>
                </div>
                <div style={{
                  height: '8px', borderRadius: '6px',
                  background: 'hsl(var(--bg-subtle))',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${item.pct}%`,
                    borderRadius: '6px',
                    background: c.bar,
                    boxShadow: `0 0 10px ${c.glow}`,
                    transition: 'width 1s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CardShell>
  );
}
