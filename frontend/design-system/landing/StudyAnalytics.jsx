import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Week 1', hours: 6, attendance: 95 },
  { name: 'Week 2', hours: 8, attendance: 92 },
  { name: 'Week 3', hours: 7, attendance: 97 },
  { name: 'Week 4', hours: 9, attendance: 98 },
  { name: 'Week 5', hours: 8, attendance: 96 },
];

export const StudyAnalytics = ({ className = '' }) => {
  return (
    <section className={`mx-auto my-20 max-w-7xl px-6 ${className}`}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h3 className="text-2xl font-semibold text-text-primary">See Your Progress, Actually</h3>
          <p className="mt-3 text-text-secondary">Study Analytics surfaces trends and helps you make actionable decisions — track attendance, assignment completion, and weekly study hours in one place.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="w-full max-w-lg rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border)] p-4">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip wrapperStyle={{ background: '#0B1020', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }} />
                  <Bar dataKey="hours" fill="rgba(99,102,241,0.85)" barSize={14} radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
              <div>Attendance: <span className="text-text-primary font-medium">96%</span></div>
              <div>Assignments done: <span className="text-text-primary font-medium">87%</span></div>
              <div>Weekly avg: <span className="text-text-primary font-medium">7.6 hrs</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

StudyAnalytics.propTypes = { className: PropTypes.string };
export default StudyAnalytics;
