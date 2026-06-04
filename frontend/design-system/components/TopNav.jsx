import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Bell, Menu, Search, X } from 'lucide-react';
import ProfileMenu from './ProfileMenu';

export const TopNav = React.forwardRef(function TopNav(
  { onMenuToggle, onSearch, onNotificationsClick, className = '', ...props },
  ref,
) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const profileRef = useRef(null);
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    const onDoc = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  return (
    <header
      ref={ref}
      className={[
        'sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border-subtle px-4 sm:px-6',
        'glass',
        className,
      ].join(' ')}
      {...props}
    >
      {onMenuToggle ? (
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Open navigation"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch?.(searchValue);
        }}
        className="relative ml-1 hidden max-w-xl flex-1 md:block"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search classes, notes, assignments, rooms..."
          className="h-9 w-full rounded-md border border-border bg-surface pl-9 pr-16 text-sm text-foreground placeholder:text-foreground-subtle focus:border-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10"
        />
        {searchValue ? (
          <button
            type="button"
            onClick={() => setSearchValue('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-foreground-subtle hover:bg-background-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none items-center gap-0.5 rounded border border-border bg-background-subtle px-1.5 py-0.5 text-2xs font-medium text-foreground-subtle sm:inline-flex">
            Ctrl K
          </kbd>
        )}
      </form>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onNotificationsClick}
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
        </button>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            aria-label="Open profile menu"
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
          >
            {(user?.full_name || user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
          </button>
          {profileOpen ? (
            <div className="absolute right-0 top-11 z-50 w-60 origin-top-right animate-fade-up">
              <ProfileMenu user={user} onClose={() => setProfileOpen(false)} />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
});

TopNav.displayName = 'TopNav';
TopNav.propTypes = {
  onMenuToggle: PropTypes.func,
  onSearch: PropTypes.func,
  onNotificationsClick: PropTypes.func,
  className: PropTypes.string,
};
