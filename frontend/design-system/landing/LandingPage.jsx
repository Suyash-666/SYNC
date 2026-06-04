import React from 'react';
import Hero from './Hero';
import MetricsBar from './MetricsBar';
import SemesterPlanner from './SemesterPlanner';
import AIAssistant from './AIAssistant';
import StudyAnalytics from './StudyAnalytics';
import Collaboration from './Collaboration';
import CTAFooter from './CTAFooter';
import '../globals.css';

/**
 * LandingPage composes all landing sections.
 *
 * Design decisions:
 *   • Removed `bg-[var(--color-bg-primary)] text-text-primary` — the new
 *     design system is light-by-default and the old token has been
 *     re-aliased to the new tokens.
 *   • Sections render top-to-bottom on a clean white background with
 *     subtle brand-tinted glows.
 */
export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Hero />
      <MetricsBar />
      <SemesterPlanner />
      <AIAssistant />
      <StudyAnalytics />
      <Collaboration />
      <CTAFooter />
    </div>
  );
};

export default LandingPage;
