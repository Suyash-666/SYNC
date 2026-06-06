import React, { useMemo, useState } from 'react';
import { Briefcase, ExternalLink } from 'lucide-react';
import { Badge, Card, PageHeader, Skeleton, Toast } from '../components';
import { usePlacement } from '../src/hooks/usePlacement';
import BankList from './BankList';
import { dsaSheet } from './data/dsaSheet';
import { aptitudeSheet } from './data/aptitudeSheet';
import { interviewSheet } from './data/interviewSheet';
import { resumeChecklist } from './data/resumeChecklist';

const TABS = [
  { id: 'dsa',       label: 'DSA',       category: 'DSA' },
  { id: 'interview', label: 'Interview', category: 'INTERVIEW' },
  { id: 'aptitude',  label: 'Aptitude',  category: 'APTITUDE' },
  { id: 'resume',    label: 'Resume',    category: 'RESUME' },
];

const BANK_FOR_TAB = {
  dsa:       { bank: dsaSheet,        title: 'DSA Practice',          note: 'Apna College DSA sheet — 250+ problems across 18 topics.' },
  interview: { bank: interviewSheet,  title: 'Interview Prep',        note: 'Behavioural, technical, HR & logistics — 40+ questions.' },
  aptitude:  { bank: aptitudeSheet,   title: 'Aptitude Practice',     note: 'Quant + logical + verbal — 60+ questions, IndiaBix-style.' },
  resume:    { bank: resumeChecklist, title: 'Resume Checklist',      note: 'Recruiter-grade resume audit — tick items as you go.' },
};

export default function PlacementPage() {
  const [tab, setTab] = useState('dsa');
  const [toast, setToast] = useState({ open: false, variant: 'info', message: '' });
  const showToast = (variant, message) => setToast({ open: true, variant, message });

  const { progress, stats, addItem, updateItem } = usePlacement({});

  // Single source of truth for the active tab — bank, category enum
  // value, and copy all in one place so a tick written for DSA never
  // gets saved as an INTERVIEW row.
  const cfg = BANK_FOR_TAB[tab] || BANK_FOR_TAB.dsa;

  // The `progress` rows we already have come from getProgress() with no
  // category filter; that's enough to drive all four banks. Each bank
  // finds the matching row by item_name.

  // Find or create the PlacementProgress row for a given item. We
  // can't rely on the table having a unique constraint on
  // (user_id, category, item_name), so we filter in memory and
  // upsert manually.
  const upsertItem = async (item, topic, nextStatus) => {
    const existing = progress.find(
      (p) => p.category === cfg.category && p.item_name === item.name,
    );
    try {
      if (existing) {
        await updateItem(existing.id, { status: nextStatus });
      } else {
        await addItem({
          category: cfg.category,
          topic,
          item_name: item.name,
          status: nextStatus,
          difficulty: item.difficulty || null,
        });
      }
    } catch (err) {
      showToast('error', err?.response?.data?.message || err?.message || 'Could not save progress.');
    }
  };

  const onToggle = async (item, topic, nextStatus) => {
    await upsertItem(item, topic, nextStatus);
    if (nextStatus === 'COMPLETED') showToast('success', `Marked “${item.name}” as done.`);
  };
  const onMarkInProgress = async (item, topic, nextStatus) => {
    await upsertItem(item, topic, nextStatus);
  };

  const categoryCards = useMemo(() => stats?.perCategory || [], [stats]);

  return (
    <div className="space-y-6">
      <Toast
        open={toast.open}
        variant={toast.variant}
        onClose={() => setToast((c) => ({ ...c, open: false }))}
        message={toast.message}
      />

      <PageHeader
        eyebrow="Career"
        title="Placement Prep"
        description="Track interview readiness, DSA practice, aptitude drills and resume polish — all in one place."
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

      {/* Per-category stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categoryCards.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="md">
              <Skeleton variant="line" width="60%" />
              <Skeleton variant="line" width="40%" height={28} className="mt-2" />
            </Card>
          ))
        ) : (
          categoryCards.map((item) => (
            <Card key={item.category} padding="md">
              <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
                {item.category}
              </div>
              <div className="mt-2 font-display text-3xl font-semibold text-foreground">
                {item.completed}<span className="text-base text-foreground-muted">/{item.total}</span>
              </div>
              <div className="mt-1 text-sm text-foreground-muted">{item.completionPct}% complete</div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-500"
                  style={{ width: `${item.completionPct}%` }}
                />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Active bank */}
      <BankList
        category={cfg.category}
        bank={cfg.bank}
        progress={progress}
        onToggle={onToggle}
        onMarkInProgress={onMarkInProgress}
        headerNote={cfg.note}
      />

      {/* Side panel — quick resources */}
      <Card padding="md" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
              External resources
            </div>
            <div className="mt-1 text-sm text-foreground">
              Free, no-login references for the {cfg.title.toLowerCase()} work above.
            </div>
          </div>
          <Badge>Curated</Badge>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {RESOURCES[tab]?.map((r) => (
            <a
              key={r.href}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-2 rounded-2xl border border-border bg-[rgba(255,255,255,0.03)] p-3 transition-colors hover:border-foreground/30"
            >
              <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground group-hover:text-[var(--color-accent)]">{r.label}</div>
                <div className="truncate text-2xs text-foreground-subtle">{r.href}</div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}

const RESOURCES = {
  dsa: [
    { label: 'Apna College DSA Sheet (the source for our list)', href: 'https://dsa.apnacollege.in/sheet/dsa-sheet' },
    { label: 'Striver\'s SDE Sheet (191 problems)',                  href: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/' },
    { label: 'NeetCode 150 (curated LC list)',                      href: 'https://neetcode.io/practice' },
    { label: 'LeetCode',                                            href: 'https://leetcode.com' },
    { label: 'GeeksforGeeks — Topic-wise practice',                href: 'https://practice.geeksforgeeks.org' },
    { label: 'Codeforces (contests)',                               href: 'https://codeforces.com' },
  ],
  interview: [
    { label: 'GeeksforGeeks — Interview Corner',                    href: 'https://www.geeksforgeeks.org/interview-corner/' },
    { label: 'InterviewBit — Practice + prep',                     href: 'https://www.interviewbit.com' },
    { label: 'IGate Patrich — HR / behavioural answers',            href: 'https://www.igatepatrich.com' },
    { label: 'Pramp — Free mock interviews',                       href: 'https://www.pramp.com' },
    { label: 'Exponent — Mock interview practice',                 href: 'https://www.tryexponent.com' },
  ],
  aptitude: [
    { label: 'IndiaBix (full question bank + explanations)',       href: 'https://www.indiabix.com/aptitude/questions-and-answers/' },
    { label: 'GeeksforGeeks — Aptitude',                           href: 'https://www.geeksforgeeks.org/aptitude-questions-and-answers/' },
    { label: 'Testbook — Topic-wise quizzes',                      href: 'https://testbook.com/aptitude-questions' },
    { label: 'Freshersworld — Practice tests',                     href: 'https://www.freshersworld.com/aptitude-questions' },
  ],
  resume: [
    { label: 'Jobscan — free ATS scan',                            href: 'https://www.jobscan.co' },
    { label: 'Overleaf — free LaTeX resume templates',             href: 'https://www.overleaf.com/gallery/tagged/cv' },
    { label: 'Cultivated Culture — resume guides',                 href: 'https://cultivatedculture.com' },
    { label: 'Resume Worded — instant score',                      href: 'https://resumeworded.com' },
  ],
};
