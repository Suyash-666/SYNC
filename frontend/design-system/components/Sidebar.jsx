import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BookText,
  Sparkles,
  Users,
  BarChart3,
  Briefcase,
  Bell,
  GraduationCap,
} from 'lucide-react';
import ProfileMenu from './ProfileMenu';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../src/store/authSlice';
import { useNavigate } from 'react-router-dom';

/**
 * Sidebar — drawer navigation panel.
 *
 * Design decisions:
 *   • The sidebar is a normal-width (280px) panel that slides in from the
 *     left. It is not persistent — that was the user's request and matches
 *     Linear/Raycast's mobile-first nav.
 *   • Real Lucide icons throughout. No inline SVGs.
 *   • Grouped nav (Workspace / Insights) so the user can scan the IA.
 *   • Active route: brand-tinted background + brand foreground + 3px
 *     brand-colored left edge. Visible against the hover state.
 *   • The "Sign out" footer is a single destructive button, not a
 *     profile menu — this is a navigation drawer, not a profile menu.
 */

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { to: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
      { to: '/semester',      label: 'Semester',     icon: Calendar },
      { to: '/assignments',   label: 'Assignments',  icon: CheckSquare },
      { to: '/notes',         label: 'Notes',        icon: BookText },
      { to: '/ai',            label: 'AI Assistant', icon: Sparkles },
      { to: '/study-rooms',   label: 'Study Rooms',  icon: Users },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics',     label: 'Analytics',    icon: BarChart3 },
      { to: '/placement',     label: 'Placement',    icon: Briefcase },
      { to: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/settings',      label: 'Settings',     icon: Briefcase },
    ],
  },
];

export function Sidebar({ onNavigate }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    onNavigate?.();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="flex h-full flex-col bg-surface text-foreground">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border-subtle px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface text-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-md font-bold tracking-tight">SYNC</span>
          <span className="-mt-0.5 text-2xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
            Academic OS
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-subtle px-3 py-4">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label} className={groupIndex > 0 ? 'mt-6' : ''}>
            <div className="mb-2 px-2 text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
              {group.label}
            </div>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      [
                        'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium',
                        'transition-colors duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
                        isActive
                          ? 'bg-background-muted text-foreground'
                          : 'text-foreground-muted hover:bg-background-muted hover:text-foreground',
                      ].join(' ')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive ? (
                          <span className="absolute inset-y-1 left-0 w-0.5 rounded-r-full bg-foreground" />
                        ) : null}
                        <item.icon
                          className={[
                            'h-4 w-4 shrink-0 transition-colors',
                            isActive ? 'text-foreground' : 'text-foreground-subtle group-hover:text-foreground',
                          ].join(' ')}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border-subtle p-3">
        {user ? (
          <div className="flex items-center gap-3 rounded-md p-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground text-sm font-semibold text-background">
              {(user?.full_name || user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">
                {user?.full_name || user?.name || 'Student'}
              </div>
              <div className="truncate text-xs text-foreground-muted">{user?.email}</div>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-danger-fg transition-colors hover:bg-danger-soft"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

Sidebar.propTypes = { onNavigate: PropTypes.func };
Sidebar.defaultProps = { onNavigate: null };

export default Sidebar;
