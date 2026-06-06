import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Target as TargetIcon,
  Check,
} from 'lucide-react';
import { onboardingApi } from '../src/api';
import { setSession } from '../src/store/authSlice';
import { Button, Card, CardEyebrow, Input, Select, Badge } from '../components';

/**
 * OnboardingPage — multi-step personalization wizard.
 *
 * Design decisions:
 *   • The old version was a single 8-field page — overwhelming and
 *     visually a "form on a card." We split into 3 steps: Academics →
 *     Study habits → Interests. Each step is a clear focus moment.
 *   • A sticky progress bar at the top shows completion percentage; users
 *     feel momentum at every click.
 *   • Steps animate in/out with framer-motion `AnimatePresence` so the
 *     transition feels like a real wizard, not a form jumping fields.
 *   • Goals/interests use chip-style toggles (radius = 9999px, brand tint
 *     when selected) — common pattern in onboarding flows, low cognitive
 *     load.
 *   • Inputs use the new floating-label primitive.
 */

const STEPS = [
  { id: 'academics', title: 'Academics',     icon: GraduationCap, eyebrow: 'Step 1 of 3' },
  { id: 'habits',    title: 'Study habits',  icon: TargetIcon,    eyebrow: 'Step 2 of 3' },
  { id: 'interests', title: 'Interests',     icon: Sparkles,      eyebrow: 'Step 3 of 3' },
];

const goalOptions = [
  'Improve attendance',
  'Track assignments',
  'Prepare for placements',
  'Build study consistency',
  'Manage notes',
  'Prepare for exams',
  'Collaborate with peers',
];

const interestOptions = [
  'Web Dev', 'AI/ML', 'Data Science', 'DSA', 'System Design', 'Mobile Dev',
  'Cloud', 'DevOps', 'UI/UX', 'Core CSE', 'Mathematics', 'Research',
];

