import React from 'react';
import PropTypes from 'prop-types';
import * as Icons from 'lucide-react';
const { Check } = Icons;
import { motion } from 'framer-motion';

export const OnboardingProgress = ({ step, labels }) => {
  const progressWidth = labels.length <= 1 ? 0 : ((step - 1) / (labels.length - 1)) * 100;

  return (
    <div className="w-full">
      <div className="relative mb-5">
        <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-[rgba(255,255,255,0.06)]" />
        <motion.div
          className="absolute left-0 top-4 h-1 rounded-full bg-[var(--color-accent)]"
          initial={false}
          animate={{ width: `${progressWidth}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 22 }}
        />

        <div className="relative grid grid-cols-5 gap-2">
          {labels.map((label, index) => {
            const number = index + 1;
            const completed = step > number;
            const active = step === number;

            return (
              <div key={label} className="flex flex-col items-center text-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: active ? 1.08 : 1,
                    backgroundColor: active || completed ? 'rgba(99,102,241,1)' : 'rgba(255,255,255,0.06)',
                    borderColor: active || completed ? 'rgba(99,102,241,1)' : 'rgba(255,255,255,0.08)',
                  }}
                  transition={{ duration: 0.2 }}
                  className="z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold text-white"
                >
                  {completed ? <Check className="h-4 w-4" /> : number}
                </motion.div>
                <div className={`mt-3 text-[11px] leading-4 ${active ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

OnboardingProgress.propTypes = {
  step: PropTypes.number.isRequired,
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default OnboardingProgress;
