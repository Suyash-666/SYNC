import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, useInView } from 'framer-motion';

/**
 * MetricsBar — animated counters on scroll
 */
export const MetricsBar = ({ className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20% 0px' });

  const stats = [
    { label: 'Students', value: 12000, suffix: '+' },
    { label: 'Attendance Accuracy', value: 98, suffix: '%' },
    { label: 'Productivity Increase', value: 3, suffix: 'x' },
    { label: 'Universities', value: 50, suffix: '+' },
  ];

  return (
    <div ref={ref} className={`mx-auto my-12 max-w-6xl px-6 ${className}`}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] px-6 py-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className="flex flex-col">
              <motion.div
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.12 * i, duration: 0.9 }}
                className="text-2xl font-semibold text-text-primary"
              >
                {inView ? (
                  <AnimatedNumber value={s.value} suffix={s.suffix} />
                ) : (
                  `${s.value}${s.suffix}`
                )}
              </motion.div>
              <div className="mt-1 text-sm text-text-secondary">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let raf = null;
    let start = null;
    const duration = 900;
    const from = 0;
    const to = value;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const current = Math.floor(progress * (to - from) + from);
      setDisplay(current);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}{suffix}</>;
}

MetricsBar.propTypes = {
  className: PropTypes.string,
};

export default MetricsBar;
