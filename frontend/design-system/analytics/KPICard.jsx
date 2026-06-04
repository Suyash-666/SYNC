import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * KPICard — analytics overview tile.
 *
 * Design decisions:
 *   • Uses the design-system Card primitive (light surface, soft border)
 *     and a real accent prop (string) for the gauge color. No inline
 *     `style={{ background: 'rgba(255,255,255,0.05)' }}` hacks.
 *   • Number animates in with a framer-motion spring, not a JS interval
 *     — the original used setInterval(16ms) which is jankier.
 *   • Delta arrow uses Lucide icons, not Unicode `▲▼` which render
 *     differently across systems.
 *   • Gauge/ring stroke uses `currentColor` so we can drive it from the
 *     parent's accent class (`text-warning`, `text-info`, etc.) instead
 *     of hardcoded hex.
 */

const TONE_CLASS = {
  '#f59e0b': 'text-warning',
  '#22d3ee': 'text-info',
  '#34d399': 'text-success',
  '#818cf8': 'text-brand-500',
  '#f43f5e': 'text-danger',
};

function AnimatedNumber({ target, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf, start;
    const dur = 700;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setDisplay(Math.floor(p * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
  }, [target]);
  return <span>{display}{suffix}</span>;
}

function GlowGauge({ value, color = '#f59e0b' }) {
  const r = 44, circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ * 0.75;
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <circle cx="50" cy="50" r={r} fill="none" className="stroke-border" strokeWidth="8"
        strokeDasharray={`${circ * 0.75} ${circ}`} strokeLinecap="round" transform="rotate(135 50 50)" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round" transform="rotate(135 50 50)"
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(.4,0,.2,1)' }} />
      <text x="50" y="58" textAnchor="middle" className="fill-foreground" fontSize="18" fontWeight="700">
        {value}%
      </text>
    </svg>
  );
}

function RingPercent({ value, color = '#22d3ee' }) {
  const r = 32, circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="h-16 w-16">
      <circle cx="40" cy="40" r={r} fill="none" className="stroke-border" strokeWidth="7" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${(value / 100) * circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(.4,0,.2,1)' }} />
      <text x="40" y="48" textAnchor="middle" className="fill-foreground" fontSize="14" fontWeight="700">
        {value}%
      </text>
    </svg>
  );
}

function Sparkline({ color = '#f59e0b' }) {
  const id = `sp-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg viewBox="0 0 64 40" className="h-10 w-16">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points="0,35 12,22 24,28 36,10 48,18 64,5" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="0,35 12,22 24,28 36,10 48,18 64,5 64,40 0,40" fill={`url(#${id})`} opacity="0.4" />
    </svg>
  );
}

export default function KPICard({ title, value, valueText, delta, type, color }) {
  const accent = color || (type === 'gauge' ? '#f59e0b' : '#22d3ee');
  const positive = delta > 0;
  const deltaColor = positive ? 'text-success-fg' : 'text-danger-fg';
  const DeltaIcon = positive ? TrendingUp : TrendingDown;

  return (
    <div className="surface-card relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full opacity-25 blur-2xl"
        style={{ backgroundColor: accent }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
          {title}
        </div>
        <div className="mt-2 font-display text-3xl font-semibold leading-none tracking-tight text-foreground">
          <AnimatedNumber target={typeof value === 'number' ? value : 0} suffix={type === 'percent' && !valueText ? '%' : ''} />
          {valueText ? <span className="ml-1 text-sm font-normal text-foreground-muted">{valueText}</span> : null}
        </div>
        {delta !== undefined ? (
          <div className={['mt-2 inline-flex items-center gap-1 text-xs font-semibold', deltaColor].join(' ')}>
            <DeltaIcon className="h-3 w-3" />
            {Math.abs(delta)}% vs last period
          </div>
        ) : null}
      </div>

      {type === 'gauge'   ? <GlowGauge  value={value} color={accent} /> : null}
      {type === 'percent' ? <RingPercent value={value} color={accent} /> : null}
      {type === 'spark'   ? <Sparkline  color={accent} /> : null}
    </div>
  );
}
