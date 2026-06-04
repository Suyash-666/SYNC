import React from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

const subjects = ['Algorithms', 'DBMS', 'OS', 'AI', 'Networks', 'Web'];
const sample = subjects.map((s, i) => ({ subject: s, attendance: 60 + i * 6 }));

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'rgba(10,12,28,0.95)',
      border: '1px solid rgba(99,102,241,0.35)',
      borderRadius: '12px', padding: '10px 14px',
    }}>
      <div style={{ fontSize: '12px', color: 'hsl(var(--fg-muted))', marginBottom: '3px' }}>{d.subject}</div>
      <div style={{ fontSize: '20px', fontWeight: 800, color: 'hsl(var(--brand-500))', fontFamily: "'DM Mono', monospace" }}>
        {d.attendance}<span style={{ fontSize: '12px', color: 'hsl(var(--fg-muted))', marginLeft: '2px' }}>%</span>
      </div>
    </div>
  );
};

const dotColor = (v) => v < 70 ? 'hsl(var(--danger))' : v < 85 ? '#fbbf24' : 'hsl(var(--success))';

export default function AttendanceRadar() {
  const avg = Math.round(sample.reduce((s, d) => s + d.attendance, 0) / sample.length);

  return (
    <div style={{
      background: 'linear-gradient(135deg, hsl(var(--bg-subtle)) 0%, hsl(var(--surface)) 100%)',
      border: '1px solid hsl(var(--border))',
      borderRadius: '24px',
      padding: '24px',
      backdropFilter: 'blur(16px)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)',
        width: '120px', height: '80px',
        background: 'hsl(var(--brand-500))', opacity: 0.1, filter: 'blur(36px)', pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(var(--fg-muted))', marginBottom: '4px' }}>
            Attendance by Subject
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'hsl(var(--fg))', fontFamily: "'DM Mono', monospace" }}>
            {avg}%<span style={{ fontSize: '13px', color: 'hsl(var(--fg-muted))', marginLeft: '6px' }}>avg</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
          {[{ l: '≥85%', c: 'hsl(var(--success))' }, { l: '70–84%', c: '#fbbf24' }, { l: '<70%', c: 'hsl(var(--danger))' }].map(({ l, c }) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'hsl(var(--fg-muted))' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
              {l}
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <RadarChart cx="50%" cy="50%" outerRadius={85} data={sample}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="subject"
            tick={{ fontSize: 11, fill: 'hsl(var(--fg-muted))', fontFamily: 'DM Mono' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Radar name="Attendance" dataKey="attendance"
            stroke="#818cf8" fill="#6366f1" fillOpacity={0.25} strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              return <circle key={payload.subject} cx={cx} cy={cy} r={4}
                fill={dotColor(payload.attendance)} stroke="#0a0c1c" strokeWidth={2} />;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* bottom subject dots */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
        {sample.map((d) => (
          <div key={d.subject} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '8px',
            background: 'hsl(var(--bg-subtle))', border: '1px solid hsl(var(--border-subtle))',
            fontSize: '11px', color: 'hsl(var(--fg-muted))',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor(d.attendance) }} />
            {d.subject} <span style={{ color: dotColor(d.attendance), fontFamily: 'DM Mono', fontWeight: 700 }}>{d.attendance}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}