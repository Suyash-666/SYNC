import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Layers3,
  Sparkles,
} from 'lucide-react';
import { Toast } from '../components';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

const formOrder = ['login', 'signup', 'forgot'];

const formVariants = {
  enter: (direction) => ({ opacity: 0, x: direction > 0 ? 18 : -18 }),
  center: { opacity: 1, x: 0 },
  exit: (direction) => ({ opacity: 0, x: direction > 0 ? -18 : 18 }),
};

const formPaths = {
  login: '/login',
  signup: '/signup',
  forgot: '/forgot-password',
};

const tabFor = {
  login: { id: 'login', label: 'Log in' },
  signup: { id: 'signup', label: 'Sign up' },
};

function resolveFormFromLocation(pathname, hash) {
  const hashForm = hash?.replace('#', '');
  if (formOrder.includes(hashForm)) return hashForm;
  if (pathname === '/signup') return 'signup';
  if (pathname === '/forgot-password') return 'forgot';
  return 'login';
}

const timeline = [
  { time: '08:30', label: 'Data structures lecture', status: 'Prepared' },
  { time: '11:00', label: 'CN lab submission', status: 'Due today' },
  { time: '16:45', label: 'Revision sprint', status: 'AI planned' },
];

function ProductPreview() {
  return (
    <div className="relative mt-12 max-w-xl">
      <div className="absolute -inset-8 rounded-[2rem] bg-brand-500/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.055] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-white/35" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <div className="text-2xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Semester cockpit
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_0.82fr]">
          <div className="border-b border-white/10 p-5 md:border-b-0 md:border-r">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-2xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Focus index
                </div>
                <div className="mt-2 text-5xl font-semibold leading-none text-white">87</div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-white/72">
                +12 this week
              </div>
            </div>

            <div className="space-y-2">
              {timeline.map((item) => (
                <div
                  key={item.time}
                  className="grid grid-cols-[3.75rem_1fr] gap-3 rounded-md border border-white/10 bg-black/10 p-3"
                >
                  <div className="font-mono text-xs text-white/42">{item.time}</div>
                  <div>
                    <div className="text-sm font-medium text-white">{item.label}</div>
                    <div className="mt-0.5 text-xs text-white/45">{item.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
              <Sparkles className="h-4 w-4 text-brand-200" />
              AI brief
            </div>
            <p className="text-sm leading-relaxed text-white/58">
              Prioritize CN lab before 11:00, then reserve a 42-minute review block for tomorrow's operating systems quiz.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {[
                ['14.5h', 'Study'],
                ['4', 'Deadlines'],
                ['92%', 'Attendance'],
                ['6d', 'Streak'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-md border border-white/10 bg-white/[0.045] p-3">
                  <div className="text-lg font-semibold text-white">{value}</div>
                  <div className="mt-0.5 text-2xs uppercase tracking-[0.14em] text-white/38">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentForm, setCurrentForm] = useState('login');
  const [direction, setDirection] = useState(1);
  const [toast, setToast] = useState({ open: false, variant: 'info', message: '' });

  useEffect(() => {
    const next = resolveFormFromLocation(location.pathname, location.hash);
    setCurrentForm((current) => {
      if (current === next) return current;
      setDirection(formOrder.indexOf(next) > formOrder.indexOf(current) ? 1 : -1);
      return next;
    });
  }, [location.pathname, location.hash]);

  const switchForm = (next) => {
    if (next === currentForm) return;
    setDirection(formOrder.indexOf(next) > formOrder.indexOf(currentForm) ? 1 : -1);
    setCurrentForm(next);
    navigate(`${formPaths[next] || '/login'}#${next}`);
  };

  const notify = (variant, message) => setToast({ open: true, variant, message });
  const closeToast = () => setToast((p) => ({ ...p, open: false }));

  const rendered = useMemo(() => {
    const props = { onSwitch: switchForm, onNotify: notify };
    if (currentForm === 'signup') return <SignupForm {...props} />;
    if (currentForm === 'forgot') return <ForgotPasswordForm {...props} />;
    return <LoginForm {...props} />;
  }, [currentForm]);

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(440px,0.88fr)]">
      <Toast open={toast.open} variant={toast.variant} onClose={closeToast} duration={3200} message={toast.message} />

      <aside className="auth-ambient relative hidden min-h-screen overflow-hidden px-10 py-9 text-white lg:flex lg:flex-col">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md border border-white/12 bg-white/8">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">SYNC</div>
              <div className="text-2xs uppercase tracking-[0.18em] text-white/42">Academic OS</div>
            </div>
          </div>
          <a
            href="/landing"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/8 hover:text-white"
          >
            View product
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-3 py-1.5 text-xs font-medium text-white/62">
              <Layers3 className="h-3.5 w-3.5" />
              Built for high-output semesters
            </div>
            <h1 className="max-w-3xl text-6xl font-semibold leading-[1.02] text-white">
              Serious study deserves serious software.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/58">
              SYNC turns assignments, revision, attendance, notes, and AI planning into a single command surface for ambitious students.
            </p>
          </motion.div>

          <ProductPreview />
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
          {[
            [CalendarDays, 'Plan', 'Weeks in one view'],
            [BookOpen, 'Capture', 'Notes stay contextual'],
            [Sparkles, 'Adapt', 'AI nudges quietly'],
          ].map(([Icon, title, text]) => (
            <div key={title}>
              <Icon className="mb-2 h-4 w-4 text-white/45" />
              <div className="text-sm font-medium text-white">{title}</div>
              <div className="mt-1 text-xs leading-relaxed text-white/42">{text}</div>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">SYNC</div>
                <div className="text-2xs uppercase tracking-[0.18em] text-foreground-subtle">Academic OS</div>
              </div>
            </div>
          </div>

          {currentForm !== 'forgot' ? (
            <div className="mb-8 inline-flex border-b border-border">
              {Object.values(tabFor).map((tab) => {
                const active = currentForm === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => switchForm(tab.id)}
                    className={[
                      'relative px-0 py-2 text-sm font-medium transition-colors',
                      tab.id === 'signup' ? 'ml-8' : '',
                      active ? 'text-foreground' : 'text-foreground-subtle hover:text-foreground',
                    ].join(' ')}
                  >
                    {tab.label}
                    {active ? <span className="absolute inset-x-0 -bottom-px h-px bg-foreground" /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentForm}
              custom={direction}
              variants={formVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {rendered}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
