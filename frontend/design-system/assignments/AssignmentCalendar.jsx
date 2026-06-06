import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Badge, Card, EmptyState } from '../components';

const priorityTone = {
  HIGH:   'danger',
  MEDIUM: 'warning',
  LOW:    'success',
};

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfMonth(d) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function fmtMonthYear(d) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * AssignmentCalendar — month view of due dates.
 *
 * Each cell is a day. Days with assignments show a count badge and a
 * vertical stack of up to 3 chips (subject / title). Clicking a day
 * cell with items opens the detail modal for the first one; a "more"
 * chip opens the full list of that day in a side popover.
 *
 * No external date library — native Date is enough for a single month
 * view; this avoids adding a dep just for this widget.
 */
export default function AssignmentCalendar({ items, onOpen }) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [cursor, setCursor] = useState(() => startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState(() => today);

  // Group assignments by start-of-day so lookup is O(1) per cell.
  const byDay = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      if (!it.dueDate) return;
      const key = startOfDay(new Date(it.dueDate)).getTime();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    });
    return map;
  }, [items]);

  // Build the 6×7 grid (always 42 cells so layout never reflows).
  const grid = useMemo(() => {
    const first = startOfMonth(cursor);
    const startWeekday = first.getDay();
    const start = new Date(first);
    start.setDate(start.getDate() - startWeekday);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const goPrev = () => {
    const c = new Date(cursor);
    c.setMonth(c.getMonth() - 1);
    setCursor(c);
  };
  const goNext = () => {
    const c = new Date(cursor);
    c.setMonth(c.getMonth() + 1);
    setCursor(c);
  };
  const goToday = () => {
    setCursor(startOfMonth(today));
    setSelectedDay(today);
  };

  const itemsForSelectedDay = useMemo(() => {
    return byDay.get(startOfDay(selectedDay).getTime()) || [];
  }, [byDay, selectedDay]);

  const monthRange = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    return items.filter((it) => {
      if (!it.dueDate) return false;
      const t = new Date(it.dueDate).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }, [items, cursor]);

  // Cap the per-cell chip stack at 3 so the grid never overflows; a
  // "+N more" badge surfaces the overflow.
  const MAX_PER_CELL = 3;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <Card padding="none" className="overflow-hidden">
        {/* Header: month nav */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <div>
            <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
              Month
            </div>
            <div className="mt-0.5 text-base font-semibold text-foreground">
              {fmtMonthYear(cursor)}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goToday}
              className="rounded-md border border-border bg-background-subtle px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:text-foreground"
            >
              Today
            </button>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous month"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-foreground-muted transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next month"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-foreground-muted transition-colors hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-border-subtle bg-background-subtle/50">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="px-2 py-2 text-center text-2xs font-semibold uppercase tracking-[0.12em] text-foreground-subtle"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {grid.map((day, idx) => {
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = sameDay(day, today);
            const isSelected = sameDay(day, selectedDay);
            const key = startOfDay(day).getTime();
            const dayItems = byDay.get(key) || [];
            const overflow = dayItems.length - MAX_PER_CELL;
            const hasItems = dayItems.length > 0;
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedDay(day);
                  if (dayItems.length === 1) onOpen?.(dayItems[0]);
                }}
                className={[
                  'group relative flex min-h-[88px] flex-col items-stretch gap-1 border-b border-r border-border-subtle p-1.5 text-left transition-colors',
                  !inMonth ? 'bg-background-subtle/30 text-foreground-subtle' : 'bg-surface',
                  isWeekend && inMonth ? 'bg-background-subtle/40' : '',
                  isSelected ? 'ring-2 ring-inset ring-brand-500/60' : '',
                  'hover:bg-background-subtle',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={[
                      'grid h-5 w-5 place-items-center rounded-full text-2xs font-semibold',
                      isToday ? 'bg-brand-500 text-white' : 'text-foreground',
                      !inMonth ? 'opacity-60' : '',
                    ].join(' ')}
                  >
                    {day.getDate()}
                  </span>
                  {hasItems ? (
                    <span className="rounded-full bg-foreground-muted/20 px-1.5 text-2xs font-mono text-foreground-muted">
                      {dayItems.length}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col gap-0.5">
                  {dayItems.slice(0, MAX_PER_CELL).map((it) => {
                    const tone = priorityTone[(it.priority || '').toUpperCase()] || 'neutral';
                    return (
                      <div
                        key={it.id}
                        className={[
                          'truncate rounded px-1.5 py-0.5 text-2xs font-medium',
                          tone === 'danger'  ? 'bg-danger-soft text-danger-fg' :
                          tone === 'warning' ? 'bg-warning-soft text-warning-fg' :
                          tone === 'success' ? 'bg-success-soft text-success-fg' :
                                               'bg-info-soft text-info-fg',
                        ].join(' ')}
                        title={it.title}
                      >
                        <span className="truncate">{it.title}</span>
                      </div>
                    );
                  })}
                  {overflow > 0 ? (
                    <div className="rounded bg-background-subtle px-1.5 py-0.5 text-2xs font-semibold text-foreground-muted">
                      +{overflow} more
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {/* Month summary footer */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle px-4 py-3 text-xs text-foreground-muted">
          <span className="font-semibold text-foreground">{monthRange.length}</span>
          <span>due in {fmtMonthYear(cursor)}</span>
          <span className="ml-auto flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-danger" /> High
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-warning" /> Medium
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-success" /> Low
            </span>
          </span>
        </div>
      </Card>

      {/* Sidebar: selected day list */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
              {sameDay(selectedDay, today) ? 'Today' : 'Selected day'}
            </div>
            <div className="mt-0.5 text-base font-semibold text-foreground">
              {selectedDay.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <Badge>{itemsForSelectedDay.length}</Badge>
        </div>

        <div className="mt-4 space-y-2">
          {itemsForSelectedDay.length === 0 ? (
            <EmptyState
              icon="📅"
              title="Nothing due"
              description="Pick a day with a colored chip to see its assignments."
              compact
            />
          ) : (
            itemsForSelectedDay.map((it) => {
              const tone = priorityTone[(it.priority || '').toUpperCase()] || 'neutral';
              return (
                <motion.button
                  key={it.id}
                  type="button"
                  whileHover={{ x: 2 }}
                  onClick={() => onOpen?.(it)}
                  className="block w-full rounded-xl border border-border bg-background-subtle/50 p-3 text-left transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-start gap-2">
                    {it.priority === 'HIGH' ? (
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                    ) : (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">{it.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <Badge tone="brand" size="xs">{it.subject || 'No subject'}</Badge>
                        <Badge tone={tone} size="xs">{it.priority || 'Medium'}</Badge>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
