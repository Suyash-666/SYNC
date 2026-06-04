import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Badge, Button, CardEyebrow, CardTitle, EmptyState, PageHeader, Skeleton, Toast } from '../components';
import { useAnalytics } from '../src/hooks/useAnalytics';
import KPICard from './KPICard';
import StudyHoursChart from './StudyHoursChart';
import AttendanceRadar from './AttendanceRadar';
import AssignmentCompletion from './AssignmentCompletion';
import SyllabusCompletion from './SyllabusCompletion';
import ProductivityPanel from './ProductivityPanel';
import InsightsPanel from './InsightsPanel';

const formatNumber = (value) => (typeof value === 'number' ? value : 0);

/**
 * AnalyticsPage — chart-heavy overview.
 *
 * Design decisions:
 *   • Removed the dark `pageStyle` wrapper and the DM Sans font injection
 *     — AppShell + globals.css now supply layout and typography.
 *   • Header uses the new PageHeader primitive with a range segmented
 *     control on the right.
 *   • The KPI row stays as 4 columns on lg+; on smaller screens it
 *     collapses to 2. Section dividers use a centered CardEyebrow with
 *     a hairline line on each side, replacing the old "SectionLabel"
 *     component.
 */
const RANGES = [
  { id: '7d',       label: 'Last 7 days' },
  { id: '30d',      label: 'Last 30 days' },
  { id: 'semester', label: 'Semester' },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState('7d');
  const { overview, attendance, assignments, productivity, subjects, studyHours, isLoading, error, refetch } = useAnalytics(range);
  const [toast, setToast] = useState({ open: false, variant: 'info', message: '' });
  const showToast = (variant, message) => setToast({ open: true, variant, message });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton variant="line" width="30%" height={28} />
          <Skeleton variant="line" width="50%" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="block" className="h-24" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="📉"
        title="Analytics failed to load"
        description={error.message || 'Unable to fetch analytics data.'}
        actionLabel="Retry"
        onAction={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Toast
        open={toast.open}
        variant={toast.variant}
        onClose={() => setToast((c) => ({ ...c, open: false }))}
        message={toast.message}
      />

      <PageHeader
        eyebrow="Student dashboard"
        title="Analytics"
        description="Live study metrics from the backend."
        actions={
          <>
            <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-background-subtle p-1">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(r.id)}
                  className={[
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                    range === r.id
                      ? 'bg-surface text-foreground shadow-xs'
                      : 'text-foreground-muted hover:text-foreground',
                  ].join(' ')}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => { refetch(); showToast('success', 'Analytics refreshed.'); }}
            >
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Productivity"     value={formatNumber(productivity?.total)} type="gauge"   color="#f59e0b" delta={3} />
        <KPICard title="Study Streak"     value={overview?.studyStreak || 0}        valueText="days" type="spark"   color="#818cf8" delta={2} />
        <KPICard title="Assignment Rate"  value={overview?.assignmentCompletionRate ?? 0}            type="percent" color="#22d3ee" delta={-1} />
        <KPICard title="Attendance"       value={overview?.attendancePct ?? 0}                     type="percent" color="#34d399" delta={5} />
      </div>

      <SectionDivider>Performance</SectionDivider>
      <div className="grid gap-4 md:grid-cols-2">
        <StudyHoursChart range={range} />
        <AttendanceRadar />
      </div>

      <SectionDivider>Assignments & Syllabus</SectionDivider>
      <div className="grid gap-4 md:grid-cols-2">
        <AssignmentCompletion />
        <SyllabusCompletion />
      </div>

      <SectionDivider>Score & Insights</SectionDivider>
      <div className="grid gap-4 md:grid-cols-2">
        <ProductivityPanel />
        <InsightsPanel />
      </div>
    </div>
  );
}

function SectionDivider({ children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">{children}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}