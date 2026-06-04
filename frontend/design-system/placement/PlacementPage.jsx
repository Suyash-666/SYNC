import React, { useMemo, useState } from 'react';
import { Briefcase } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton } from '../components';
import { usePlacement } from '../src/hooks/usePlacement';

const TABS = [
  { id: 'dsa',       label: 'DSA' },
  { id: 'interview', label: 'Interview' },
  { id: 'aptitude',  label: 'Aptitude' },
  { id: 'resume',    label: 'Resume' },
];

export default function PlacementPage() {
  const [tab, setTab] = useState('dsa');
  const { progress, stats, dsaProblems, isLoading, error, addDsaProblem } = usePlacement({});

  const categoryCards = useMemo(() => stats?.perCategory || [], [stats]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton variant="line" width="30%" height={28} />
          <Skeleton variant="line" width="50%" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="block" className="h-28" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Placement data failed to load"
        description={error.message || 'Unable to fetch placement progress.'}
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Career"
        title="Placement Prep"
        description="Track interview readiness and DSA practice."
        actions={
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-background-subtle p-1">
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={[
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                    active
                      ? 'bg-surface text-foreground shadow-xs'
                      : 'text-foreground-muted hover:text-foreground',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categoryCards.map((item) => (
          <Card key={item.category} padding="md">
            <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
              {item.category}
            </div>
            <div className="mt-2 font-display text-3xl font-semibold text-foreground">
              {item.completed}/{item.total}
            </div>
            <div className="mt-1 text-sm text-foreground-muted">{item.completionPct}% complete</div>
          </Card>
        ))}
      </div>

      {tab === 'dsa' && (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card padding="md">
            <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">DSA stats</div>
            <div className="mt-2 font-display text-3xl font-semibold text-foreground">
              {categoryCards.find((item) => item.category === 'DSA')?.completionPct || 0}%
            </div>
            <div className="mt-1 text-sm text-text-secondary">Completion percentage</div>
            <div className="mt-5 space-y-2 text-sm text-text-secondary">
              {(stats?.dsaDifficulty || []).map((item) => (
                <div key={item.difficulty || 'UNKNOWN'} className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] px-3 py-2">
                  <span>{item.difficulty || 'Unspecified'}</span>
                  <Badge>{item._count?._all || 0}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.2em] text-text-secondary">DSA problems</div>
                <h2 className="mt-1 text-xl font-semibold">Current practice list</h2>
              </div>
              <Button size="sm" onClick={async () => addDsaProblem({ topic: 'Arrays', item_name: 'Two Sum', difficulty: 'EASY' })}>
                Quick add
              </Button>
            </div>

            <div className="space-y-3">
              {dsaProblems.length === 0 ? (
                <EmptyState icon="🧠" title="No DSA problems yet" subtitle="Add your first practice item to start tracking." />
              ) : (
                dsaProblems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-text-primary">{item.item_name}</div>
                        <div className="mt-1 text-sm text-text-secondary">{item.topic}</div>
                      </div>
                      <Badge>{item.difficulty || 'N/A'}</Badge>
                    </div>
                    <div className="mt-3 text-sm text-text-secondary">Status: {item.status}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {tab !== 'dsa' && (
        <Card className="p-5">
          <EmptyState icon="🚧" title={`${tab[0].toUpperCase() + tab.slice(1)} prep in progress`} subtitle="The backend connection is in place; add the next data model or UI flow here." />
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-text-secondary">All progress items</div>
            <h2 className="mt-1 text-lg font-semibold">Current dashboard feed</h2>
          </div>
          <Badge>{progress.length}</Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {progress.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] p-4">
              <div className="font-medium">{item.item_name}</div>
              <div className="mt-1 text-sm text-text-secondary">{item.category} • {item.topic}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