export const OnboardingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const supabaseSession = useSelector((state) => state.auth.supabaseSession);
  const user = useSelector((state) => state.auth.user);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => ({
    degreeName:        user?.degree_name || '',
    universityName:    user?.college_name || '',
    totalSemesters:    user?.total_semesters || 8,
    joiningYear:       user?.joining_year || new Date().getFullYear(),
    semesterNumber:    user?.current_semester || 1,
    academicYear:      '',
    semesterStartDate: '',
    expectedEndDate:   '',
    goals:             [],
    dailyStudyHours:   4,
    biggestChallenge:  'Focus',
    preferredStudyTime:'Evening',
    interests:         [],
  }));

  const setField = (field) => (event) => {
    const value = event.target.type === 'number' ? Number(event.target.value) : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleArrayItem = (field, value) => {
    setForm((current) => {
      const existing = current[field];
      const next = existing.includes(value)
        ? existing.filter((item) => item !== value)
        : [...existing, value];
      return { ...current, [field]: next };
    });
  };

  // Per-step validation
  const stepValid = useMemo(() => {
    if (step === 0) return form.degreeName.trim() && form.universityName.trim();
    if (step === 1) return form.goals.length > 0;
    if (step === 2) return form.interests.length > 0;
    return false;
  }, [step, form]);

  const goNext = () => {
    if (!stepValid) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await onboardingApi.submit(form);
      const nextUser = result?.user || result?.data?.user || { ...user, is_onboarded: true, isOnboarded: true };
      dispatch(setSession({ user: nextUser, supabaseSession }));
      navigate('/dashboard', { replace: true });
    } catch (submissionError) {
      setError(submissionError?.response?.data?.message || 'Could not finish onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display text-md font-bold tracking-tight">SYNC</div>
            <div className="-mt-0.5 text-2xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
              Setup
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-[0.12em] text-foreground-muted">
              {STEPS[step].eyebrow}
            </span>
            <span className="font-mono text-foreground-muted">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-background-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        <Card padding="lg" className="flex-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={STEPS[step].id}
              initial={{ opacity: 0, x: direction > 0 ? 24 : -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -24 : 24 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 0 ? (
                <StepAcademics form={form} setField={setField} />
              ) : step === 1 ? (
                <StepHabits form={form} setField={setField} toggle={toggleArrayItem} />
              ) : (
                <StepInterests form={form} toggle={toggleArrayItem} />
              )}
            </motion.div>
          </AnimatePresence>

          {error ? (
            <div className="mt-6 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-fg">
              {error}
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              leadingIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={goBack}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                trailingIcon={<ArrowRight className="h-4 w-4" />}
                onClick={goNext}
                disabled={!stepValid}
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={submit}
                isLoading={submitting}
                disabled={!stepValid}
              >
                Finish setup
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const StepHeader = ({ eyebrow, title, description }) => (
  <div className="mb-6">
    <CardEyebrow>{eyebrow}</CardEyebrow>
    <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
      {title}
    </h1>
    {description ? (
      <p className="mt-2 text-sm text-foreground-muted">{description}</p>
    ) : null}
  </div>
);

const StepAcademics = ({ form, setField }) => (
  <div>
    <StepHeader
      eyebrow="Tell us about your degree"
      title="Your academics"
      description="We'll tailor deadlines, recommendations, and study planning to your program."
    />
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Degree name" value={form.degreeName} onChange={setField('degreeName')} />
      <Input label="University / College" value={form.universityName} onChange={setField('universityName')} />
      <Input label="Total semesters" type="number" min="1" value={form.totalSemesters} onChange={setField('totalSemesters')} />
      <Input label="Joining year" type="number" value={form.joiningYear} onChange={setField('joiningYear')} />
      <Input label="Current semester" type="number" value={form.semesterNumber} onChange={setField('semesterNumber')} />
      <Input label="Academic year" value={form.academicYear} onChange={setField('academicYear')} placeholder="2024–2025" />
      <Input label="Semester start" type="date" value={form.semesterStartDate} onChange={setField('semesterStartDate')} />
      <Input label="Expected end" type="date" value={form.expectedEndDate} onChange={setField('expectedEndDate')} />
    </div>
  </div>
);

const StepHabits = ({ form, setField, toggle }) => (
  <div>
    <StepHeader
      eyebrow="How do you study best?"
      title="Goals & study habits"
      description="Pick the outcomes that matter most. We'll surface them on your dashboard."
    />
    <div className="mb-6">
      <h3 className="mb-3 text-sm font-semibold text-foreground">What are your goals?</h3>
      <div className="flex flex-wrap gap-2">
        {goalOptions.map((goal) => {
          const active = form.goals.includes(goal);
          return (
            <button
              key={goal}
              type="button"
              onClick={() => toggle('goals', goal)}
              className={[
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
                active
                  ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-xs'
                  : 'border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground',
              ].join(' ')}
            >
              {active ? <Check className="h-3.5 w-3.5" /> : null}
              {goal}
            </button>
          );
        })}
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-3">
      <Card padding="md" className="sm:col-span-1">
        <div className="text-2xs font-semibold uppercase tracking-[0.12em] text-foreground-subtle">
          Daily study hours
        </div>
        <div className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
          {form.dailyStudyHours}
          <span className="ml-1 text-base font-normal text-foreground-muted">hrs</span>
        </div>
        <input
          type="range"
          min="0"
          max="12"
          step="1"
          value={form.dailyStudyHours}
          onChange={setField('dailyStudyHours')}
          className="mt-3 w-full accent-brand-500"
        />
        <div className="mt-1 flex justify-between text-2xs text-foreground-subtle">
          <span>0h</span><span>12h</span>
        </div>
      </Card>

      <div className="sm:col-span-1">
        <Select
          label="Biggest challenge"
          value={form.biggestChallenge}
          onChange={setField('biggestChallenge')}
        >
          {['Procrastination', 'Focus', 'Time Management', 'Resource Organization', 'Exam Stress'].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </Select>
      </div>

      <div className="sm:col-span-1">
        <Select
          label="Preferred study time"
          value={form.preferredStudyTime}
          onChange={setField('preferredStudyTime')}
        >
          {['Morning', 'Afternoon', 'Evening', 'Night'].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </Select>
      </div>
    </div>
  </div>
);

const StepInterests = ({ form, toggle }) => (
  <div>
    <StepHeader
      eyebrow="What do you want to learn?"
      title="Pick your interests"
      description="We'll recommend study resources, study-room topics, and AI prompts based on these."
    />
    <div className="flex flex-wrap gap-2">
      {interestOptions.map((interest) => {
        const active = form.interests.includes(interest);
        return (
          <button
            key={interest}
            type="button"
            onClick={() => toggle('interests', interest)}
            className={[
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
              active
                ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-xs'
                : 'border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground',
            ].join(' ')}
          >
            {active ? <Check className="h-3.5 w-3.5" /> : null}
            {interest}
          </button>
        );
      })}
    </div>
    <div className="mt-6 flex items-center gap-2 text-sm text-foreground-muted">
      <Badge tone="brand" size="xs">
        {form.interests.length} selected
      </Badge>
      <span>Pick at least one to continue.</span>
    </div>
  </div>
);

export default OnboardingPage;
