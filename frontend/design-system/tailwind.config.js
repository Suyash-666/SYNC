/**
 * SYNC Design System — Tailwind config
 * --------------------------------------------------------------------------
 * Light-first token system with dark-mode hooks.
 * - Inter (body) + Outfit (display/headings) — loaded from globals.css
 * - 12–20px border-radius scale
 * - Soft, layered shadow system
 * - Semantic color scale (primary / accent / success / warning / danger / info)
 * - Motion tokens (durations + easings)
 *
 * Why this config?
 *   • Tailwind's `colors` object maps to CSS variables so we can switch theme
 *     by re-defining variables on a wrapper (`<html data-theme="dark">`).
 *   • Shadows use rgba directly so they look correct on both light and dark
 *     surfaces. Pre-defined, named scales (xs … 2xl) keep card depth consistent
 *     across the app — we never want ad-hoc drop-shadows in component files.
 *   • Custom keyframes (`fadeUp`, `shimmer`) let the same animation be used
 *     inside framer-motion variants or in pure CSS.
 */

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './*.{js,jsx,ts,tsx}',
    './*/*.{js,jsx,ts,tsx}',
    './*/*/*.{js,jsx,ts,tsx}',
  ],
  // We deliberately do NOT include `./globals.css` in the content scan:
  // if we did, Tailwind would auto-generate utilities for every
  // `bg-[rgba(...)]` literal that appears in the file, and those
  // auto-generated rules would override the `@layer utilities` aliases we
  // added (which map the legacy dark-tint classes to the new HSL tokens).
  // By keeping globals.css out of content, the legacy class definitions
  // in `@layer utilities` are the only ones emitted.
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // Surface scale — used for backgrounds, cards, popovers
        background: {
          DEFAULT: 'hsl(var(--bg) / <alpha-value>)',
          subtle: 'hsl(var(--bg-subtle) / <alpha-value>)',
          muted: 'hsl(var(--bg-muted) / <alpha-value>)',
          inverse: 'hsl(var(--bg-inverse) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          raised: 'hsl(var(--surface-raised) / <alpha-value>)',
          overlay: 'hsl(var(--surface-overlay) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'hsl(var(--border) / <alpha-value>)',
          strong: 'hsl(var(--border-strong) / <alpha-value>)',
          subtle: 'hsl(var(--border-subtle) / <alpha-value>)',
        },
        // Text scale
        foreground: {
          DEFAULT: 'hsl(var(--fg) / <alpha-value>)',
          muted: 'hsl(var(--fg-muted) / <alpha-value>)',
          subtle: 'hsl(var(--fg-subtle) / <alpha-value>)',
          inverse: 'hsl(var(--fg-inverse) / <alpha-value>)',
        },
        // Brand accent (indigo) and a soft companion (violet)
        brand: {
          50: 'hsl(var(--brand-50) / <alpha-value>)',
          100: 'hsl(var(--brand-100) / <alpha-value>)',
          200: 'hsl(var(--brand-200) / <alpha-value>)',
          300: 'hsl(var(--brand-300) / <alpha-value>)',
          400: 'hsl(var(--brand-400) / <alpha-value>)',
          500: 'hsl(var(--brand-500) / <alpha-value>)',
          600: 'hsl(var(--brand-600) / <alpha-value>)',
          700: 'hsl(var(--brand-700) / <alpha-value>)',
          800: 'hsl(var(--brand-800) / <alpha-value>)',
          900: 'hsl(var(--brand-900) / <alpha-value>)',
          DEFAULT: 'hsl(var(--brand-500) / <alpha-value>)',
          foreground: 'hsl(var(--brand-fg) / <alpha-value>)',
        },
        // Semantic
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          soft: 'hsl(var(--success-soft) / <alpha-value>)',
          fg: 'hsl(var(--success-fg) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
          soft: 'hsl(var(--warning-soft) / <alpha-value>)',
          fg: 'hsl(var(--warning-fg) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
          soft: 'hsl(var(--danger-soft) / <alpha-value>)',
          fg: 'hsl(var(--danger-fg) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'hsl(var(--info) / <alpha-value>)',
          soft: 'hsl(var(--info-soft) / <alpha-value>)',
          fg: 'hsl(var(--info-fg) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Premium typography scale: tighter line-heights, optical tracking
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.5', letterSpacing: '0.06em' }],
        xs:   ['11px', { lineHeight: '1.5', letterSpacing: '0.04em' }],
        sm:   ['13px', { lineHeight: '1.55', letterSpacing: '0' }],
        base: ['14px', { lineHeight: '1.6',  letterSpacing: '0' }],
        md:   ['15px', { lineHeight: '1.6',  letterSpacing: '0' }],
        lg:   ['17px', { lineHeight: '1.55', letterSpacing: '0' }],
        xl:   ['19px', { lineHeight: '1.45', letterSpacing: '0' }],
        '2xl':['22px', { lineHeight: '1.35', letterSpacing: '0' }],
        '3xl':['28px', { lineHeight: '1.25', letterSpacing: '0' }],
        '4xl':['34px', { lineHeight: '1.2',  letterSpacing: '0' }],
        '5xl':['44px', { lineHeight: '1.1',  letterSpacing: '0' }],
        '6xl':['56px', { lineHeight: '1.05', letterSpacing: '0' }],
      },
      // 4-pt spacing scale (xs=4, sm=8, md=12, lg=16, xl=24, 2xl=32, 3xl=48)
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
      },
      borderRadius: {
        none: '0',
        sm:   '6px',
        md:   '10px',
        lg:   '14px',
        xl:   '18px',
        '2xl':'22px',
        '3xl':'28px',
        full: '9999px',
      },
      boxShadow: {
        // Subtle premium shadows — rgba(15, 23, 42) reads neutral on both
        // light and dark surfaces.
        xs: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        sm: '0 2px 4px -1px rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        md: '0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 2px 4px -1px rgba(15, 23, 42, 0.04)',
        lg: '0 12px 24px -6px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.04)',
        xl: '0 24px 48px -12px rgba(15, 23, 42, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.06)',
        '2xl':'0 32px 80px -16px rgba(15, 23, 42, 0.18), 0 12px 24px -8px rgba(15, 23, 42, 0.08)',
        // Colored glow for primary CTAs
        glow: '0 16px 40px -24px hsl(var(--brand-500) / 0.42)',
        // Inner ring used on focused/active items
        ring: 'inset 0 0 0 1px hsl(var(--border) / 1)',
        none: 'none',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-4px)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '0.7' },
          '50%':     { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.3s ease-out both',
        shimmer: 'shimmer 2.4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        250: '250ms',
        300: '300ms',
        400: '400ms',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '20px',
        xl: '32px',
      },
    },
  },
  plugins: [],
};
