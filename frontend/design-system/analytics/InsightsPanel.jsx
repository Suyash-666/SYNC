import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../src/api';
import { CardShell } from '../components';

const cardStyle = {
  background: 'linear-gradient(135deg, hsl(var(--bg-subtle)) 0%, hsl(var(--surface)) 100%)',
  border: '1px solid hsl(var(--border))',
  borderRadius: '24px',
  padding: '24px',
  backdropFilter: 'blur(16px)',
};

// Metadata insights. These match the original copy and act as the
// "no real insights yet" content. As soon as the API returns real items
// the panel switches over and shows them.
const META_INSIGHTS = [
  {
    id: 'meta-1',
    icon: '⚠️',
    title: 'Attendance Drop Detected',
    text: 'Your OS attendance dropped 8% this week. You risk falling below the 75% threshold.',
    tone: 'warn',
    action: 'View Schedule',
    metric: '-8%',
  },
  {
    id: 'meta-2',
    icon: '✅',
    title: 'Assignment Streak',
    text: 'Assignment completion improved 12% compared to last month. Keep it up!',
    tone: 'good',
    action: 'View Assignments',
    metric: '+12%',
  },
  {
    id: 'meta-3',
    icon: '💡',
    title: 'Peak Study Window',
    text: 'You study most effectively between 9PM–11PM. Consider scheduling hard topics then.',
    tone: 'info',
    action: 'Plan Session',
    metric: '9–11PM',
  },
];

const toneStyles = {
  warn: {
    border: 'rgba(248,113,113,0.3)',
    bg: 'rgba(248,113,113,0.06)',
    accent: 'hsl(var(--danger))',
    glow: 'rgba(248,113,113,0.15)',
    metricColor: '#fca5a5',
    badge: 'rgba(248,113,113,0.15)',
  },
  good: {
    border: 'rgba(52,211,153,0.3)',
    bg: 'rgba(52,211,153,0.06)',
    accent: 'hsl(var(--success))',
    glow: 'rgba(52,211,153,0.15)',
    metricColor: '#6ee7b7',
    badge: 'rgba(52,211,153,0.15)',
  },
  info: {
    border: 'rgba(129,140,248,0.3)',
    bg: 'rgba(129,140,248,0.06)',
    accent: 'hsl(var(--brand-500))',
    glow: 'rgba(129,140,248,0.15)',
    metricColor: 'hsl(var(--brand-500))',
    badge: 'rgba(129,140,248,0.15)',
  },
};

// Build real insights from the overview object. Each insight is independent
// — we don't synthesise a "everything is great" message if only one
// metric is interesting; we surface the ones that exist and stay quiet
// on the rest. The user gets a partial panel, not a fake one.
function buildLiveInsights(overview) {
  if (!overview) return [];
  const out = [];
  if (typeof overview.attendancePct === 'number' && overview.attendancePct < 75) {
    out.push({
      id: 'live-attendance',
      icon: '⚠️',
      title: 'Attendance Below Threshold',
      text: `Your attendance is at ${overview.attendancePct}%. The 75% safe-zone is at risk.`,
      tone: 'warn',
      action: 'View Schedule',
      metric: `${overview.attendancePct}%`,
    });
  }
  if (typeof overview.assignmentCompletionRate === 'number' && overview.assignmentCompletionRate >= 80) {
    out.push({
      id: 'live-assignments',
      icon: '✅',
      title: 'Strong Assignment Completion',
      text: `You are at ${overview.assignmentCompletionRate}% on assignments. Keep the streak alive.`,
      tone: 'good',
      action: 'View Assignments',
      metric: `${overview.assignmentCompletionRate}%`,
    });
  }
  if (typeof overview.studyStreak === 'number' && overview.studyStreak >= 3) {
    out.push({
      id: 'live-streak',
      icon: '🔥',
      title: 'Study Streak Going',
      text: `You have studied ${overview.studyStreak} days in a row. Don't break the chain.`,
      tone: 'info',
      action: 'Plan Session',
      metric: `${overview.studyStreak}d`,
    });
  }
  return out;
}

export default function InsightsPanel() {
  const overviewQuery = useQuery({
    queryKey: ['analytics', 'overview', 'insights'],
    queryFn: analyticsApi.getOverview,
  });

  // Live list — only shown if the API gives us at least one real insight.
  // Otherwise the user sees the metadata copy that the original page
  // shipped with (so the panel is never empty / blank).
  const liveList = buildLiveInsights(overviewQuery.data);
  const useLive = liveList.length > 0;
  const items = useLive ? liveList : META_INSIGHTS;

  const [dismissed, setDismissed] = useState([]);
  const visible = items.filter((i) => !dismissed.includes(i.id));

  return (
    <CardShell
      isLoading={overviewQuery.isLoading}
      error={overviewQuery.error}
      isEmpty={false}
      skeletonHeight={320}
    >
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(var(--fg-muted))', marginBottom: '4px' }}>
              AI Insights
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'hsl(var(--fg))' }}>
              {visible.length} active {visible.length === 1 ? 'alert' : 'alerts'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '4px 10px', borderRadius: '8px',
              background: useLive ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${useLive ? 'rgba(52,211,153,0.25)' : 'hsl(var(--border))'}`,
              fontSize: '11px', color: useLive ? 'hsl(var(--success))' : 'hsl(var(--fg-muted))', fontWeight: 600,
            }}>
              {useLive ? 'live' : 'sample'}
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'rgba(129,140,248,0.12)',
              border: '1px solid rgba(129,140,248,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', cursor: 'default',
            }}>🔔</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'hsl(var(--fg-muted))', fontSize: '14px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✨</div>
              All clear — no alerts right now!
            </div>
          ) : visible.map((item) => {
            const s = toneStyles[item.tone] || toneStyles.info;
            return (
              <div key={item.id} style={{
                background: s.bg,
                border: `1px solid hsl(var(--border))`,
                borderRadius: '16px',
                padding: '16px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'opacity 0.3s ease',
              }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                  background: s.accent, borderRadius: '16px 0 0 16px',
                  boxShadow: `0 0 12px ${s.glow}`,
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingLeft: '8px' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '10px',
                    background: s.badge,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--fg))' }}>{item.title}</div>
                      <div style={{
                        fontSize: '13px', fontWeight: 800, color: s.metricColor,
                        fontFamily: 'DM Mono', padding: '2px 8px',
                        borderRadius: '6px', background: s.badge,
                      }}>
                        {item.metric}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'hsl(var(--fg-muted))', lineHeight: 1.5, marginBottom: '10px' }}>
                      {item.text}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{
                        padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                        background: s.badge, border: `1px solid hsl(var(--border))`,
                        color: s.metricColor, cursor: 'pointer',
                      }}>
                        {item.action}
                      </button>
                      <button onClick={() => setDismissed((d) => [...d, item.id])} style={{
                        padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                        background: 'transparent', border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--fg-muted))', cursor: 'pointer',
                      }}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CardShell>
  );
}
