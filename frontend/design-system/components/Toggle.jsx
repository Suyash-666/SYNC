import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Toggle — accessible on/off switch.
 *
 * Design decisions:
 *   • Internally a controlled/uncontrolled <input type="checkbox"> with a
 *     visual switch on top. Using a real checkbox means the same component
 *     is keyboard-navigable and screen-reader friendly for free.
 *   • The thumb is a 16px circle that slides 18px when on. The track is
 *     brand-500 when on, surface-muted when off.
 *   • Disabled state halves the opacity and removes the cursor affordance.
 *   • `size` knob for compact uses (settings rows vs inline filters).
 */
const sizeMap = {
  sm: { track: 'h-5 w-9', thumb: 'h-4 w-4', translate: 'translate-x-4' },
  md: { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: 'translate-x-5' },
};

export function Toggle({
  checked: controlled,
  defaultChecked = false,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
  ...props
}) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState(defaultChecked);
  const value = isControlled ? controlled : internal;

  const sizing = sizeMap[size] || sizeMap.md;

  return (
    <label className={['relative inline-flex cursor-pointer items-center', disabled && 'cursor-not-allowed opacity-50', className].filter(Boolean).join(' ')}>
      <input
        type="checkbox"
        className="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        checked={value}
        onChange={(e) => {
          if (!isControlled) setInternal(e.target.checked);
          onChange?.(e.target.checked, e);
        }}
        disabled={disabled}
        {...props}
      />
      <span
        aria-hidden
        className={[
          'inline-flex items-center rounded-full bg-background-muted transition-colors',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
          'peer-checked:bg-brand-500',
          sizing.track,
        ].join(' ')}
      >
        <span
          className={[
            'inline-block translate-x-0.5 rounded-full bg-white shadow-sm transition-transform',
            'peer-checked:translate-x-[calc(100%-2px)]',
            sizing.thumb,
          ].join(' ')}
        />
      </span>
    </label>
  );
}

Toggle.displayName = 'Toggle';
Toggle.propTypes = {
  checked: PropTypes.bool,
  defaultChecked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md']),
  className: PropTypes.string,
};

export default Toggle;
