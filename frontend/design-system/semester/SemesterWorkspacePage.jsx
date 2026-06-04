import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as Icons from 'lucide-react';
const {
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Clock3,
  FileText,
  GraduationCap,
  LayoutGrid,
  LibraryBig,
  PencilLine,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Users,
  X,
  BadgeInfo,
  BadgeMinus,
  BadgeCheck,
  AlertCircle,
  FileUp,
  ListChecks,
  Layers3,
} = Icons;
import { Button, Card, Input, Toast, Badge, PageHeader } from '../components';

const subjectData = [
  {
    name: 'Operating Systems',
    code: 'CSE401',
    completion: 78,
    attendance: 82,
    internal: '34/50',
    modules: 5,
    details: {
      syllabus: [
        {
          name: 'Module 1 · Process Basics',
          topicsDone: 5,
          topicsTotal: 6,
          topics: [
            { label: 'OS overview', done: true },
            { label: 'System calls', done: true },
            { label: 'Kernel vs user mode', done: true },
            { label: 'Boot process', done: true },
            { label: 'Interrupts', done: true },
            { label: 'OS services', done: false },
          ],
        },
        {
          name: 'Module 2 · Process Management',
          topicsDone: 3,
          topicsTotal: 6,
          topics: [
            { label: 'Process states', done: true },
            { label: 'PCB', done: true },
            { label: 'Context switch', done: true },
            { label: 'Schedulers', done: false },
            { label: 'CPU scheduling', done: false },
            { label: 'Scheduling criteria', done: false },
          ],
        },
        {
          name: 'Module 3 · Threads',
          topicsDone: 4,
          topicsTotal: 5,
          topics: [
            { label: 'Thread model', done: true },
            { label: 'Multithreading', done: true },
            { label: 'Benefits', done: true },
            { label: 'User vs kernel threads', done: true },
            { label: 'Thread libraries', done: false },
          ],
        },
        {
          name: 'Module 4 · Synchronization',
          topicsDone: 2,
          topicsTotal: 5,
          topics: [
            { label: 'Critical section', done: true },
            { label: 'Mutex', done: true },
            { label: 'Semaphore', done: false },
            { label: 'Deadlocks', done: false },
            { label: 'Race conditions', done: false },
          ],
        },
        {
          name: 'Module 5 · Memory Management',
          topicsDone: 3,
          topicsTotal: 6,
          topics: [
            { label: 'Paging basics', done: true },
            { label: 'Virtual memory', done: true },
            { label: 'Page replacement', done: true },
            { label: 'Segmentation', done: false },
            { label: 'TLB', done: false },
            { label: 'Thrashing', done: false },
          ],
        },
      ],
      attendance: {
        total: 36,
        present: 29,
        absent: 5,
        calendar: [
          'present', 'present', 'no-class', 'present', 'absent', 'present', 'present',
          'present', 'no-class', 'present', 'present', 'absent', 'present', 'present',
          'no-class', 'present', 'present', 'present', 'absent', 'present', 'present',
          'present', 'present', 'no-class', 'present', 'present', 'absent', 'present',
          'present', 'present', 'no-class', 'present', 'present', 'present', 'absent',
        ],
      },
      internalMarks: [
        { test: 'Internal Test 1', max: 50, scored: 36, date: '12 Feb 2025' },
        { test: 'Internal Test 2', max: 50, scored: 41, date: '03 Mar 2025' },
        { test: 'Internal Test 3', max: 50, scored: 38, date: '27 Mar 2025' },
      ],
      resources: [
        { name: 'OS Module 1 Notes.pdf', size: '2.4 MB', date: '1 day ago' },
        { name: 'Process Scheduling Cheatsheet.pdf', size: '1.1 MB', date: '3 days ago' },
        { name: 'Deadlocks Practice Set.pdf', size: '860 KB', date: '1 week ago' },
      ],
    },
  },
  {
    name: 'Database Systems',
    code: 'CSE402',
    completion: 64,
    attendance: 74,
    internal: '31/50',
    modules: 5,
    details: {
      syllabus: [
        { name: 'Module 1 · Relational Model', topicsDone: 4, topicsTotal: 6, topics: [
          { label: 'Schemas', done: true }, { label: 'Keys', done: true }, { label: 'Relations', done: true }, { label: 'Integrity constraints', done: true }, { label: 'Relational algebra', done: false }, { label: 'Normalization overview', done: false },
        ] },
        { name: 'Module 2 · SQL', topicsDone: 5, topicsTotal: 6, topics: [
          { label: 'DDL', done: true }, { label: 'DML', done: true }, { label: 'Joins', done: true }, { label: 'Nested queries', done: true }, { label: 'Views', done: true }, { label: 'Triggers', done: false },
        ] },
        { name: 'Module 3 · Design', topicsDone: 3, topicsTotal: 5, topics: [
          { label: 'ER model', done: true }, { label: 'Mapping', done: true }, { label: 'Normalization', done: true }, { label: 'FDs', done: false }, { label: 'BCNF', done: false },
        ] },
        { name: 'Module 4 · Transactions', topicsDone: 2, topicsTotal: 5, topics: [
          { label: 'ACID', done: true }, { label: 'Concurrency', done: true }, { label: 'Locking', done: false }, { label: 'Recovery', done: false }, { label: 'Deadlock handling', done: false },
        ] },
        { name: 'Module 5 · Storage', topicsDone: 1, topicsTotal: 4, topics: [
          { label: 'Indexes', done: true }, { label: 'Hashing', done: false }, { label: 'File organization', done: false }, { label: 'Query optimization', done: false },
        ] },
      ],
      attendance: { total: 32, present: 24, absent: 6, calendar: Array(35).fill('present').map((v, i) => (i % 7 === 2 ? 'absent' : i % 9 === 0 ? 'no-class' : v)) },
      internalMarks: [
        { test: 'Internal Test 1', max: 50, scored: 33, date: '14 Feb 2025' },
        { test: 'Internal Test 2', max: 50, scored: 29, date: '06 Mar 2025' },
        { test: 'Internal Test 3', max: 50, scored: 31, date: '29 Mar 2025' },
      ],
      resources: [
        { name: 'DBMS SQL Practice.pdf', size: '1.8 MB', date: '2 days ago' },
        { name: 'Normalization Notes.pdf', size: '910 KB', date: '5 days ago' },
        { name: 'ER Diagram Problems.pdf', size: '1.4 MB', date: '1 week ago' },
      ],
    },
  },
  {
    name: 'Computer Networks',
    code: 'CSE403',
    completion: 57,
    attendance: 68,
    internal: '28/50',
    modules: 5,
    details: {
      syllabus: [
        { name: 'Module 1 · Layers', topicsDone: 3, topicsTotal: 5, topics: [
          { label: 'Network basics', done: true }, { label: 'OSI model', done: true }, { label: 'TCP/IP model', done: true }, { label: 'Protocol stack', done: false }, { label: 'Encapsulation', done: false },
        ] },
        { name: 'Module 2 · Physical Layer', topicsDone: 2, topicsTotal: 5, topics: [
          { label: 'Signals', done: true }, { label: 'Transmission', done: true }, { label: 'Multiplexing', done: false }, { label: 'Media', done: false }, { label: 'Modulation', done: false },
        ] },
        { name: 'Module 3 · Data Link', topicsDone: 2, topicsTotal: 6, topics: [
          { label: 'Framing', done: true }, { label: 'Error control', done: true }, { label: 'Flow control', done: false }, { label: 'MAC', done: false }, { label: 'Switching', done: false }, { label: 'ARP', done: false },
        ] },
        { name: 'Module 4 · Transport', topicsDone: 3, topicsTotal: 5, topics: [
          { label: 'UDP', done: true }, { label: 'TCP', done: true }, { label: 'Congestion control', done: true }, { label: 'Flow control', done: false }, { label: 'Sockets', done: false },
        ] },
        { name: 'Module 5 · Application', topicsDone: 2, topicsTotal: 5, topics: [
          { label: 'DNS', done: true }, { label: 'HTTP', done: true }, { label: 'SMTP', done: false }, { label: 'FTP', done: false }, { label: 'Security', done: false },
        ] },
      ],
      attendance: { total: 30, present: 20, absent: 7, calendar: Array(35).fill('present').map((v, i) => (i % 6 === 1 ? 'absent' : i % 8 === 0 ? 'no-class' : v)) },
      internalMarks: [
        { test: 'Internal Test 1', max: 50, scored: 30, date: '10 Feb 2025' },
        { test: 'Internal Test 2', max: 50, scored: 26, date: '04 Mar 2025' },
        { test: 'Internal Test 3', max: 50, scored: 32, date: '26 Mar 2025' },
      ],
      resources: [
        { name: 'CN Protocol Stack.pdf', size: '1.7 MB', date: '2 days ago' },
        { name: 'Subnetting Cheatsheet.pdf', size: '830 KB', date: '5 days ago' },
        { name: 'TCP UDP Comparison.pdf', size: '1.2 MB', date: '1 week ago' },
      ],
    },
  },
  {
    name: 'Algorithms',
    code: 'CSE404',
    completion: 71,
    attendance: 76,
    internal: '37/50',
    modules: 5,
    details: {
      syllabus: [
        { name: 'Module 1 · Complexity', topicsDone: 4, topicsTotal: 5, topics: [
          { label: 'Asymptotic notation', done: true }, { label: 'Best case', done: true }, { label: 'Average case', done: true }, { label: 'Worst case', done: true }, { label: 'Recurrences', done: false },
        ] },
        { name: 'Module 2 · Sorting', topicsDone: 4, topicsTotal: 6, topics: [
          { label: 'Bubble sort', done: true }, { label: 'Selection sort', done: true }, { label: 'Insertion sort', done: true }, { label: 'Merge sort', done: true }, { label: 'Quick sort', done: false }, { label: 'Heap sort', done: false },
        ] },
        { name: 'Module 3 · Trees', topicsDone: 3, topicsTotal: 6, topics: [
          { label: 'BST', done: true }, { label: 'Traversals', done: true }, { label: 'AVL trees', done: true }, { label: 'B trees', done: false }, { label: 'Heaps', done: false }, { label: 'Tries', done: false },
        ] },
        { name: 'Module 4 · Graphs', topicsDone: 3, topicsTotal: 5, topics: [
          { label: 'BFS', done: true }, { label: 'DFS', done: true }, { label: 'Shortest paths', done: true }, { label: 'MST', done: false }, { label: 'Topological sort', done: false },
        ] },
        { name: 'Module 5 · Greedy & DP', topicsDone: 2, topicsTotal: 5, topics: [
          { label: 'Greedy basics', done: true }, { label: 'Knapsack', done: true }, { label: 'LCS', done: false }, { label: 'Matrix chain', done: false }, { label: 'Subset sum', done: false },
        ] },
      ],
      attendance: { total: 34, present: 26, absent: 5, calendar: Array(35).fill('present').map((v, i) => (i % 5 === 0 ? 'absent' : i % 10 === 0 ? 'no-class' : v)) },
      internalMarks: [
        { test: 'Internal Test 1', max: 50, scored: 40, date: '11 Feb 2025' },
        { test: 'Internal Test 2', max: 50, scored: 35, date: '07 Mar 2025' },
        { test: 'Internal Test 3', max: 50, scored: 36, date: '30 Mar 2025' },
      ],
      resources: [
        { name: 'Algorithms Notes.pdf', size: '2.0 MB', date: 'Yesterday' },
        { name: 'Sorting Problems.pdf', size: '1.1 MB', date: '4 days ago' },
        { name: 'Graph Algorithms Guide.pdf', size: '1.5 MB', date: '1 week ago' },
      ],
    },
  },
  {
    name: 'Software Engineering',
    code: 'CSE406',
    completion: 69,
    attendance: 73,
    internal: '35/50',
    modules: 5,
    details: {
      syllabus: [
        { name: 'Module 1 · Product Thinking', topicsDone: 3, topicsTotal: 5, topics: [
          { label: 'Requirements', done: true }, { label: 'User stories', done: true }, { label: 'Scope', done: true }, { label: 'Stakeholders', done: false }, { label: 'Roadmaps', done: false },
        ] },
        { name: 'Module 2 · Design', topicsDone: 2, topicsTotal: 5, topics: [
          { label: 'UML', done: true }, { label: 'Architecture', done: true }, { label: 'Patterns', done: false }, { label: 'Refactoring', done: false }, { label: 'Trade-offs', done: false },
        ] },
        { name: 'Module 3 · Testing', topicsDone: 4, topicsTotal: 5, topics: [
          { label: 'Unit tests', done: true }, { label: 'Integration tests', done: true }, { label: 'Regression', done: true }, { label: 'TDD', done: true }, { label: 'Mocking', done: false },
        ] },
        { name: 'Module 4 · Delivery', topicsDone: 2, topicsTotal: 5, topics: [
          { label: 'CI/CD', done: true }, { label: 'Versioning', done: true }, { label: 'Deployments', done: false }, { label: 'Monitoring', done: false }, { label: 'Rollbacks', done: false },
        ] },
        { name: 'Module 5 · Maintenance', topicsDone: 1, topicsTotal: 4, topics: [
          { label: 'Bug triage', done: true }, { label: 'Technical debt', done: false }, { label: 'Documentation', done: false }, { label: 'Support', done: false },
        ] },
      ],
      attendance: { total: 31, present: 23, absent: 6, calendar: Array(35).fill('present').map((v, i) => (i % 6 === 2 ? 'absent' : i % 11 === 0 ? 'no-class' : v)) },
      internalMarks: [
        { test: 'Internal Test 1', max: 50, scored: 37, date: '09 Feb 2025' },
        { test: 'Internal Test 2', max: 50, scored: 35, date: '05 Mar 2025' },
        { test: 'Internal Test 3', max: 50, scored: 34, date: '31 Mar 2025' },
      ],
      resources: [
        { name: 'SE Case Study.pdf', size: '1.3 MB', date: '2 days ago' },
        { name: 'Testing Notes.pdf', size: '900 KB', date: '6 days ago' },
        { name: 'CI CD Guide.pdf', size: '1.0 MB', date: '1 week ago' },
      ],
    },
  },
  {
    name: 'Machine Learning', code: 'CSE405', completion: 49, attendance: 63, internal: '25/50', modules: 5, details: {
      syllabus: [], attendance: { total: 28, present: 17, absent: 8, calendar: Array(35).fill('present') }, internalMarks: [], resources: [] } },
  {
    name: 'Communication Skills', code: 'HSS201', completion: 84, attendance: 91, internal: '40/50', modules: 4, details: {
      syllabus: [], attendance: { total: 24, present: 22, absent: 1, calendar: Array(35).fill('present') }, internalMarks: [], resources: [] } },
];

