import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Settings as SettingsIcon, BookOpen } from 'lucide-react';
import { logout } from '../src/store/authSlice';

/**
 * ProfileMenu — dropdown for user profile actions.
 *
 * Design decisions:
 *   • Real menu items with leading icons. The old version was a single "Log
 *     out" button — not a profile menu. We add Profile, Settings, and
 *     Academics links for parity with Linear/Notion.
 *   • Rounded-xl, soft border, big shadow — sits over the glass TopNav.
 *   • Hover uses a background-muted tint, not a brand tint (we don't want
 *     to imply every action is "primary").
 */
export default function ProfileMenu({ user, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const go = (path) => {
    navigate(path);
    onClose?.();
  };

  const handleLogout = () => {
    dispatch(logout());
    onClose?.();
    navigate('/login');
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
      <div className="flex items-center gap-3 border-b border-border-subtle px-3 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-semibold text-white">
          {(user?.full_name || user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">
            {user?.full_name || user?.name || 'Student'}
          </div>
          <div className="truncate text-xs text-foreground-muted">{user?.email}</div>
        </div>
      </div>

      <div className="p-1.5">
        {[
          { icon: User,    label: 'Profile',   action: () => go('/settings#profile') },
          { icon: BookOpen,label: 'Academics', action: () => go('/semester') },
          { icon: SettingsIcon, label: 'Settings', action: () => go('/settings') },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="border-t border-border-subtle p-1.5">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-danger-fg transition-colors hover:bg-danger-soft"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

ProfileMenu.propTypes = {
  user: PropTypes.object,
  onClose: PropTypes.func,
};
ProfileMenu.defaultProps = { user: null, onClose: null };
