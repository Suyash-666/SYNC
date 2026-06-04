import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * OnboardingRoute — shown after signup.
 *
 * Design decisions:
 *   • Treats missing `is_onboarded` field as "needs onboarding" so a fresh
 *     signup never gets bounced to /dashboard prematurely.
 *   • Once the user submits onboarding, we trust that the user object has
 *     been updated; if not, the user can still navigate away — no infinite
 *     loops.
 */
export function OnboardingRoute() {
  const { isAuthenticated, user, sessionChecked } = useSelector((s) => s.auth);

  if (!sessionChecked) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isOnboarded = user?.is_onboarded ?? user?.isOnboarded ?? false;
  if (isOnboarded) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

export default OnboardingRoute;
