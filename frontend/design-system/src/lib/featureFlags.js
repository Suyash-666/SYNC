// ============================================================================
// src/lib/featureFlags.js
// Resolves the VITE_USE_SUPABASE environment variable to a Set of enabled
// module flags. Each migrated module picks one of these flags.
//
//   VITE_USE_SUPABASE=auth
//   VITE_USE_SUPABASE=storage
//   VITE_USE_SUPABASE=notifications
//   VITE_USE_SUPABASE=crud
//   VITE_USE_SUPABASE=study-rooms
//   VITE_USE_SUPABASE=analytics
//   VITE_USE_SUPABASE=all
//   VITE_USE_SUPABASE=auth,storage,notifications      (comma-separated)
//
// Any other value, or an unset variable, means "all flags off" and the
// legacy Node backend continues to handle the affected modules.
//
// Usage:
//
//   import { isEnabled } from '../lib/featureFlags';
//   const useSupabase = isEnabled('storage');
// ============================================================================

const KNOWN_FLAGS = new Set([
  'auth',
  'storage',
  'notifications',
  'crud',
  'study-rooms',
  'analytics',
]);

function parseFlags(raw) {
  if (!raw || typeof raw !== 'string') return new Set();
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '0' || trimmed === 'false') return new Set();

  const tokens = trimmed
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const enabled = new Set();
  for (const t of tokens) {
    if (t === 'all') {
      return new Set(KNOWN_FLAGS);
    }
    if (KNOWN_FLAGS.has(t)) {
      enabled.add(t);
    }
  }
  return enabled;
}

let cached = null;
function enabledSet() {
  if (cached === null) {
    cached = parseFlags(import.meta.env.VITE_USE_SUPABASE);
  }
  return cached;
}

/**
 * Returns true if the given flag is enabled. Unknown flags return false.
 */
export function isEnabled(flag) {
  return enabledSet().has(flag);
}

/**
 * For tests / debugging: re-read the env (e.g., after toggling flags in
 * tests). Not used in production.
 */
export function _resetForTesting() {
  cached = null;
}

export default { isEnabled, _resetForTesting };