const detailTabs = ['Syllabus', 'Attendance', 'Internal Marks', 'Resources'];

const addSubjectSchema = z.object({
  subjectName: z.string().min(1, 'Subject name is required.'),
  subjectCode: z.string().min(1, 'Subject code is required.'),
  totalModules: z.coerce.number().int().min(1, 'Enter a valid module count.'),
});

export const SemesterWorkspacePage = () => {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [activeTab, setActiveTab] = useState('Syllabus');
  const [toast, setToast] = useState({ open: false, message: '' });
  const [showModal, setShowModal] = useState(false);
  const [subjects, setSubjects] = useState(subjectData);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(addSubjectSchema),
    defaultValues: { subjectName: '', subjectCode: '', totalModules: 5 },
  });

  const closeToast = () => setToast({ open: false, message: '' });

  const openToast = (message) => setToast({ open: true, message });

  const onAddSubject = (values) => {
    const newSubject = {
      name: values.subjectName,
      code: values.subjectCode,
      completion: 0,
      attendance: 0,
      internal: '0/50',
      modules: values.totalModules,
      details: {
        syllabus: Array.from({ length: values.totalModules }, (_, index) => ({
          name: `Module ${index + 1}`,
          topicsDone: 0,
          topicsTotal: 5,
          topics: Array.from({ length: 5 }, (_, topicIndex) => ({ label: `Topic ${topicIndex + 1}`, done: false })),
        })),
        attendance: { total: 0, present: 0, absent: 0, calendar: Array(35).fill('no-class') },
        internalMarks: [],
        resources: [],
      },
    };
    setSubjects((current) => [newSubject, ...current]);
    setSelectedSubject(newSubject);
    setShowModal(false);
    reset();
    openToast('Subject added successfully.');
  };

  return (
    <div className="space-y-6">
      <Toast open={toast.open} onClose={closeToast} duration={2200} message={toast.message} />

      <PageHeader
        eyebrow="Semester 4 · B.Tech CSE · 2024-25"
        title="Semester workspace"
        description="Track syllabus completion, internal marks, attendance, and resources from one organized command center."
        actions={
          <Button onClick={() => setShowModal(true)} leadingIcon={<Plus className="h-4 w-4" />}>
            Add Subject
          </Button>
        }
      />

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Total Subjects',     value: '6'    },
            { label: 'Modules Completed',  value: '14/42' },
            { label: 'Avg Internal',       value: '76%'  },
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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {subjects.map((subject) => (
          <SubjectCard key={subject.code} subject={subject} onViewDetails={() => { setSelectedSubject(subject); setActiveTab('Syllabus'); }} />
        ))}
      </div>

      <SubjectDrawer subject={selectedSubject} activeTab={activeTab} setActiveTab={setActiveTab} onClose={() => setSelectedSubject(null)} />

      <AnimatePresence>
        {showModal ? (
          <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.98 }} className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Add Subject</h2>
                  <p className="text-sm text-foreground-muted">Create a new subject shell for semester tracking.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="rounded-full p-2 text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onAddSubject)} className="mt-6 space-y-4">
                <Input label="Subject name" placeholder="Advanced Algorithms" error={errors.subjectName?.message} {...register('subjectName')} />
                <Input label="Subject code" placeholder="CSE406" error={errors.subjectCode?.message} {...register('subjectCode')} />
                <Input label="Total modules" type="number" min={1} placeholder="5" error={errors.totalModules?.message} {...register('totalModules', { valueAsNumber: true })} />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" isLoading={isSubmitting}>Save Subject</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

function SubjectCard({ subject, onViewDetails }) {
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (subject.completion / 100) * circumference;
  const attendanceTone = subject.attendance >= 75 ? 'text-[var(--color-success)]' : subject.attendance >= 65 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]';

  return (
    <Card className="p-5 transition-smooth hover:border-[rgba(99,102,241,0.25)] hover:bg-[rgba(255,255,255,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-text-primary">{subject.name}</div>
          <div className="mt-1 text-sm text-text-secondary">{subject.code}</div>
        </div>
        <div className="relative h-20 w-20 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="30" className="fill-none stroke-[rgba(255,255,255,0.08)]" strokeWidth="6" />
            <circle cx="40" cy="40" r="30" className="fill-none stroke-[var(--color-accent)]" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-text-primary">{subject.completion}%</div>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Attendance</span>
          <span className={`font-medium ${attendanceTone}`}>{subject.attendance}%</span>
        </div>
        <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)]">
          <div className={`h-2 rounded-full ${subject.attendance >= 75 ? 'bg-[var(--color-success)]' : subject.attendance >= 65 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-danger)]'}`} style={{ width: `${subject.attendance}%` }} />
        </div>
        <div className="flex items-center justify-between text-text-secondary">
          <span>Internal marks</span>
          <span className="text-text-primary">{subject.internal}</span>
        </div>
        <div className="flex items-center justify-between text-text-secondary">
          <span>Modules</span>
          <span className="text-text-primary">{subject.modules}</span>
        </div>
      </div>

      <Button className="mt-5 w-full" onClick={onViewDetails}>
        View Details
      </Button>
    </Card>
  );
}

