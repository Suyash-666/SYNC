import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  Palette,
  Bell,
  Shield,
  LogOut,
  Camera,
  Save,
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react';
import {
  Button,
  Card,
  CardEyebrow,
  CardTitle,
  Input,
  Toggle,
  Toast,
} from '../components';
import { authApi, resourcesApi, usersApi } from '../src/api';
import { logout, setSession } from '../src/store/authSlice';
import { disconnectSockets } from '../src/lib/socket';
import { getSupabase } from '../src/lib/supabase';

/**
 * SettingsPage — preferences hub.
 *
 * This rewrite addresses five reported issues:
 *   1. Profile form used the wrong key names (`name` instead of
 *      `full_name`) and included a non-existent `bio` column, so
 *      `usersApi.updateProfile` was being called with an empty row
 *      and nothing persisted.
 *   2. Avatar upload used the wrong URL field — the supabase
 *      `resourcesApi.upload` returns a `Resource` row whose public
 *      URL lives on `file_url`, not on `url` / `data.url`. Result:
 *      the avatar URL was always empty and never written back to
 *      `User.avatar_url`.
 *   3. Accent colour picker had no onClick — selecting a swatch did
 *      nothing. It now writes the chosen HSL triple to a CSS
 *      variable on `:root` and persists to localStorage so the
 *      choice survives reload within the same session/browser.
 *   4. Notification/Privacy toggles were visual-only — clicking
 *      flipped the inner state but the choice was never persisted.
 *      They are now real controlled switches with localStorage
 *      persistence per key.
 *   5. Toggles had no `onChange` wiring on the settings rows, so
 *      there was no UX feedback. Each toggle now shows a toast on
 *      change so the user knows it took effect.
 */

const tabs = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'appearance',    label: 'Appearance',    icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy',       label: 'Privacy',       icon: Shield },
  { id: 'account',       label: 'Account',       icon: LogOut },
];

function resolveTabFromHash(hash) {
  const nextTab = hash?.replace('#', '');
  return tabs.some((t) => t.id === nextTab) ? nextTab : 'profile';
}

const THEME_KEY    = 'sync-theme';
const ACCENT_KEY   = 'sync-accent';        // 'indigo' | 'sky' | 'amber' | 'emerald' | 'rose'
const PREFS_KEY    = 'sync-prefs';         // JSON: { notif:{...}, privacy:{...} }

// Each accent is stored as the HSL triple (no wrapper) that the
// design system already uses for `--brand-500` etc.  Writing the
// triple on `:root` cascades to every component that uses
// `bg-brand-50/500`, `text-brand-600/700`, etc. — so the picker
// is genuinely system-wide, not just a Settings page decoration.
const ACCENTS = [
  { name: 'Indigo',  key: 'indigo',  h: '238 78% 60%' },
  { name: 'Sky',     key: 'sky',     h: '199 89% 48%' },
  { name: 'Amber',   key: 'amber',   h: '38  92% 50%' },
  { name: 'Emerald', key: 'emerald', h: '160 84% 39%' },
  { name: 'Rose',    key: 'rose',    h: '350 89% 60%' },
];

// Default notification & privacy preferences. The first render uses
// these when localStorage is empty so the page is not blank.
const DEFAULT_NOTIFICATION_PREFS = {
  assignmentUpdates: true,
  attendanceAlerts: true,
  aiSuggestions:     true,
  deadlines:         true,
  collaboration:     true,
};
const DEFAULT_PRIVACY_PREFS = {
  shareAnalytics:       false,
  appearInDirectory:    true,
  allowMentions:        true,
};

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }
}

// Inject a one-time <style> tag that sets the brand HSL triple on
// :root.  All Tailwind `bg-brand-*` / `text-brand-*` utilities read
// from `--brand-500` etc., so writing here changes every branded
// element in the app.
function applyAccent(hslTriple) {
  if (!hslTriple) return;
  let styleEl = document.getElementById('sync-accent-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'sync-accent-style';
    document.head.appendChild(styleEl);
  }
  // Also set `--brand-50/100/200/.../900` from the same hue, plus
  // a few derived tokens the rest of the app uses.  We pick a small
  // set of lightness stops to approximate the original indigo scale.
  // The user can see the accent change instantly.
  styleEl.textContent = `
    :root {
      --brand-50:  hsl(${hslTriple} / 0.12);
      --brand-100: hsl(${hslTriple} / 0.18);
      --brand-200: hsl(${hslTriple} / 0.32);
      --brand-300: hsl(${hslTriple} / 0.55);
      --brand-400: hsl(${hslTriple} / 0.78);
      --brand-500: ${hslTriple};
      --brand-600: hsl(${hslTriple} / 0.92);
      --brand-700: hsl(${hslTriple} / 0.78);
      --brand-800: hsl(${hslTriple} / 0.6);
      --brand-900: hsl(${hslTriple} / 0.45);
    }
  `;
}

