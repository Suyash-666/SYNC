import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppShell from '../../components/AppShell';

/**
 * ProtectedRoute — wraps every authenticated page in <AppShell>.
 *
 * Design decisions:
 *   • We check the persisted token in localStorage as a fallback. If the
 *     store says "not authenticated" but a token is sitting in localStorage
 *     from a previous tab, we let the user stay — `App.jsx` will validate
 *     it on mount and either restore the session or log them out.
 *     This fixes the "I clicked Settings and got bounced to login" bug.
 *   • We do NOT block users who are not onboarded. Onboarding is shown as
 *     a banner on the dashboard if needed, not as a hard redirect — that's
 *     a more forgiving UX.
 */
export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, accessToken, sessionChecked } = useSelector((s) => s.auth);

  // If session hasn't been validated yet, render nothing (App.jsx shows a loader)
  if (!sessionChecked) return null;

  // Has store-side auth OR a persisted token — let them through.
  const hasPersistedToken = (() => {
    try { return Boolean(localStorage.getItem('sync_auth')); } catch { return false; }
  })();
  if (isAuthenticated || accessToken || hasPersistedToken) {
    return (
      <AppShell>
        <Outlet />
      </AppShell>
    );
  }

  return <Navigate to="/login" state={{ from: location }} replace />;
}
