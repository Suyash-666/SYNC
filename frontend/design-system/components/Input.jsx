import React, { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

/**
 * Input — premium text input with floating label + icons + states.
 *
 * Design decisions:
 *   • Single component handles `type="text" | "email" | "password" | "number" | "date" | "search"`.
 *     For multiline we still expose the `as="textarea"` polymorphism.
 *   • Floating label: the label sits inside the input as placeholder, then
 *     "floats" up once the field has value or focus. The label shrinks and
 *     tints brand color when focused — a familiar, accessible pattern.
 *   • `leftIcon` and `rightIcon` slots. The right slot is also used for the
 *     password reveal toggle (a common UX request, not a per-page rebuild).
 *   • Error and success states share a `state` prop. Error text uses the
 *     `danger-fg` token, success uses `success-fg` — never raw `red-500`.
 *   • Focus ring is a 2px brand-500/40 ring with a 2px offset. It is visible
 *     on every background (light, dark, glass) because it sits on
 *     `ring-offset-background`.
 *   • We don't change border thickness on focus (some designs make it 2px) —
 *     we change border color and add a ring. Thickness changes cause a 1px
 *     layout shift on every focus, which looks cheap.
 */
const baseField =
  'peer w-full rounded-md border bg-surface text-sm text-foreground placeholder-transparent ' +
  'transition-all duration-150 ' +
  'focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/50 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-background-muted';

const stateBorderMap = {
  default: 'border-border hover:border-border-strong',
  error:   'border-danger focus:border-danger focus:ring-danger/30',
  success: 'border-success focus:border-success focus:ring-success/30',
};

const labelColorMap = {
  default: 'peer-focus:text-foreground peer-[&:not(:placeholder-shown)]:text-foreground-muted',
  error:   'peer-focus:text-danger peer-[&:not(:placeholder-shown)]:text-danger',
  success: 'peer-focus:text-success peer-[&:not(:placeholder-shown)]:text-success',
};

export const Input = React.forwardRef(function Input(
  {
    label,
    helperText,
    error,
    success,
    state,
    leftIcon,
    rightIcon,
    type = 'text',
    as: Tag = 'input',
    rows = 4,
    className = '',
    inputClassName = '',
    id,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const fieldId = id || autoId;
  const [revealPassword, setRevealPassword] = useState(false);
  const isPassword = type === 'password';
  const isTextarea = Tag === 'textarea';
  const resolvedType = isPassword && revealPassword ? 'text' : type;

  // Effective visual state
  const resolvedState = error ? 'error' : success ? 'success' : state || 'default';
  const helpMessage = error || success || helperText;

  return (
    <div className={['w-full', className].join(' ')}>
      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle">
            {leftIcon}
          </span>
        ) : null}

        {isTextarea ? (
          <Tag
            id={fieldId}
            ref={ref}
            rows={rows}
            placeholder=" "
            className={[
              baseField,
              stateBorderMap[resolvedState],
              leftIcon ? 'pl-10' : 'pl-3.5',
              rightIcon || isPassword ? 'pr-10' : 'pr-3.5',
              'pt-5 pb-2 min-h-[88px] resize-y',
              inputClassName,
            ].join(' ')}
            {...props}
          />
        ) : (
          <Tag
            id={fieldId}
            ref={ref}
            type={resolvedType}
            placeholder=" "
            className={[
              baseField,
              'h-11',
              stateBorderMap[resolvedState],
              leftIcon ? 'pl-10' : 'pl-3.5',
              rightIcon || isPassword ? 'pr-10' : 'pr-3.5',
              label ? 'pt-4 pb-1.5' : '',
              inputClassName,
            ].join(' ')}
            {...props}
          />
        )}

        {label ? (
          <label
            htmlFor={fieldId}
            className={[
              'pointer-events-none absolute left-3.5 top-3.5 text-sm text-foreground-muted',
              'transition-all duration-150 origin-left',
              'peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:translate-y-0',
              'peer-focus:top-1.5 peer-focus:text-2xs peer-focus:font-semibold peer-focus:translate-y-0',
              'peer-[&:not(:placeholder-shown)]:top-1.5 peer-[&:not(:placeholder-shown)]:text-2xs peer-[&:not(:placeholder-shown)]:font-semibold',
              leftIcon ? 'peer-placeholder-shown:left-10 peer-focus:left-3.5' : '',
              labelColorMap[resolvedState],
            ].join(' ')}
          >
            {label}
          </label>
        ) : null}

        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealPassword((v) => !v)}
            aria-label={revealPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-foreground-subtle transition-colors hover:bg-background-muted hover:text-foreground"
          >
            {revealPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : rightIcon ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle">
            {rightIcon}
          </span>
        ) : null}
      </div>

      {helpMessage ? (
        <p
          className={[
            'mt-1.5 flex items-center gap-1.5 text-xs',
            error
              ? 'text-danger-fg'
              : success
              ? 'text-success-fg'
              : 'text-foreground-subtle',
          ].join(' ')}
          role={error ? 'alert' : undefined}
        >
          {error ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : success ? (
            <Check className="h-3.5 w-3.5" />
          ) : null}
          {helpMessage}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
Input.propTypes = {
  label: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.string,
  success: PropTypes.string,
  state: PropTypes.oneOf(['default', 'error', 'success']),
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  type: PropTypes.string,
  as: PropTypes.elementType,
  rows: PropTypes.number,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  id: PropTypes.string,
};

/**
 * Select — native <select> styled to match Input.
 *
 * Why a native select? Custom popovers are great for max control but they
 * lose keyboard nav, screen-reader behavior, and mobile wheel pickers.
 * For an academic platform, accessibility outweighs visual flair, so we
 * style the native control.
 */
export const Select = React.forwardRef(function Select(
  {
    label,
    helperText,
    error,
    children,
    className = '',
    id,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const fieldId = id || autoId;
  const state = error ? 'error' : 'default';
  return (
    <div className={['w-full', className].join(' ')}>
      <div className="relative">
        <select
          id={fieldId}
          ref={ref}
          className={[
            'h-11 w-full appearance-none rounded-md border bg-surface pl-3.5 pr-9 text-sm text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/50',
            stateBorderMap[state],
            'transition-all duration-150',
            label ? 'pt-4 pb-1.5' : '',
          ].join(' ')}
          {...props}
        >
          {children}
        </select>
        {label ? (
          <label
            htmlFor={fieldId}
            className="pointer-events-none absolute left-3.5 top-1.5 text-2xs font-semibold text-foreground-muted"
          >
            {label}
          </label>
        ) : null}
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {helperText || error ? (
        <p
          className={[
            'mt-1.5 text-xs',
            error ? 'text-danger-fg' : 'text-foreground-subtle',
          ].join(' ')}
        >
          {error || helperText}
        </p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
Select.propTypes = {
  label: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string,
  children: PropTypes.node,
};
