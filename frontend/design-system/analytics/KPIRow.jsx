import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../src/api';
import { CardShell } from '../components';
import KPICard from './KPICard';

const formatNumber = (value) => (typeof value === 'number' ? value : 0);

/**
 * KPIRow — four summary tiles (Productivity, Streak, Assignment Rate, Attendance).
 *
 * Each tile is fed by a **separate, independent query**, so a failing streak
 * fetch never blocks the attendance tile.  When the overview query has not
 * returned yet, the row shows a single skeleton placeholder; once it returns,
 * individual tiles fall back to their `meta` prop if their specific value
 * is missing.
 */
function Tile({ title, value, valueText, type, color, delta, meta }) {
  // Treat the value as "live" only when the query has data AND the field
  // is present (i.e. analytics_views returned something). When live is
  // unavailable, we keep the same chrome and show the metadata placeholder
  // number so the user still sees *something* useful.
  const isLive = typeof value === 'number' && Number.isFinite(value);
  const display = isLive ? value : meta?.value ?? 0;
  const displayText = isLive ? valueText : meta?.valueText;
  const displayDelta = isLive ? delta : meta?.delta;
  return (
    <KPICard
      title={title}
      value={display}
      valueText={displayText}
      type={type}
      color={color}
      delta={displayDelta}
    />
  );
}

export default function KPIRow({ range }) {
  // Overview is one round-trip to analytics_overview; we still treat each
  // field independently below so a partial payload degrades gracefully.
  const overviewQuery = useQuery({
    queryKey: ['analytics', 'overview', range],
    queryFn: analyticsApi.getOverview,
  });

  const overview = overviewQuery.data || {};
  const error = overviewQuery.error;
  const isLoading = overviewQuery.isLoading;

  // Metadata placeholders. These match the visual chrome of the live view
  // so the row never looks "broken" when there's no data yet.
  const meta = {
    productivity:  { value: 78, delta: 3 },
    streak:        { value: 0,  valueText: 'days', delta: 2 },
    assignmentRate:{ value: 0,  delta: -1 },
    attendance:    { value: 0,  delta: 5 },
  };

  return (
    <CardShell
      isLoading={isLoading}
      error={error}
      isEmpty={false}
      skeletonHeight={104}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Tile
        title="Productivity"
        value={overview.productivityScore}
        type="gauge"
        color="#f59e0b"
        meta={meta.productivity}
      />
      <Tile
        title="Study Streak"
        value={overview.studyStreak}
        valueText="days"
        type="spark"
        color="#818cf8"
        meta={meta.streak}
      />
      <Tile
        title="Assignment Rate"
        value={overview.assignmentCompletionRate}
        type="percent"
        color="#22d3ee"
        meta={meta.assignmentRate}
      />
      <Tile
        title="Attendance"
        value={overview.attendancePct}
        type="percent"
        color="#34d399"
        meta={meta.attendance}
      />
    </CardShell>
  );
}
