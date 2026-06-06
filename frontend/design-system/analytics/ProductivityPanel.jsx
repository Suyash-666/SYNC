import React, { useEffect, useState } from 'react';
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

// Metadata breakdown. The real API returns { total, breakdown:
// { attendanceScore, assignmentScore, streakScore, notesScore } }. Each
// field is 0..25 so total is 0..100.
const metaBreakdown = [
  { key: 'Attendance',   points: 22, max: 25, desc: 'Class presence',     icon: '📅', color: 'hsl(var(--brand-500))' },
  { key: 'Assignments',  points: 23, max: 25, desc: 'On-time submissions', icon: '📝', color: 'hsl(var(--success))' },
  { key: 'Consistency',  points: 20, max: 25, desc: 'Daily study habit',   icon: '🔥', color: 'hsl(var(--warning))' },
  { key: 'Streak',       points: 17, max: 25, desc: 'Consecutive study days', icon: '⚡', color: 'hsl(var(--info))' },
];

function DonutScore({ score, max = 100 }) {
  const r = 52, circ = 2 * Math.PI * r;
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setProgress(score), 100);
    return () => clearTimeout(t);
  }, [score]);
  const offset = circ - (progress / max) * circ;
  const color = score >= 80 ? 'hsl(var(--success))' : score >= 60 ? 'hsl(var(--warning))' : 'hsl(var(--danger))';

  return (
    <div style={{ position: 'relative', width: 130, height: 130 }}>
      <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--border-subtle))" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)',
            filter: `drop-shadow(0 0 8px ${color}88)`,
          }} />
        <text x="60" y="56" textAnchor="middle" fill="white" fontSize="22" fontWeight="800" fontFamily="DM Mono">{score}</text>
        <text x="60" y="72" textAnchor="middle" fill="hsl(var(--fg-muted))" fontSize="10" fontFamily="DM Mono">/ {max}</text>
      </svg>
    </div>
  );
}

// Map the four standard fields into the bar shape the panel uses.
function buildBreakdown(breakdown) {
  if (!breakdown) return metaBreakdown;
  return [
    { key: 'Attendance',   points: breakdown.attendanceScore || 0, max: 25, desc: 'Class presence',        icon: '📅', color: 'hsl(var(--brand-500))' },
    { key: 'Assignments',  points: breakdown.assignmentScore || 0, max: 25, desc: 'On-time submissions',   icon: '📝', color: 'hsl(var(--success))' },
    { key: 'Consistency',  points: breakdown.streakScore     || 0, max: 25, desc: 'Daily study habit',     icon: '🔥', color: 'hsl(var(--warning))' },
    { key: 'Notes',        points: breakdown.notesScore      || 0, max: 25, desc: 'Notes & reviews',       icon: '📓', color: 'hsl(var(--info))' },
  ];
}

export default function ProductivityPanel() {
  const productivityQuery = useQuery({
    queryKey: ['analytics', 'productivity'],
    queryFn: analyticsApi.getProductivity,
  });

  const data = productivityQuery.data;
  const hasLive = data && typeof data.total === 'number' && data.total > 0;
  const total = hasLive ? data.total : metaBreakdown.reduce((s, b) => s + b.points, 0);
  const breakdown = hasLive ? buildBreakdown(data.breakdown) : metaBreakdown;
  const isLive = hasLive;

  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 150); return () => clearTimeout(t); }, []);

  return (
    <CardShell
      isLoading={productivityQuery.isLoading}
      error={productivityQuery.error}
      isEmpty={false}
      skeletonHeight={360}
    >
      <div style={cardStyle}>
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '120px', height: '120px',
          background: 'hsl(var(--brand-500))', opacity: 0.08, filter: 'blur(40px)', pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '28px' }}>
          <DonutScore score={total} max={100} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(var(--fg-muted))', marginBottom: '4px' }}>
              Productivity Score
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'hsl(var(--fg))', fontFamily: 'DM Mono', lineHeight: 1 }}>
              {total}<span style={{ fontSize: '16px', color: 'hsl(var(--fg-muted))', marginLeft: '4px' }}>/100</span>
            </div>
            <div style={{
              marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '20px',
              background: total >= 80 ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)',
              border: `1px solid ${total >= 80 ? 'rgba(52,211,153,0.25)' : 'rgba(245,158,11,0.25)'}`,
              fontSize: '12px', fontWeight: 700,
              color: total >= 80 ? 'hsl(var(--success))' : 'hsl(var(--warning))',
            }}>
              {total >= 80 ? '🏆 Excellent' : total >= 60 ? '📈 On Track' : '⚠️ Needs Work'}
            </div>
            {isLive ? null : (
              <div style={{ marginTop: '6px', fontSize: '10px', color: 'hsl(var(--fg-subtle))', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                sample
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {breakdown.map((b, idx) => (
            <div key={b.key} style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateX(0)' : 'translateX(-12px)',
              transition: `opacity 0.4s ease ${idx * 0.08}s, transform 0.4s ease ${idx * 0.08}s`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>{b.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--fg-muted))' }}>{b.key}</div>
                    <div style={{ fontSize: '10px', color: 'hsl(var(--fg-muted))' }}>{b.desc}</div>
                  </div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: b.color, fontFamily: 'DM Mono' }}>
                  {b.points}<span style={{ fontSize: '11px', color: 'hsl(var(--fg-muted))' }}>/{b.max}</span>
                </div>
              </div>
              <div style={{ height: '6px', borderRadius: '4px', background: 'hsl(var(--bg-subtle))', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: mounted ? `${(b.points / b.max) * 100}%` : '0%',
                  borderRadius: '4px',
                  background: b.color,
                  boxShadow: `0 0 8px ${b.color}66`,
                  transition: `width 0.9s cubic-bezier(.4,0,.2,1) ${idx * 0.1}s`,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}
