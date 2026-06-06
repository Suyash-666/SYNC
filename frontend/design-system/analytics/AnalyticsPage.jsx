import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { Button, PageHeader, Toast } from '../components';
import KPIRow from './KPIRow';
import StudyHoursChart from './StudyHoursChart';
import AttendanceRadar from './AttendanceRadar';
import AssignmentCompletion from './AssignmentCompletion';
import SyllabusCompletion from './SyllabusCompletion';
import ProductivityPanel from './ProductivityPanel';
import InsightsPanel from './InsightsPanel';

const RANGES = [
  { id: '7d',       label: 'Last 7 days' },
  { id: '30d',      label: 'Last 30 days' },
  { id: 'semester', label: 'Semester' },
];

/**
 * AnalyticsPage — composes independent analytics cards.
 *
 * Architectural notes:
 *   • The page does NOT call a single combined `useAnalytics` hook. Each
 *     card fetches its own slice of data via its own `useQuery`, so a
 *     failing endpoint only blanks its own card. Other cards keep
 *     showing their metadata/placeholder content unchanged.
 *   • The page also does not block on a top-level `isLoading` flag —
 *     there isn't one. The page renders as soon as React mounts, and
 *     each card shows its own skeleton (via CardShell) while its
 *     specific data is in-flight.
 *   • The "Refresh" button invalidates the `analytics` query family so
 *     every card refetches in parallel. No card is dependent on the
 *     others' state.
 *   • Range changes are forwarded to each card that supports them via
 *     the `range` prop. Cards that don't depend on the period (e.g.
 *     productivity) ignore it.
 */
export default function AnalyticsPage() {
  const [range, setRange] = useState('7d');
  const queryClient = useQueryClient();
  const [toast, setToast] = useState({ open: false, variant: 'info', message: '' });
  const showToast = (variant, message) => setToast({ open: true, variant, message });

  const refreshAll = async () => {
    // Invalidate every analytics key in parallel. Each card sees its
    // own query go to "fetching" and renders its own skeleton; the
    // page itself doesn't change shape.
    await queryClient.invalidateQueries({ queryKey: ['analytics'] });
    showToast('success', 'Analytics refreshed.');
  };

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
              onClick={refreshAll}
            >
              Refresh
            </Button>
          </>
        }
      />

      <KPIRow range={range} />

      <SectionDivider>Performance</SectionDivider>
      <div className="grid gap-4 md:grid-cols-2">
        <StudyHoursChart range={range} />
        <AttendanceRadar range={range} />
      </div>

      <SectionDivider>Assignments & Syllabus</SectionDivider>
      <div className="grid gap-4 md:grid-cols-2">
        <AssignmentCompletion range={range} />
        <SyllabusCompletion range={range} />
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
