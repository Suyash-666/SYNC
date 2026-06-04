import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { TopNav } from './TopNav';
import SlideMenu from './SlideMenu';

/**
 * AppShell — chrome for every protected page.
 *
 * Behavior model (post-redesign):
 *   • The sidebar is NOT always visible. It defaults to hidden (off-canvas)
 *     on every screen size. The hamburger button in the TopNav slides it in
 *     from the left as a panel. This is the model the user requested and
 *     the model most modern productivity apps (Linear mobile, Raycast) use.
 *   • The TopNav sits in a normal sticky position; clicking the hamburger
 *     opens the sidebar drawer; clicking outside or pressing Esc closes it.
 *   • Page transitions are simple fade + 4px slide, fast enough to feel
 *     instant.
 */
export default function AppShell({ children }) {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  // Close the drawer on every route change
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <TopNav onMenuToggle={() => setNavOpen(true)} />

      <main className="flex-1 overflow-y-auto scrollbar-subtle">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <SlideMenu
        open={navOpen}
        onClose={() => setNavOpen(false)}
        width="280px"
        overlayClassName="bg-foreground/30 backdrop-blur-sm"
        panelClassName="bg-surface border-r border-border shadow-2xl"
      >
        <Sidebar onNavigate={() => setNavOpen(false)} />
      </SlideMenu>
    </div>
  );
}

AppShell.propTypes = { children: PropTypes.node };
AppShell.defaultProps = { children: null };
