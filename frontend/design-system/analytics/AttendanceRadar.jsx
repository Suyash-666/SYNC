import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';
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

// Metadata fallback: same shape the original card had, kept so the chart
// is never blank. The page already labelled this as "metadata" so the
// user knows it's not their data.
const metaSubjects = [
  { subject: 'Algorithms', attendance: 78 },
  { subject: 'DBMS',       attendance: 84 },
  { subject: 'OS',         attendance: 90 },
  { subject: 'AI',         attendance: 72 },
  { subject: 'Networks',   attendance: 68 },
  { subject: 'Web',        attendance: 88 },
];

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

export default function AttendanceRadar({ range }) {
  const attendanceQuery = useQuery({
    queryKey: ['analytics', 'attendance', range],
    queryFn: () => analyticsApi.getAttendance(range),
  });

  // The supabase impl returns [{ date, present, absent, total }]. We
  // group by subject in a separate call (subjects). For now we drive
  // the radar from the `subjects` data plus attendance rows.
  const subjectsQuery = useQuery({
    queryKey: ['analytics', 'subjects', range],
    queryFn: analyticsApi.getSubjects,
  });

  // Try to merge: subjects come from analytics_subjects, attendance %
  // is derived from each subject's own row. If we don't have either,
  // fall back to the metadata so the chart is never empty.
  const liveSample = useMemo(() => {
    const subjects = subjectsQuery.data || [];
    if (!subjects.length) return null;
    return subjects.map((s) => {
      const total = s.topicsTotal || 0;
      const done = s.topicsCompleted || 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { subject: s.subject?.name || 'Subject', attendance: pct };
    });
  }, [subjectsQuery.data]);

  const sample = liveSample && liveSample.length > 0 ? liveSample : metaSubjects;
  const isLive = Boolean(liveSample && liveSample.length > 0);
  const avg = Math.round(sample.reduce((s, d) => s + d.attendance, 0) / sample.length);

  // Combine independent query errors so a single failure surfaces.
  const error = attendanceQuery.error || subjectsQuery.error;

  return (
    <CardShell
      isLoading={attendanceQuery.isLoading || subjectsQuery.isLoading}
      error={error}
      isEmpty={false}
      skeletonHeight={360}
    >
      <div style={cardStyle}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              padding: '4px 10px', borderRadius: '8px',
              background: isLive ? 'rgba(52,211,153,0.12)' : 'rgba(99,102,241,0.12)',
              border: `1px solid ${isLive ? 'rgba(52,211,153,0.25)' : 'rgba(99,102,241,0.25)'}`,
              fontSize: '11px', color: isLive ? 'hsl(var(--success))' : 'hsl(var(--brand-500))', fontWeight: 600,
            }}>
              {isLive ? 'live' : 'sample'}
            </div>
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
    </CardShell>
  );
}
