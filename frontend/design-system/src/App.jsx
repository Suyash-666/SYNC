import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { AuthRoute } from './routes/AuthRoute';
import { OnboardingRoute } from './routes/OnboardingRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';

import ErrorBoundary from './components/ErrorBoundary';

import {
  connectSockets,
  disconnectSockets,
  syncSocketAuth,
} from './lib/socket';

import {
  logout,
  setSession,
  setLoading,
  setSessionChecked,
} from './store/authSlice';

import { getSupabase } from './lib/supabase';
import { usersApi } from './api';

// Pages
import DashboardPage from '../dashboard/DashboardPage.jsx';
import AssignmentsPage from '../assignments/AssignmentsPage.jsx';
import NotesPage from '../notes/NotesPage.jsx';
import AnalyticsPage from '../analytics/AnalyticsPage.jsx';
import AIStudyAssistant from '../assistant/AIStudyAssistant.jsx';
import StudyRoomsPage from '../study-rooms/StudyRoomsPage.jsx';
import JoinRoomPage from '../study-rooms/JoinRoomPage.jsx';
import NotificationsPage from '../notifications/NotificationsPage.jsx';
import PlacementPage from '../placement/PlacementPage.jsx';
import SettingsPage from '../settings/SettingsPage.jsx';
import SemesterWorkspacePage from '../semester/SemesterWorkspacePage.jsx';
import OnboardingPage from '../onboarding/OnboardingPage.jsx';
import LandingPage from '../landing/LandingPage.jsx';
import AuthPage from '../auth/AuthPage.jsx';
import NotFound404 from '../errors/NotFound404.jsx';

function FullScreenLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)] text-text-secondary">
      Checking your session...
    </div>
  );
}

function RootRedirect() {
  const isAuthenticated = useSelector(
    (state) => state.auth.isAuthenticated
  );

  const sessionChecked = useSelector(
    (state) => state.auth.sessionChecked
  );

  if (!sessionChecked) {
    return <FullScreenLoading />;
  }

  return (
    <Navigate
      to={isAuthenticated ? '/dashboard' : '/landing'}
      replace
    />
  );
}

export default function App() {
  const dispatch = useDispatch();

  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabase();

    // Fetch the public."User" table row and merge it into the redux
    // `user` so consumers (TopNav, ProfileMenu, Sidebar, etc.) can read
    // `user.full_name`, `user.avatar_url`, `user.college`, `user.degree`
    // directly. The `auth.users` object returned by supabase.auth.getUser
    // has none of those fields — they live on the public."User" row.
    // We swallow the error (e.g. RLS denied, row missing) so a bad row
    // never blocks the rest of the app from booting.
    const fetchProfileRow = async (token) => {
      try {
        // usersApi expects the redux token; for the very first call the
        // token is still being persisted, so we fall back to reading the
        // access token off the just-fetched session.
        const accessToken = token || (await supabase.auth.getSession())?.data?.session?.access_token;
        if (!accessToken) return null;
        const { getSupabaseForUser } = await import('./lib/supabase');
        const c = getSupabaseForUser(accessToken);
        if (!c) return null;
        const { data: { user: au } } = await c.auth.getUser();
        if (!au) return null;
        const { data, error } = await c
          .from('User')
          .select('*')
          .eq('id', au.id)
          .single();
        if (error) return null;
        return data || null;
      } catch {
        return null;
      }
    };

    const restoreSession = async () => {
      dispatch(setLoading(true));

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session || null;
        if (!session) throw new Error('No session');

        const { data: userData } = await supabase.auth.getUser(session.access_token);
        const user = userData?.user || null;
        if (!user) throw new Error('No user');

        if (!isMounted) return;

        // Merge the User table row into the redux user so name/avatar
        // are available everywhere from the first render.
        const profileRow = await fetchProfileRow(session.access_token);
        const mergedUser = profileRow ? { ...user, ...profileRow } : user;

        dispatch(setSession({ user: mergedUser, supabaseSession: session }));
        syncSocketAuth();
        connectSockets();
      } catch (error) {
        if (!isMounted) return;
        dispatch(logout());
        disconnectSockets();
      } finally {
        if (!isMounted) return;
        dispatch(setSessionChecked(true));
        dispatch(setLoading(false));
      }
    };

    restoreSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      if (newSession) {
        supabase.auth.getUser(newSession.access_token).then(async ({ data }) => {
          if (!isMounted) return;
          const au = data?.user || null;
          const profileRow = await fetchProfileRow(newSession.access_token);
          const mergedUser = au && profileRow ? { ...au, ...profileRow } : au;
          dispatch(setSession({ user: mergedUser, supabaseSession: newSession }));
          syncSocketAuth();
        });
      } else {
        dispatch(logout());
        disconnectSockets();
      }
    });

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      disconnectSockets();
      return;
    }
    connectSockets();
  }, [auth.isAuthenticated, auth.supabaseSession]);

  if (!auth.sessionChecked) {
    return <FullScreenLoading />;
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          {/* Public */}
          <Route path="/landing" element={<LandingPage />} />

          {/* Auth */}
          <Route element={<AuthRoute />}>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route
              path="/forgot-password"
              element={<AuthPage />}
            />
          </Route>

          {/* Onboarding */}
          <Route element={<OnboardingRoute />}>
            <Route
              path="/onboarding"
              element={<OnboardingPage />}
            />
          </Route>

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            <Route
              path="/semester"
              element={<SemesterWorkspacePage />}
            />

            <Route
              path="/semester/:semesterId"
              element={<SemesterWorkspacePage />}
            />

            <Route
              path="/assignments"
              element={<AssignmentsPage />}
            />

            <Route
              path="/notes"
              element={<NotesPage />}
            />

            <Route
              path="/ai"
              element={<AIStudyAssistant />}
            />

            <Route
              path="/study-rooms"
              element={<StudyRoomsPage />}
            />

            <Route
              path="/join/:code"
              element={<JoinRoomPage />}
            />

            <Route
              path="/analytics"
              element={<AnalyticsPage />}
            />

            <Route
              path="/placement"
              element={<PlacementPage />}
            />

            <Route
              path="/settings"
              element={<SettingsPage />}
            />

            <Route
              path="/notifications"
              element={<NotificationsPage />}
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound404 />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
