import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { AuthRoute } from './routes/AuthRoute';
import { OnboardingRoute } from './routes/OnboardingRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';

import ErrorBoundary from './components/ErrorBoundary';

import { authApi } from './api';

import {
  connectSockets,
  disconnectSockets,
  syncSocketAuth,
} from './lib/socket';

import {
  logout,
  setCredentials,
  setLoading,
  setSessionChecked,
} from './store/authSlice';

// Pages
import DashboardPage from '../dashboard/DashboardPage.jsx';
import AssignmentsPage from '../assignments/AssignmentsPage.jsx';
import NotesPage from '../notes/NotesPage.jsx';
import AnalyticsPage from '../analytics/AnalyticsPage.jsx';
import AIStudyAssistant from '../assistant/AIStudyAssistant.jsx';
import StudyRoomsPage from '../study-rooms/StudyRoomsPage.jsx';
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

    const restoreSession = async () => {
      dispatch(setLoading(true));

      try {
        // Already have token but no user
        if (auth.accessToken && !auth.user) {
          const me = await authApi.getMe();

          if (!isMounted) return;

          dispatch(
            setCredentials({
              user: me,
              accessToken: auth.accessToken,
            })
          );

          syncSocketAuth();
          connectSockets();

          return;
        }

        // Already authenticated
        if (auth.isAuthenticated) {
          connectSockets();

          dispatch(setSessionChecked(true));
          dispatch(setLoading(false));

          return;
        }

        // Try refresh
        const refreshed = await authApi
          .refreshToken()
          .catch(() => null);

        if (!refreshed) {
          throw new Error('No session');
        }

        const nextAccess =
          refreshed.accessToken ||
          refreshed.access ||
          refreshed.data?.accessToken ||
          refreshed.data?.access;

        if (!nextAccess) {
          throw new Error('Missing access token');
        }

        const me = await authApi.getMe();

        if (!isMounted) return;

        dispatch(
          setCredentials({
            user: me,
            accessToken: nextAccess,
          })
        );

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

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      disconnectSockets();
      return;
    }

    connectSockets();
  }, [auth.isAuthenticated, auth.accessToken]);

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