export default function SettingsPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const user = useSelector((state) => state.auth.user);
  const supabaseSession = useSelector((state) => state.auth.supabaseSession);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const showToast = (variant, text) => setMessage({ variant, text });

  // Profile form — keys match the *form* (camelCase). The submit
  // handler maps them to the *database* column names that
  // usersApi.updateProfile expects.
  //
  // We seed from the *User table* row, not from the redux `user`.
  // The redux `user` is the `auth.users` object and has no
  // `full_name` / `avatar_url` / `college` / `degree` fields — those
  // live on the public."User" row, fetched via usersApi.getProfile().
  // Seeding from the wrong object is what made every save look like it
  // vanished on refresh.
  const [profile, setProfile] = useState({
    name: '',
    college: '',
    degree: '',
  });
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'light';
    } catch { return 'light'; }
  });
  const [accentKey, setAccentKey] = useState(() => {
    try { return localStorage.getItem(ACCENT_KEY) || 'indigo'; }
    catch { return 'indigo'; }
  });
  const [notifPrefs, setNotifPrefs] = useState(() =>
    readJsonStorage(`${PREFS_KEY}.notifications`, DEFAULT_NOTIFICATION_PREFS),
  );
  const [privacyPrefs, setPrivacyPrefs] = useState(() =>
    readJsonStorage(`${PREFS_KEY}.privacy`, DEFAULT_PRIVACY_PREFS),
  );

  const nav = useMemo(() => resolveTabFromHash(location.hash), [location.hash]);

  // Local cache of the latest User table row, populated on mount and
  // refreshed after every save.  This is the source of truth for the
  // form fields and the avatar preview — NOT the redux `user`, which
  // is the auth.users object and never carries full_name / avatar_url /
  // college / degree.
  const [profileRow, setProfileRow] = useState(null);

  // Load the User row on mount (and whenever the auth user changes,
  // e.g. after a fresh login).  This is the call that makes the form
  // actually show the saved values on refresh.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const row = await usersApi.getProfile();
        if (cancelled) return;
        setProfileRow(row || null);
      } catch (error) {
        if (cancelled) return;
        // Don't toast here — a stale session on the settings page is
        // not a user-facing error, the redux user is still enough to
        // show email in the disabled field.
        setProfileRow(null);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Re-seed the form whenever the User table row changes (initial
  // load, or after a save refreshes it).
  useEffect(() => {
    setProfile({
      name:    profileRow?.full_name || user?.name || '',
      college: profileRow?.college || '',
      degree:  profileRow?.degree || '',
    });
  }, [profileRow, user]);

  // Re-apply the persisted accent every time the page mounts so a
  // hard reload still shows the right color.
  useEffect(() => {
    const found = ACCENTS.find((a) => a.key === accentKey);
    if (found) applyAccent(found.h);
    // We intentionally do NOT include `accentKey` in deps — the
    // effect below handles live updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Avatar URL comes from the User table row, with a fallback to
  // whatever redux has (which is usually nothing — kept for safety).
  const avatarUrl = useMemo(
    () => profileRow?.avatar_url || user?.avatar_url || user?.avatarUrl || '',
    [profileRow, user],
  );

  const updateField = (field) => (event) =>
    setProfile((current) => ({ ...current, [field]: event.target.value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      // Build the payload using the EXACT column names the supabase
      // updateProfile accepts (full_name, college, degree, avatar_url).
      // The form's `name` maps to `full_name`; `email` and `bio` are
      // not editable here so they are dropped.
      const payload = {
        full_name: profile.name,
        college:   profile.college,
        degree:    profile.degree,
      };
      const updated = await usersApi.updateProfile(payload);
      // Use the freshly-returned row as the new source of truth.
      // If the call somehow returns null (it shouldn't), fall back
      // to merging the payload over the existing row.
      const nextRow = updated || { ...(profileRow || {}), ...payload };
      setProfileRow(nextRow);
      // Keep redux in sync too so the rest of the app (header avatar,
      // dashboard greeting) reflects the new name immediately.
      dispatch(setSession({ user: { ...user, ...nextRow }, supabaseSession }));
      showToast('success', 'Profile saved.');
    } catch (error) {
      showToast('error', error?.response?.data?.message || error?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Image must be 2MB or smaller.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('error', 'Use PNG, JPG, or WEBP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setSaving(true);
    try {
      // 1. Upload bytes + metadata row via resourcesApi. The supabase
      // impl returns the inserted Resource row, which includes
      // `file_url` (the public storage URL).
      const resource = await resourcesApi.upload({ file, title: 'Profile avatar' });
      const nextAvatar = resource?.file_url || resource?.data?.file_url || '';
      if (!nextAvatar) throw new Error('Upload succeeded but no file URL was returned.');

      // 2. Persist the URL on the User row.
      const updated = await usersApi.updateProfile({ avatar_url: nextAvatar });
      const nextRow = updated || { ...(profileRow || {}), avatar_url: nextAvatar };
      setProfileRow(nextRow);
      // Keep redux in sync so the header avatar updates immediately.
      dispatch(setSession({ user: { ...user, ...nextRow }, supabaseSession }));
      showToast('success', 'Avatar updated.');
    } catch (error) {
      showToast('error', error?.message || 'Could not upload avatar.');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch {}
    disconnectSockets();
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  // -- Accent picker handlers -----------------------------------------
  const pickAccent = (key) => {
    const found = ACCENTS.find((a) => a.key === key);
    if (!found) return;
    setAccentKey(key);
    applyAccent(found.h);
    try { localStorage.setItem(ACCENT_KEY, key); } catch {}
    showToast('success', `Accent set to ${found.name}.`);
  };

  // -- Notification / Privacy toggle handlers -------------------------
  // The Toggle component is controlled: we pass `checked` and
  // `onChange` so each click flips state, persists to localStorage,
  // and surfaces a toast. No more placeholder.
  const updateNotif = (key) => (next) => {
    setNotifPrefs((current) => {
      const updated = { ...current, [key]: next };
      writeJsonStorage(`${PREFS_KEY}.notifications`, updated);
      return updated;
    });
    showToast('success', next ? 'Notification enabled.' : 'Notification muted.');
  };

  const updatePrivacy = (key) => (next) => {
    setPrivacyPrefs((current) => {
      const updated = { ...current, [key]: next };
      writeJsonStorage(`${PREFS_KEY}.privacy`, updated);
      return updated;
    });
    showToast('success', next ? 'Setting turned on.' : 'Setting turned off.');
  };

  // -- Row UI helper -------------------------------------------------
  // The original row was a plain `bg-background-subtle/30` card. The
  // Toggle inside it sometimes read as "the row changed colour" when
  // the user said "they change colour but not the toggle". Here the
  // row stays neutral and the toggle is the only thing that visually
  // changes — checked/unchecked — so the affordance is unambiguous.
  const ToggleRow = ({ title, desc, checked, onChange, last }) => (
    <div
      className={[
        'flex items-center justify-between rounded-xl border border-border-subtle bg-surface px-4 py-3',
        !last ? 'mb-2' : '',
      ].join(' ')}
    >
      <div className="pr-4">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="mt-0.5 text-2xs text-foreground-muted">{desc}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-5">
      <Toast
        open={Boolean(message)}
        variant={message?.variant}
        onClose={() => setMessage(null)}
        message={message?.text}
        duration={3000}
      />

      <div>
        <CardEyebrow>Settings</CardEyebrow>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
          Preferences
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Manage your profile, theme, notifications, and account.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* Tabs */}
        <Card padding="sm" className="h-fit">
          <ul className="flex flex-col gap-0.5">
            {tabs.map((tab) => {
              const active = nav === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/settings#${tab.id}`)}
                    className={[
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-foreground-muted hover:bg-background-muted hover:text-foreground',
                    ].join(' ')}
                  >
                    <tab.icon className={['h-4 w-4', active ? 'text-brand-600' : 'text-foreground-subtle'].join(' ')} />
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Content */}
        <Card padding="lg">
          {nav === 'profile' && (
            <form onSubmit={saveProfile} className="space-y-6">
              <div>
                <CardTitle>Profile</CardTitle>
                <p className="mt-1 text-sm text-foreground-muted">
                  Your public information is shown to study-mate suggestions.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-semibold text-white">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    (profile.name || user?.email || 'U').slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leadingIcon={<Camera className="h-4 w-4" />}
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={saving}
                  >
                    Upload avatar
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={uploadAvatar}
                    className="hidden"
                  />
                  <div className="mt-1.5 text-2xs text-foreground-subtle">PNG, JPG, or WEBP · max 2MB</div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Name"
                  value={profile.name}
                  onChange={updateField('name')}
                  placeholder="Your full name"
                />
                <Input
                  label="Email"
                  value={user?.email || ''}
                  disabled
                  helperText="Email is tied to your login and cannot be changed here."
                />
                <Input
                  label="College"
                  value={profile.college}
                  onChange={updateField('college')}
                  placeholder="Your college"
                />
                <Input
                  label="Degree"
                  value={profile.degree}
                  onChange={updateField('degree')}
                  placeholder="e.g. B.Tech CSE"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" isLoading={saving} leadingIcon={<Save className="h-4 w-4" />}>
                  Save profile
                </Button>
              </div>
            </form>
          )}

          {nav === 'appearance' && (
            <div className="space-y-6">
              <div>
                <CardTitle>Appearance</CardTitle>
                <p className="mt-1 text-sm text-foreground-muted">
                  Choose how SYNC looks. Light and dark themes preserve readability across devices.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-2xs font-semibold uppercase tracking-[0.12em] text-foreground-subtle">
                  Theme
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'light', icon: Sun,     label: 'Light' },
                    { value: 'dark',  icon: Moon,    label: 'Dark'  },
                    { value: 'system', icon: Monitor, label: 'System' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (opt.value === 'system') {
                          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                          applyTheme(prefersDark ? 'dark' : 'light');
                          setTheme(prefersDark ? 'dark' : 'light');
                        } else {
                          applyTheme(opt.value);
                          setTheme(opt.value);
                        }
                      }}
                      className={[
                        'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition-all',
                        (theme === opt.value || (opt.value === 'system' && !['light', 'dark'].includes(theme)))
                          ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-xs'
                          : 'border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground',
                      ].join(' ')}
                    >
                      <opt.icon className="h-5 w-5" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-2xs font-semibold uppercase tracking-[0.12em] text-foreground-subtle">
                  Accent color
                </h3>
                <p className="mb-3 text-2xs text-foreground-muted">
                  Applies across the whole app — buttons, focus rings, charts, badges.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENTS.map((c) => {
                    const active = accentKey === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        title={c.name}
                        aria-label={`Set accent to ${c.name}`}
                        aria-pressed={active}
                        onClick={() => pickAccent(c.key)}
                        className={[
                          'relative grid h-9 w-9 place-items-center rounded-full transition-all',
                          active
                            ? 'ring-2 ring-foreground/40 ring-offset-2 ring-offset-surface'
                            : 'ring-1 ring-border hover:ring-foreground/30',
                        ].join(' ')}
                        style={{ backgroundColor: `hsl(${c.h})` }}
                      >
                        {active ? (
                          <Check className="h-4 w-4 text-white drop-shadow-sm" strokeWidth={3} />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {nav === 'notifications' && (
            <div className="space-y-4">
              <div>
                <CardTitle>Notifications</CardTitle>
                <p className="mt-1 text-sm text-foreground-muted">
                  Pick the alerts that matter to you. Your choice is saved on this device.
                </p>
              </div>
              <ToggleRow
                title="Assignment updates"
                desc="New comments, status changes, due-soon warnings."
                checked={notifPrefs.assignmentUpdates}
                onChange={updateNotif('assignmentUpdates')}
              />
              <ToggleRow
                title="Attendance alerts"
                desc="Notify when you fall below 75% in a subject."
                checked={notifPrefs.attendanceAlerts}
                onChange={updateNotif('attendanceAlerts')}
              />
              <ToggleRow
                title="AI suggestions"
                desc="Daily nudges from SYNC AI."
                checked={notifPrefs.aiSuggestions}
                onChange={updateNotif('aiSuggestions')}
              />
              <ToggleRow
                title="Deadlines"
                desc="Day-of reminders for upcoming deadlines."
                checked={notifPrefs.deadlines}
                onChange={updateNotif('deadlines')}
              />
              <ToggleRow
                title="Collaboration"
                desc="Mentions and replies in study rooms."
                checked={notifPrefs.collaboration}
                onChange={updateNotif('collaboration')}
                last
              />
            </div>
          )}

          {nav === 'privacy' && (
            <div className="space-y-4">
              <div>
                <CardTitle>Privacy</CardTitle>
                <p className="mt-1 text-sm text-foreground-muted">Control how others see you on SYNC.</p>
              </div>
              <ToggleRow
                title="Share analytics"
                desc="Help us improve by sharing anonymous usage data."
                checked={privacyPrefs.shareAnalytics}
                onChange={updatePrivacy('shareAnalytics')}
              />
              <ToggleRow
                title="Appear in room directory"
                desc="Let others find you in public study rooms."
                checked={privacyPrefs.appearInDirectory}
                onChange={updatePrivacy('appearInDirectory')}
              />
              <ToggleRow
                title="Allow mentions"
                desc="Receive notifications when someone @mentions you."
                checked={privacyPrefs.allowMentions}
                onChange={updatePrivacy('allowMentions')}
                last
              />
            </div>
          )}

          {nav === 'account' && (
            <div className="space-y-6">
              <div>
                <CardTitle>Account</CardTitle>
                <p className="mt-1 text-sm text-foreground-muted">
                  Sign out of this device or delete your account permanently.
                </p>
              </div>
              <Card padding="md" className="border-danger/30 bg-danger-soft/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Sign out everywhere</div>
                    <div className="text-2xs text-foreground-muted">
                      Log out of all devices, including this one.
                    </div>
                  </div>
                  <Button variant="danger" leadingIcon={<LogOut className="h-4 w-4" />} onClick={handleLogout}>
                    Sign out
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