function SubjectDrawer({ subject, activeTab, setActiveTab, onClose }) {
  return (
    <AnimatePresence>
      {subject ? (
        <>
          <motion.div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ type: 'spring', stiffness: 240, damping: 28 }} className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-xl flex-col border-l border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5">
              <div>
                <div className="text-sm uppercase tracking-[0.22em] text-text-secondary">Subject detail</div>
                <div className="mt-1 text-2xl font-semibold text-text-primary">{subject.name}</div>
                <div className="mt-1 text-sm text-text-secondary">{subject.code}</div>
              </div>
              <button onClick={onClose} className="rounded-full p-2 text-text-secondary transition-smooth hover:bg-[rgba(255,255,255,0.05)] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-[var(--color-border)] px-5 pt-4">
              <div className="relative flex gap-6 overflow-x-auto">
                {detailTabs.map((tab) => {
                  const active = activeTab === tab;
                  return (
                    <button key={tab} onClick={() => setActiveTab(tab)} className="relative pb-4 text-sm font-medium text-text-secondary transition-smooth hover:text-white">
                      {tab}
                      {active ? <motion.span layoutId="detail-tab" className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[var(--color-accent)]" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.22 }}>
                  {activeTab === 'Syllabus' ? <SyllabusPanel subject={subject} /> : null}
                  {activeTab === 'Attendance' ? <AttendancePanel subject={subject} /> : null}
                  {activeTab === 'Internal Marks' ? <InternalMarksPanel subject={subject} /> : null}
                  {activeTab === 'Resources' ? <ResourcesPanel /> : null}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function SyllabusPanel({ subject }) {
  const [openModule, setOpenModule] = useState(0);
  const [modules, setModules] = useState(() => subject.details.syllabus);

  useEffect(() => {
    setModules(subject.details.syllabus);
    setOpenModule(0);
  }, [subject]);

  const toggleTopic = (moduleIndex, topicIndex) => {
    setModules((current) => current.map((module, currentIndex) => {
      if (currentIndex !== moduleIndex) return module;
      const nextTopics = module.topics.map((topic, currentTopicIndex) => (
        currentTopicIndex === topicIndex ? { ...topic, done: !topic.done } : topic
      ));
      const topicsDone = nextTopics.filter((topic) => topic.done).length;
      return {
        ...module,
        topics: nextTopics,
        topicsDone,
      };
    }));
  };

  return (
    <div className="space-y-4">
      {modules.map((module, index) => {
        const expanded = openModule === index;
        const progress = Math.round((module.topicsDone / module.topicsTotal) * 100);
        return (
          <Card key={module.name} className="overflow-hidden p-0">
            <button
              onClick={() => setOpenModule(expanded ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left transition-smooth hover:bg-[rgba(255,255,255,0.03)]"
            >
              <div>
                <div className="text-sm font-semibold text-text-primary">{module.name}</div>
                <div className="mt-1 text-xs text-text-secondary">{module.topicsDone}/{module.topicsTotal} topics done</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block h-2 w-32 rounded-full bg-[rgba(255,255,255,0.06)]">
                  <div className="h-2 rounded-full bg-[var(--color-accent)]" style={{ width: `${progress}%` }} />
                </div>
                <ChevronDown className={`h-4 w-4 text-text-secondary transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden border-t border-[var(--color-border)]">
                  <div className="space-y-3 p-4">
                    {module.topics.map((topic, topicIndex) => (
                      <button
                        key={topic.label}
                        type="button"
                        onClick={() => toggleTopic(index, topicIndex)}
                        className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] p-3 text-left transition-smooth hover:bg-[rgba(255,255,255,0.05)]"
                      >
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${topic.done ? 'border-[var(--color-accent)] bg-[rgba(99,102,241,0.16)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-transparent'}`}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className={`flex-1 text-sm ${topic.done ? 'text-text-secondary line-through' : 'text-text-primary'}`}>{topic.label}</span>
                        {topic.done ? <Check className="h-4 w-4 text-[var(--color-accent)]" /> : null}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}

function AttendancePanel({ subject }) {
  const { total, present, absent, calendar } = subject.details.attendance;
  const current = Math.round((present / total) * 100);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total classes', value: total },
          { label: 'Present', value: present },
          { label: 'Absent', value: absent },
          { label: 'Current %', value: `${current}%` },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-text-secondary">{stat.label}</div>
            <div className="mt-2 text-2xl font-semibold text-text-primary">{stat.value}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-text-primary">Current month</div>
            <div className="text-xs text-text-secondary">Green = present · Red = absent · Gray = no class</div>
          </div>
          <CalendarDays className="h-4 w-4 text-text-secondary" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => (
            <div key={`${day}-${index}`} className="text-center text-[11px] text-text-secondary">{day}</div>
          ))}
          {calendar.map((status, index) => {
            const color = status === 'present' ? 'bg-[rgba(34,197,94,0.65)]' : status === 'absent' ? 'bg-[rgba(239,68,68,0.65)]' : 'bg-[rgba(255,255,255,0.06)]';
            return <div key={index} className={`aspect-square rounded-md border border-[var(--color-border)] ${color}`} />;
          })}
        </div>
      </Card>
    </div>
  );
}

function InternalMarksPanel({ subject }) {
  const rows = subject.details.internalMarks;
  const average = rows.length ? rows.reduce((sum, row) => sum + (row.scored / row.max) * 100, 0) / rows.length : 0;

  return (
    <Card className="p-4">
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[rgba(255,255,255,0.03)] text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Test Name</th>
              <th className="px-4 py-3 font-medium">Max Marks</th>
              <th className="px-4 py-3 font-medium">Scored</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const pct = (row.scored / row.max) * 100;
              const tone = pct >= 70 ? 'text-[var(--color-success)]' : pct >= 50 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]';
              return (
                <tr key={row.test} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 text-text-primary">{row.test}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.max}</td>
                  <td className={`px-4 py-3 font-semibold ${tone}`}>{row.scored}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.date}</td>
                </tr>
              );
            })}
            <tr className="border-t border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] font-semibold">
              <td className="px-4 py-3 text-text-primary">Average</td>
              <td className="px-4 py-3 text-text-secondary">—</td>
              <td className={`px-4 py-3 ${average >= 70 ? 'text-[var(--color-success)]' : average >= 50 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}`}>{average.toFixed(1)}%</td>
              <td className="px-4 py-3 text-text-secondary">Current term</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ResourcesPanel() {
  const resources = [
    { name: 'Subject overview.pdf', size: '2.4 MB', date: 'Today' },
    { name: 'Syllabus tracker.docx', size: '860 KB', date: '2 days ago' },
    { name: 'Revision checklist.pdf', size: '1.2 MB', date: '1 week ago' },
  ];
  const [showToast, setShowToast] = useState(false);

  return (
    <>
      <Toast open={showToast} onClose={() => setShowToast(false)} duration={2200}>Upload feature coming soon</Toast>
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-text-primary">Resources</div>
            <div className="text-xs text-text-secondary">Uploaded notes, PDFs, and study assets.</div>
          </div>
          <Button onClick={() => setShowToast(true)}>
            <Upload className="mr-2 h-4 w-4" /> Upload Resource
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {resources.map((resource) => (
            <div key={resource.name} className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] p-4 transition-smooth hover:bg-[rgba(255,255,255,0.05)]">
              <div className="rounded-xl bg-[rgba(99,102,241,0.12)] p-2 text-[var(--color-accent)]">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-primary">{resource.name}</div>
                <div className="mt-1 text-xs text-text-secondary">{resource.size} · {resource.date}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function BriefcaseIcon(props) {
  return <LayoutGrid {...props} />;
}

export default SemesterWorkspacePage;
