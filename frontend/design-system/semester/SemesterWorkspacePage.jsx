import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDashed,
  Clock3,
  FileText,
  GraduationCap,
  LibraryBig,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Input, Toast, Badge, PageHeader, Select } from '../components';
import { semestersApi, subjectsApi, attendanceApi } from '../src/api';

// ---------------------------------------------------------------------------
// Validation schemas for the two modals.
// ---------------------------------------------------------------------------
const addSubjectSchema = z.object({
  subjectName: z.string().min(1, 'Subject name is required.'),
  subjectCode: z.string().min(1, 'Subject code is required.'),
  totalModules: z.coerce.number().int().min(1, 'Enter a valid module count.'),
});

const createSemesterSchema = z.object({
  semester_number: z.coerce.number().int().min(1, 'Semester number must be at least 1.'),
  academic_year: z.string().min(1, 'Academic year is required.'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_current: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Helper: pick the default semester from a list.  Prefer is_current=true;
// fall back to the highest semester_number; fall back to the first row.
// ---------------------------------------------------------------------------
function pickDefaultSemester(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const current = list.find((s) => s.is_current);
  if (current) return current;
  const sorted = [...list].sort((a, b) => (b.semester_number || 0) - (a.semester_number || 0));
  return sorted[0];
}

// ---------------------------------------------------------------------------
// Subject row mappers: Supabase returns snake_case columns (e.g. subject_code,
// total_modules, completed_modules). The existing card UI expects the legacy
// camelCase shape (code, modules, completion, etc.). The mapper also
// gracefully handles already-camelCase rows (legacy fallback).
// ---------------------------------------------------------------------------
function mapSubjectRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    code: row.subject_code || row.code || '',
    modules: row.total_modules ?? row.modules ?? 0,
    completed: row.completed_modules ?? row.completed ?? 0,
    internalMax: row.internal_max_marks ?? null,
    internalScored: row.internal_scored ?? null,
  };
}

function mapSemesterRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    semesterNumber: row.semester_number,
    academicYear: row.academic_year || '',
    startDate: row.start_date,
    endDate: row.end_date,
    isCurrent: !!row.is_current,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export const SemesterWorkspacePage = () => {
  const queryClient = useQueryClient();
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [activeTab, setActiveTab] = useState('Syllabus');
  const [toast, setToast] = useState({ open: false, message: '', variant: 'info' });
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);

  const showToast = (message, variant = 'info') =>
    setToast({ open: true, message, variant });
  const closeToast = () => setToast({ open: false, message: '', variant: 'info' });

  // ---------------------------------------------------------------------
  // Semesters query
  // ---------------------------------------------------------------------
  const semestersQuery = useQuery({
    queryKey: ['semesters'],
    queryFn: () => semestersApi.getAll(),
  });

  // Whenever the semester list changes, ensure a sensible selection:
  //   1. keep the current selection if it's still in the list
  //   2. otherwise pick is_current=true (or the most recent)
  useEffect(() => {
    const list = semestersQuery.data || [];
    if (list.length === 0) {
      setSelectedSemesterId(null);
      return;
    }
    const stillThere = list.find((s) => s.id === selectedSemesterId);
    if (stillThere) return;
    const def = pickDefaultSemester(list);
    if (def) setSelectedSemesterId(def.id);
  }, [semestersQuery.data, selectedSemesterId]);

  const activeSemester = useMemo(() => {
    const list = semestersQuery.data || [];
    return list.find((s) => s.id === selectedSemesterId) || null;
  }, [semestersQuery.data, selectedSemesterId]);

  // ---------------------------------------------------------------------
  // Subjects query (for the active semester)
  // ---------------------------------------------------------------------
  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'by-semester', selectedSemesterId],
    queryFn: () => subjectsApi.getBySemester(selectedSemesterId),
    enabled: Boolean(selectedSemesterId),
  });

  const subjects = useMemo(() => {
    const rows = subjectsQuery.data || [];
    return rows.map(mapSubjectRow).filter(Boolean);
  }, [subjectsQuery.data]);

  // ---------------------------------------------------------------------
  // Add-Subject form
  // ---------------------------------------------------------------------
  const {
    register: registerSubject,
    handleSubmit: handleSubmitSubject,
    formState: { errors: subjectErrors, isSubmitting: isSubmittingSubject },
    reset: resetSubject,
  } = useForm({
    resolver: zodResolver(addSubjectSchema),
    defaultValues: { subjectName: '', subjectCode: '', totalModules: 5 },
  });

  // ---------------------------------------------------------------------
  // Create-Semester form
  // ---------------------------------------------------------------------
  const {
    register: registerSemester,
    handleSubmit: handleSubmitSemester,
    formState: { errors: semesterErrors, isSubmitting: isSubmittingSemester },
    reset: resetSemesterForm,
    watch: watchSemester,
    setValue: setSemesterValue,
  } = useForm({
    resolver: zodResolver(createSemesterSchema),
    defaultValues: {
      semester_number: 1,
      academic_year: '',
      start_date: '',
      end_date: '',
      is_current: true,
    },
  });

  const isCurrentChecked = watchSemester('is_current');

  // ---------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------
  const createSubjectMutation = useMutation({
    mutationFn: ({ semesterId, payload }) => subjectsApi.create(semesterId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', 'by-semester', selectedSemesterId] });
      showToast('Subject added successfully.', 'success');
    },
    onError: (err) => {
      showToast(err?.message || 'Failed to add subject.', 'error');
    },
  });

  const createSemesterMutation = useMutation({
    mutationFn: (payload) => semestersApi.create(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      if (created?.id) setSelectedSemesterId(created.id);
      showToast('Semester created.', 'success');
    },
    onError: (err) => {
      showToast(err?.message || 'Failed to create semester.', 'error');
    },
  });

  // ---------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------
  const onAddSubject = (values) => {
    if (!selectedSemesterId) {
      showToast('Select or create a semester first.', 'error');
      return;
    }
    createSubjectMutation.mutate({
      semesterId: selectedSemesterId,
      payload: {
        name: values.subjectName,
        subject_code: values.subjectCode,
        total_modules: values.totalModules,
      },
    });
    setShowSubjectModal(false);
    resetSubject();
  };

  const onCreateSemester = (values) => {
    const payload = {
      semester_number: values.semester_number,
      academic_year: values.academic_year,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      is_current: !!values.is_current,
    };
    createSemesterMutation.mutate(payload);
    setShowSemesterModal(false);
    resetSemesterForm();
  };

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  const semesters = semestersQuery.data || [];
  const eyebrow = activeSemester
    ? `Semester ${activeSemester.semester_number}${activeSemester.academicYear ? ' · ' + activeSemester.academicYear : ''}`
    : 'No semester selected';

  return (
    <div className="space-y-6">
      <Toast
        open={toast.open}
        onClose={closeToast}
        duration={3000}
        message={toast.message}
        variant={toast.variant}
      />

      <PageHeader
        eyebrow={eyebrow}
        title="Semester workspace"
        description="Track syllabus completion, internal marks, attendance, and resources from one organized command center."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {semesters.length > 0 ? (
              <Select
                value={selectedSemesterId || ''}
                onChange={(e) => setSelectedSemesterId(e.target.value)}
                className="w-56"
              >
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    Sem {s.semester_number} · {s.academic_year || '—'}
                    {s.is_current ? ' (current)' : ''}
                  </option>
                ))}
              </Select>
            ) : null}
            <Button
              variant="secondary"
              onClick={() => setShowSemesterModal(true)}
              leadingIcon={<Plus className="h-4 w-4" />}
            >
              New Semester
            </Button>
            <Button
              onClick={() => setShowSubjectModal(true)}
              leadingIcon={<Plus className="h-4 w-4" />}
              disabled={!selectedSemesterId}
            >
              Add Subject
            </Button>
          </div>
        }
      />

      {semestersQuery.isError ? (
        <Card className="border-danger/30 bg-danger-soft/40 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-fg" />
            <div>
              <div className="text-sm font-semibold text-foreground">
                Failed to load semesters
              </div>
              <div className="mt-1 text-xs text-foreground-muted">
                {semestersQuery.error?.message || 'Unknown error.'}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {semesters.length === 0 && !semestersQuery.isLoading ? (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="text-base font-semibold text-foreground">No semesters yet</div>
          <div className="mt-1 text-sm text-foreground-muted">
            Create your first semester to start adding subjects, attendance, and internal marks.
          </div>
          <div className="mt-5 flex items-center justify-center">
            <Button onClick={() => setShowSemesterModal(true)} leadingIcon={<Plus className="h-4 w-4" />}>
              Create Semester
            </Button>
          </div>
        </Card>
      ) : null}

      {semesters.length > 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6">
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Total Subjects', value: subjects.length },
              {
                label: 'Modules Completed',
                value: `${subjects.reduce((sum, s) => sum + (s.completed || 0), 0)}/${subjects.reduce(
                  (sum, s) => sum + (s.modules || 0),
                  0
                )}`,
              },
              {
                label: 'Avg Internal',
                value: (() => {
                  const scored = subjects.filter((s) => s.internalMax && s.internalScored != null);
                  if (scored.length === 0) return '—';
                  const pct =
                    scored.reduce((sum, s) => sum + (s.internalScored / s.internalMax) * 100, 0) /
                    scored.length;
                  return `${Math.round(pct)}%`;
                })(),
              },
            ].map((chip) => (
              <div
                key={chip.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-background-subtle px-3 py-1.5 text-sm text-foreground-muted"
              >
                <span className="font-semibold text-foreground">{chip.value}</span>
                {chip.label}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {selectedSemesterId ? (
        subjectsQuery.isError ? (
          <Card className="border-danger/30 bg-danger-soft/40 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-danger-fg" />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Failed to load subjects
                </div>
                <div className="mt-1 text-xs text-foreground-muted">
                  {subjectsQuery.error?.message || 'Unknown error.'}
                </div>
              </div>
            </div>
          </Card>
        ) : subjects.length === 0 && !subjectsQuery.isLoading ? (
          <Card className="p-8 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="text-base font-semibold text-foreground">No subjects in this semester</div>
            <div className="mt-1 text-sm text-foreground-muted">
              Add a subject to start tracking modules, attendance, and marks.
            </div>
            <div className="mt-5 flex items-center justify-center">
              <Button onClick={() => setShowSubjectModal(true)} leadingIcon={<Plus className="h-4 w-4" />}>
                Add Subject
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onViewDetails={() => {
                  setSelectedSubject(subject);
                  setActiveTab('Syllabus');
                }}
              />
            ))}
          </div>
        )
      ) : null}

      <SubjectDrawer
        subject={selectedSubject}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClose={() => setSelectedSubject(null)}
        showToast={showToast}
      />

      {/* Add-Subject modal */}
      <AnimatePresence>
        {showSubjectModal ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Add Subject</h2>
                  <p className="text-sm text-foreground-muted">
                    Create a new subject for {activeSemester ? `Semester ${activeSemester.semesterNumber}` : 'this semester'}.
                  </p>
                </div>
                <button
                  onClick={() => setShowSubjectModal(false)}
                  className="rounded-full p-2 text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSubmitSubject(onAddSubject)} className="mt-6 space-y-4">
                <Input
                  label="Subject name"
                  placeholder="Advanced Algorithms"
                  error={subjectErrors.subjectName?.message}
                  {...registerSubject('subjectName')}
                />
                <Input
                  label="Subject code"
                  placeholder="CSE406"
                  error={subjectErrors.subjectCode?.message}
                  {...registerSubject('subjectCode')}
                />
                <Input
                  label="Total modules"
                  type="number"
                  min={1}
                  placeholder="5"
                  error={subjectErrors.totalModules?.message}
                  {...registerSubject('totalModules', { valueAsNumber: true })}
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowSubjectModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isSubmittingSubject || createSubjectMutation.isPending}
                  >
                    Save Subject
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Create-Semester modal */}
      <AnimatePresence>
        {showSemesterModal ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">New Semester</h2>
                  <p className="text-sm text-foreground-muted">
                    Add a semester to organize subjects, attendance, and marks.
                  </p>
                </div>
                <button
                  onClick={() => setShowSemesterModal(false)}
                  className="rounded-full p-2 text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSubmitSemester(onCreateSemester)} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Semester number"
                    type="number"
                    min={1}
                    placeholder="4"
                    error={semesterErrors.semester_number?.message}
                    {...registerSemester('semester_number', { valueAsNumber: true })}
                  />
                  <Input
                    label="Academic year"
                    placeholder="2025-26"
                    error={semesterErrors.academic_year?.message}
                    {...registerSemester('academic_year')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start date (optional)"
                    type="date"
                    {...registerSemester('start_date')}
                  />
                  <Input
                    label="End date (optional)"
                    type="date"
                    {...registerSemester('end_date')}
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={!!isCurrentChecked}
                    onChange={(e) => setSemesterValue('is_current', e.target.checked)}
                    className="h-4 w-4 rounded border-border-subtle text-brand-600 focus:ring-brand-500"
                  />
                  <span>Set as current semester</span>
                </label>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowSemesterModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isSubmittingSemester || createSemesterMutation.isPending}
                  >
                    Create Semester
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SubjectCard — pure UI. Reads the mapped shape produced by mapSubjectRow.
// ---------------------------------------------------------------------------
function SubjectCard({ subject, onViewDetails }) {
  const pct = subject.modules > 0 ? Math.round((subject.completed / subject.modules) * 100) : 0;
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (pct / 100) * circumference;
  const internalLabel =
    subject.internalMax && subject.internalScored != null
      ? `${subject.internalScored}/${subject.internalMax}`
      : '—';

  return (
    <Card className="p-5 transition-smooth hover:border-[rgba(99,102,241,0.25)] hover:bg-[rgba(255,255,255,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-text-primary">{subject.name}</div>
          <div className="mt-1 text-sm text-text-secondary">{subject.code || '—'}</div>
        </div>
        <div className="relative h-20 w-20 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="30" className="fill-none stroke-[rgba(255,255,255,0.08)]" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r="30"
              className="fill-none stroke-[var(--color-accent)]"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-text-primary">
            {pct}%
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between text-text-secondary">
          <span>Internal marks</span>
          <span className="text-text-primary">{internalLabel}</span>
        </div>
        <div className="flex items-center justify-between text-text-secondary">
          <span>Modules</span>
          <span className="text-text-primary">
            {subject.completed}/{subject.modules}
          </span>
        </div>
      </div>

      <Button className="mt-5 w-full" onClick={onViewDetails}>
        View Details
      </Button>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// SubjectDrawer — full DB-backed panel with three tabs:
//   Syllabus      — modules + topics CRUD, completed_modules auto-update
//   Attendance    — per-day mark/list/delete, summary chips
//   Internal Marks — max + scored, save, % display
//
// Data sources:
//   * subjectsApi.getById(subject.id) → nested modules[*]topics[*]
//   * attendanceApi.getBySubject(subject.id) — used as a separate query
//     instead of relying on the PostgREST `AttendanceRecord(*)` embed,
//     which does not resolve under the case-folded table name.
//   All mutations invalidate the subject query on success so the UI
//   reflects new data. Every error is surfaced as a toast via the same
//   showToast prop the rest of the page uses.
// ---------------------------------------------------------------------------
function SubjectDrawer({ subject, activeTab, setActiveTab, onClose, showToast }) {
  const queryClient = useQueryClient();

  // Subject detail (with nested modules + topics) + attendance list.
  const subjectQuery = useQuery({
    queryKey: ['subject', subject?.id],
    queryFn: () => subjectsApi.getById(subject.id),
    enabled: Boolean(subject?.id),
  });

  const attendanceQuery = useQuery({
    queryKey: ['attendance', 'by-subject', subject?.id],
    queryFn: () => attendanceApi.getBySubject(subject.id),
    enabled: Boolean(subject?.id),
  });

  // ---------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['subject', subject.id] });
    queryClient.invalidateQueries({ queryKey: ['attendance', 'by-subject', subject.id] });
    queryClient.invalidateQueries({ queryKey: ['subjects', 'by-semester'] });
  };

  const addModuleMutation = useMutation({
    mutationFn: ({ subjectId, payload }) => subjectsApi.addModule(subjectId, payload),
    onSuccess: () => {
      invalidate();
      showToast('Module added.', 'success');
    },
    onError: (err) => showToast(err?.message || 'Failed to add module.', 'error'),
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ subjectId, moduleId, payload }) =>
      subjectsApi.updateModule(subjectId, moduleId, payload),
    onSuccess: () => {
      invalidate();
      showToast('Module updated.', 'success');
    },
    onError: (err) => showToast(err?.message || 'Failed to update module.', 'error'),
  });

  const deleteModuleMutation = useMutation({
    mutationFn: ({ subjectId, moduleId }) => subjectsApi.deleteModule(subjectId, moduleId),
    onSuccess: () => {
      invalidate();
      showToast('Module deleted.', 'success');
    },
    onError: (err) => showToast(err?.message || 'Failed to delete module.', 'error'),
  });

  const createTopicMutation = useMutation({
    mutationFn: ({ moduleId, payload }) => subjectsApi.createTopic(moduleId, payload),
    onSuccess: () => {
      invalidate();
      showToast('Topic added.', 'success');
    },
    onError: (err) => showToast(err?.message || 'Failed to add topic.', 'error'),
  });

  const toggleTopicMutation = useMutation({
    mutationFn: ({ subjectId, topicId }) => subjectsApi.toggleTopic(subjectId, topicId),
    onSuccess: () => invalidate(),
    onError: (err) => showToast(err?.message || 'Failed to update topic.', 'error'),
  });

  const updateTopicMutation = useMutation({
    mutationFn: ({ topicId, payload }) => subjectsApi.updateTopic(topicId, payload),
    onSuccess: () => invalidate(),
    onError: (err) => showToast(err?.message || 'Failed to update topic.', 'error'),
  });

  const deleteTopicMutation = useMutation({
    mutationFn: ({ topicId }) => subjectsApi.deleteTopic(topicId),
    onSuccess: () => invalidate(),
    onError: (err) => showToast(err?.message || 'Failed to delete topic.', 'error'),
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ subjectId, payload }) => subjectsApi.update(subjectId, payload),
    onSuccess: () => {
      invalidate();
      showToast('Internal marks saved.', 'success');
    },
    onError: (err) => showToast(err?.message || 'Failed to save marks.', 'error'),
  });

  const markAttendanceMutation = useMutation({
    mutationFn: ({ subjectId, payload }) => attendanceApi.mark(subjectId, payload),
    onSuccess: () => {
      invalidate();
      showToast('Attendance marked.', 'success');
    },
    onError: (err) => showToast(err?.message || 'Failed to mark attendance.', 'error'),
  });

  const removeAttendanceMutation = useMutation({
    mutationFn: ({ recordId }) => attendanceApi.remove(recordId),
    onSuccess: () => {
      invalidate();
      showToast('Attendance record deleted.', 'success');
    },
    onError: (err) => showToast(err?.message || 'Failed to delete record.', 'error'),
  });

  // ---------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------
  const detail = subjectQuery.data || null;
  const modules = Array.isArray(detail?.modules) ? detail.modules : [];
  // Sort modules by order_index then by name.
  const sortedModules = [...modules].sort((a, b) => {
    const ao = a.order_index ?? 0;
    const bo = b.order_index ?? 0;
    if (ao !== bo) return ao - bo;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
  const attendance = attendanceQuery.data || [];

  // Auto-compute completed_modules (count modules whose topics are all done
  // and the module has at least one topic). Replaces the previous
  // local-only "completed" field. We persist it to the DB whenever it
  // changes, so the subject card on the page reflects it without re-render.
  useEffect(() => {
    if (!detail || !subject) return;
    const completed = sortedModules.filter((m) => {
      const topics = Array.isArray(m.topics) ? m.topics : [];
      if (topics.length === 0) return false;
      return topics.every((t) => !!t.is_completed);
    }).length;
    if (completed !== detail.completed_modules) {
      // Fire-and-forget; onError would surface as a toast via the mutation.
      updateSubjectMutation.mutate({
        subjectId: subject.id,
        payload: { completed_modules: completed },
      });
    }
    // We deliberately exclude the mutation from the deps to avoid an infinite
    // loop — the mutation mutates the same key the effect reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.id, sortedModules.map((m) => (m.topics || []).map((t) => t.is_completed).join(',')).join('|')]);

  // ---------------------------------------------------------------------
  // Render
  //
  // Drawer close behaviour:
  //   We use AnimatePresence to play an exit animation, but the
  //   previous spring (x: 420) could damp to a residual offset and
  //   leave a thin vertical strip of the drawer visible — about
  //   35-40% of its width on a typical viewport. That strip still
  //   had `pointer-events: auto`, so the page underneath became
  //   unclickable.
  //
  //   The fix has two parts:
  //     1. Drive exit state explicitly. `isClosing` flips to true the
  //        moment the user clicks the X / backdrop. While true, we
  //        render `pointer-events-none` on the *outer wrapper* so
  //        even the leftover slide strip cannot trap clicks.
  //     2. Use a short, deterministic tween (220ms, ease-out) for
  //        both the slide and the backdrop fade. No spring, so no
  //        residual offset. The wrapper unmounts cleanly once the
  //        AnimatePresence exit completes.
  // ---------------------------------------------------------------------
  const [isClosing, setIsClosing] = useState(false);
  const handleRequestClose = () => {
    if (isClosing) return; // ignore extra clicks during the exit frame
    setIsClosing(true);
    onClose();
  };

  return (
    <AnimatePresence
      onExitComplete={() => setIsClosing(false)}
    >
      {subject ? (
        <motion.div
          key="subject-drawer"
          className={[
            // The outer wrapper is what we mount/unmount as a unit so
            // pointer-events toggling covers the backdrop + the
            // sliding aside in one shot. pointer-events-none on the
            // way out eliminates the "stuck" feeling where the
            // backdrop / leftover strip blocked all clicks.
            'fixed inset-0 z-[70]',
            isClosing ? 'pointer-events-none' : 'pointer-events-auto',
          ].join(' ')}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={handleRequestClose}
          />
          <motion.aside
            initial={{ x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 32, opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-2xl shadow-black/40"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5">
              <div>
                <div className="text-sm uppercase tracking-[0.22em] text-text-secondary">
                  Subject detail
                </div>
                <div className="mt-1 text-2xl font-semibold text-text-primary">{subject.name}</div>
                <div className="mt-1 text-sm text-text-secondary">{subject.code || '—'}</div>
              </div>
              <button
                onClick={handleRequestClose}
                className="rounded-full p-2 text-text-secondary transition-smooth hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-[var(--color-border)] px-5 pt-4">
              <div className="relative flex gap-6 overflow-x-auto">
                {detailTabs.map((tab) => {
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="relative pb-4 text-sm font-medium text-text-secondary transition-smooth hover:text-white"
                    >
                      {tab}
                      {active ? (
                        <motion.span
                          layoutId="detail-tab"
                          className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[var(--color-accent)]"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {subjectQuery.isLoading ? (
                <div className="text-sm text-foreground-muted">Loading subject…</div>
              ) : subjectQuery.isError ? (
                <Card className="border-danger/30 bg-danger-soft/40 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-danger-fg" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        Failed to load subject
                      </div>
                      <div className="mt-1 text-xs text-foreground-muted">
                        {subjectQuery.error?.message || 'Unknown error.'}
                      </div>
                    </div>
                  </div>
                </Card>
              ) : activeTab === 'Syllabus' ? (
                <SyllabusTab
                  subject={detail}
                  modules={sortedModules}
                  onAddModule={(name) =>
                    addModuleMutation.mutate({
                      subjectId: subject.id,
                      payload: { name, order_index: sortedModules.length },
                    })
                  }
                  onUpdateModule={(moduleId, payload) =>
                    updateModuleMutation.mutate({
                      subjectId: subject.id,
                      moduleId,
                      payload,
                    })
                  }
                  onDeleteModule={(moduleId) =>
                    deleteModuleMutation.mutate({ subjectId: subject.id, moduleId })
                  }
                  onAddTopic={(moduleId, name) =>
                    createTopicMutation.mutate({ moduleId, payload: { name } })
                  }
                  onToggleTopic={(topicId) =>
                    toggleTopicMutation.mutate({ subjectId: subject.id, topicId })
                  }
                  onUpdateTopic={(topicId, payload) =>
                    updateTopicMutation.mutate({ topicId, payload })
                  }
                  onDeleteTopic={(topicId) => deleteTopicMutation.mutate({ topicId })}
                />
              ) : activeTab === 'Attendance' ? (
                <AttendanceTab
                  subjectId={subject.id}
                  records={attendance}
                  isLoading={attendanceQuery.isLoading}
                  error={attendanceQuery.error}
                  onMark={(payload) =>
                    markAttendanceMutation.mutate({ subjectId: subject.id, payload })
                  }
                  onDelete={(recordId) => removeAttendanceMutation.mutate({ recordId })}
                />
              ) : activeTab === 'Internal Marks' ? (
                <InternalMarksTab
                  subject={detail}
                  onSave={(payload) =>
                    updateSubjectMutation.mutate({ subjectId: subject.id, payload })
                  }
                />
              ) : null}
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const detailTabs = ['Syllabus', 'Attendance', 'Internal Marks'];

// ---------------------------------------------------------------------------
// Syllabus tab
// ---------------------------------------------------------------------------
function SyllabusTab({
  subject,
  modules,
  onAddModule,
  onUpdateModule,
  onDeleteModule,
  onAddTopic,
  onToggleTopic,
  onUpdateTopic,
  onDeleteTopic,
}) {
  const [newModuleName, setNewModuleName] = useState('');
  const [topicDrafts, setTopicDrafts] = useState({}); // moduleId → string
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleName, setEditingModuleName] = useState('');

  const handleAddModule = (e) => {
    e.preventDefault();
    const name = newModuleName.trim();
    if (!name) return;
    onAddModule(name);
    setNewModuleName('');
  };

  const startEditModule = (m) => {
    setEditingModuleId(m.id);
    setEditingModuleName(m.name || '');
  };

  const commitModuleRename = () => {
    if (!editingModuleId) return;
    const next = editingModuleName.trim();
    if (next) {
      onUpdateModule(editingModuleId, { name: next });
    }
    setEditingModuleId(null);
    setEditingModuleName('');
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleAddModule}
        className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2"
      >
        <Input
          value={newModuleName}
          onChange={(e) => setNewModuleName(e.target.value)}
          placeholder="New module name (e.g. Process Management)"
          className="flex-1"
        />
        <Button type="submit" leadingIcon={<Plus className="h-4 w-4" />}>
          Add module
        </Button>
      </form>

      {modules.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="text-sm font-semibold text-foreground">No modules yet</div>
          <div className="mt-1 text-xs text-foreground-muted">
            Add your first module above to start tracking topics.
          </div>
        </Card>
      ) : (
        <ul className="space-y-3">
          {modules.map((m) => {
            const topics = Array.isArray(m.topics) ? m.topics : [];
            const allDone = topics.length > 0 && topics.every((t) => !!t.is_completed);
            const isEditing = editingModuleId === m.id;
            return (
              <Card key={m.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  {isEditing ? (
                    <Input
                      value={editingModuleName}
                      onChange={(e) => setEditingModuleName(e.target.value)}
                      onBlur={commitModuleRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitModuleRename();
                        }
                        if (e.key === 'Escape') {
                          setEditingModuleId(null);
                          setEditingModuleName('');
                        }
                      }}
                      autoFocus
                      className="flex-1"
                    />
                  ) : (
                    <button
                      onClick={() => startEditModule(m)}
                      className="flex-1 text-left text-sm font-semibold text-foreground"
                    >
                      {m.name || 'Untitled module'}
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    {allDone ? (
                      <Badge tone="success" size="xs">
                        Completed
                      </Badge>
                    ) : null}
                    <button
                      onClick={() => onDeleteModule(m.id)}
                      className="rounded-full p-1.5 text-foreground-muted transition-colors hover:bg-background-muted hover:text-danger-fg"
                      aria-label="Delete module"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <ul className="mt-3 space-y-2">
                  {topics.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => onToggleTopic(t.id)}
                        className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] p-2.5 text-left transition-smooth hover:bg-[rgba(255,255,255,0.05)]"
                      >
                        <span
                          className={[
                            'flex h-5 w-5 items-center justify-center rounded-md border',
                            t.is_completed
                              ? 'border-[var(--color-accent)] bg-[rgba(99,102,241,0.16)] text-[var(--color-accent)]'
                              : 'border-[var(--color-border)] text-transparent',
                          ].join(' ')}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span
                          className={[
                            'flex-1 text-sm',
                            t.is_completed
                              ? 'text-foreground-muted line-through'
                              : 'text-foreground',
                          ].join(' ')}
                        >
                          {t.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTopic(t.id);
                          }}
                          className="rounded-md p-1 text-foreground-muted hover:text-danger-fg"
                          aria-label="Delete topic"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </button>
                    </li>
                  ))}
                </ul>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = (topicDrafts[m.id] || '').trim();
                    if (!v) return;
                    onAddTopic(m.id, v);
                    setTopicDrafts((current) => ({ ...current, [m.id]: '' }));
                  }}
                  className="mt-3 flex items-center gap-2"
                >
                  <Input
                    value={topicDrafts[m.id] || ''}
                    onChange={(e) =>
                      setTopicDrafts((current) => ({ ...current, [m.id]: e.target.value }))
                    }
                    placeholder="Add a topic"
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    leadingIcon={<Plus className="h-3.5 w-3.5" />}
                  >
                    Add
                  </Button>
                </form>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attendance tab
// ---------------------------------------------------------------------------
function AttendanceTab({ subjectId, records, isLoading, error, onMark, onDelete }) {
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [status, setStatus] = useState('PRESENT');

  const handleMark = (e) => {
    e.preventDefault();
    if (!date) return;
    onMark({ date, status });
  };

  // Summary chips
  const counts = records.reduce(
    (acc, r) => {
      const s = (r.status || '').toUpperCase();
      if (s === 'PRESENT') acc.present += 1;
      else if (s === 'ABSENT') acc.absent += 1;
      else if (s === 'CANCELLED') acc.cancelled += 1;
      return acc;
    },
    { present: 0, absent: 0, cancelled: 0 },
  );
  const denom = counts.present + counts.absent;
  const pct = denom === 0 ? 0 : Math.round((counts.present / denom) * 100);

  const sorted = [...records].sort((a, b) => {
    const ad = new Date(a.date).getTime();
    const bd = new Date(b.date).getTime();
    return bd - ad;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Present', value: counts.present, dot: 'bg-success' },
          { label: 'Absent', value: counts.absent, dot: 'bg-danger' },
          { label: 'Cancelled', value: counts.cancelled, dot: 'bg-foreground-subtle' },
          { label: 'Attendance %', value: `${pct}%`, dot: 'bg-brand-500' },
        ].map((chip) => (
          <div
            key={chip.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-background-subtle px-3 py-1.5 text-sm text-foreground-muted"
          >
            <span className={['h-1.5 w-1.5 rounded-full', chip.dot].join(' ')} />
            <span className="font-semibold text-foreground">{chip.value}</span>
            {chip.label}
          </div>
        ))}
      </div>

      <Card className="p-4">
        <div className="text-sm font-semibold text-foreground">Mark attendance</div>
        <div className="mt-1 text-xs text-foreground-muted">
          Re-marking the same date overwrites the previous status for this subject.
        </div>
        <form onSubmit={handleMark} className="mt-3 flex flex-wrap items-end gap-2">
          <Input
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-44"
          >
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
          <Button type="submit" leadingIcon={<Check className="h-4 w-4" />}>
            Mark
          </Button>
        </form>
      </Card>

      {isLoading ? (
        <div className="text-sm text-foreground-muted">Loading attendance…</div>
      ) : error ? (
        <Card className="border-danger/30 bg-danger-soft/40 p-4">
          <div className="text-sm text-foreground">Failed to load attendance: {error.message}</div>
        </Card>
      ) : sorted.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="text-sm font-semibold text-foreground">No records yet</div>
          <div className="mt-1 text-xs text-foreground-muted">
            Mark a date above to start tracking attendance for this subject.
          </div>
        </Card>
      ) : (
        <Card className="p-2">
          <ul className="divide-y divide-border-subtle">
            {sorted.map((r) => {
              const s = (r.status || '').toUpperCase();
              const dotCls =
                s === 'PRESENT'
                  ? 'bg-success'
                  : s === 'ABSENT'
                  ? 'bg-danger'
                  : 'bg-foreground-subtle';
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-2 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className={['h-2.5 w-2.5 rounded-full', dotCls].join(' ')} />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {new Date(r.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-foreground-muted">
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(r.id)}
                    className="rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-background-muted hover:text-danger-fg"
                    aria-label="Delete attendance record"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal Marks tab
// ---------------------------------------------------------------------------
function InternalMarksTab({ subject, onSave }) {
  const [max, setMax] = useState(subject?.internal_max_marks ?? '');
  const [scored, setScored] = useState(subject?.internal_scored ?? '');

  // Re-seed inputs when subject changes.
  useEffect(() => {
    setMax(subject?.internal_max_marks ?? '');
    setScored(subject?.internal_scored ?? '');
  }, [subject?.id, subject?.internal_max_marks, subject?.internal_scored]);

  const maxN = parseFloat(max);
  const scoredN = parseFloat(scored);
  const valid = Number.isFinite(maxN) && Number.isFinite(scoredN) && maxN > 0;
  const pct = valid ? Math.round((scoredN / maxN) * 100) : 0;
  const circumference = 2 * Math.PI * 56;
  const offset = valid ? circumference - (pct / 100) * circumference : circumference;

  const handleSave = (e) => {
    e.preventDefault();
    onSave({
      internal_max_marks: Number.isFinite(maxN) ? maxN : null,
      internal_scored: Number.isFinite(scoredN) ? scoredN : null,
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Max marks"
              min={0}
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder="50"
            />
            <Input
              type="number"
              label="Scored"
              min={0}
              value={scored}
              onChange={(e) => setScored(e.target.value)}
              placeholder="38"
            />
          </div>
          <div className="flex items-center justify-end">
            <Button type="submit" leadingIcon={<Check className="h-4 w-4" />}>
              Save
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-36 w-36">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r="56"
                className="fill-none stroke-[rgba(255,255,255,0.08)]"
                strokeWidth="8"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                className="fill-none stroke-[var(--color-accent)]"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-semibold text-foreground">
                {valid ? `${pct}%` : '—'}
              </div>
              <div className="text-xs text-foreground-muted">
                {valid ? `${scoredN} / ${maxN}` : 'Enter marks'}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default SemesterWorkspacePage;
