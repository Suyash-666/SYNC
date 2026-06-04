import React, { useState } from 'react';

const INSIGHTS = [
  {
    id: 1,
    icon: '⚠️',
    title: 'Attendance Drop Detected',
    text: 'Your OS attendance dropped 8% this week. You risk falling below the 75% threshold.',
    tone: 'warn',
    action: 'View Schedule',
    metric: '-8%',
  },
  {
    id: 2,
    icon: '✅',
    title: 'Assignment Streak',
    text: 'Assignment completion improved 12% compared to last month. Keep it up!',
    tone: 'good',
    action: 'View Assignments',
    metric: '+12%',
  },
  {
    id: 3,
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

export default function InsightsPanel() {
  const [dismissed, setDismissed] = useState([]);
  const visible = INSIGHTS.filter((i) => !dismissed.includes(i.id));

  return (
    <div style={{
      background: 'linear-gradient(135deg, hsl(var(--bg-subtle)) 0%, hsl(var(--surface)) 100%)',
      border: '1px solid hsl(var(--border))',
      borderRadius: '24px',
      padding: '24px',
      backdropFilter: 'blur(16px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(var(--fg-muted))', marginBottom: '4px' }}>
            AI Insights
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'hsl(var(--fg))' }}>
            {visible.length} active alerts
          </div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'rgba(129,140,248,0.12)',
          border: '1px solid rgba(129,140,248,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', cursor: 'default',
        }}>🔔</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'hsl(var(--fg-muted))', fontSize: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✨</div>
            All clear — no alerts right now!
          </div>
        )}
        {visible.map((item) => {
          const s = toneStyles[item.tone];
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
              {/* left accent bar */}
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
  );
}