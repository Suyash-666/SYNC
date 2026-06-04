import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button, EmptyState } from '../components';

/**
 * NotFound404 — premium 404 page.
 *
 * Design decisions:
 *   • Reuses the EmptyState primitive so the page has the same visual
 *     rhythm as every other "nothing here" screen.
 *   • The 404 number is part of the icon panel, not raw text — gives the
 *     page a real focal point.
 *   • "Back to dashboard" is the primary CTA. Most 404s in production
 *     have 5 links; one button reads as decisive.
 */
export default function NotFound404() {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={<Compass className="h-7 w-7" />}
      title="404 — Page not found"
      description="The page you were looking for doesn't exist or has been moved. Let's get you back on track."
      actionLabel="Back to dashboard"
      onAction={() => navigate('/dashboard')}
    />
  );
}
