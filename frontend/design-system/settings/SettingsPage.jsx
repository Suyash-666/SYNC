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
} from 'lucide-react';
import {
  Button,
  Card,
  CardEyebrow,
  CardTitle,
  Input,
  Toggle,
  Badge,
  Toast,
} from '../components';
import { authApi, resourcesApi, usersApi } from '../src/api';
import { logout, setCredentials } from '../src/store/authSlice';
import { disconnectSockets } from '../src/lib/socket';

/**
 * SettingsPage — preferences hub.
 *
 * Design decisions:
 *   • Tabbed left nav (Profile / Appearance / Notifications / Privacy /
 *     Account). Active tab has the brand background and brand foreground.
 *   • Appearance tab wires the actual theme toggle to `data-theme` on
 *     `<html>` and persists to localStorage — the theme you toggle here
 *     persists across reloads (matched by the inline script in
 *     index.html that applies it before paint).
 *   • Inputs use the new floating-label primitive.
 *   • The profile form is grouped into a single Card, with the avatar
 *     in a sub-card at the top.
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

const THEME_KEY = 'sync-theme';

function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }
}

export default function SettingsPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const user = useSelector((state) => state.auth.user);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [profile, setProfile] = useState({
    name: '', email: '', college: '', degree: '', bio: '',
  });
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'light';
    } catch { return 'light'; }
  });

  const nav = useMemo(() => resolveTabFromHash(location.hash), [location.hash]);

  useEffect(() => {
    setProfile({
      name:    user?.name || user?.full_name || '',
      email:   user?.email || '',
      college: user?.college || user?.college_name || '',
      degree:  user?.degree || user?.degree_name || '',
      bio:     user?.bio || '',
    });
  }, [user]);

  const avatarUrl = useMemo(() => user?.avatar_url || user?.avatarUrl || '', [user]);

  const updateField = (field) => (event) =>
    setProfile((current) => ({ ...current, [field]: event.target.value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const result = await usersApi.updateProfile(profile);
      const nextUser = result?.user || result?.data?.user || result || profile;
      dispatch(setCredentials({ user: { ...user, ...nextUser }, accessToken: user?.accessToken }));
      setMessage({ variant: 'success', text: 'Profile saved.' });
    } catch (error) {
      setMessage({ variant: 'error', text: error?.response?.data?.message || 'Could not save profile.' });
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await resourcesApi.upload({ file, title: 'Profile avatar' });
      const nextAvatar = result?.url || result?.file?.url || result?.data?.url || result?.data?.file?.url || result?.avatar_url || '';
      const nextUser = { ...user, avatar_url: nextAvatar, avatarUrl: nextAvatar };
      await usersApi.updateProfile({ avatar_url: nextAvatar });
      dispatch(setCredentials({ user: nextUser, accessToken: user?.accessToken }));
      setMessage({ variant: 'success', text: 'Avatar updated.' });
    } catch (error) {
      setMessage({ variant: 'error', text: error?.response?.data?.message || 'Could not upload avatar.' });
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    disconnectSockets();
    dispatch(logout());
    navigate('/login', { replace: true });
  };

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
                  {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> :
                    (profile.name || user?.email || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leadingIcon={<Camera className="h-4 w-4" />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload avatar
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    className="hidden"
                  />
                  <div className="mt-1.5 text-2xs text-foreground-subtle">PNG, JPG, or WEBP · max 2MB</div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Name"    value={profile.name}    onChange={updateField('name')} />
                <Input label="Email"   value={profile.email}   onChange={updateField('email')} disabled />
                <Input label="College" value={profile.college} onChange={updateField('college')} />
                <Input label="Degree"  value={profile.degree}  onChange={updateField('degree')} />
                <Input
                  as="textarea" rows={3} className="sm:col-span-2"
                  label="Bio"
                  value={profile.bio}
                  onChange={updateField('bio')}
                  placeholder="Tell other students a little about yourself…"
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
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { name: 'Indigo', value: '#6366F1' },
                    { name: 'Sky',    value: '#0EA5E9' },
                    { name: 'Amber',  value: '#F59E0B' },
                    { name: 'Emerald',value: '#10B981' },
                    { name: 'Rose',   value: '#F43F5E' },
                  ].map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      title={c.name}
                      className="h-8 w-8 rounded-full ring-2 ring-transparent transition-all hover:ring-foreground/30"
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {nav === 'notifications' && (
            <div className="space-y-4">
              <div>
                <CardTitle>Notifications</CardTitle>
                <p className="mt-1 text-sm text-foreground-muted">
                  Pick the alerts that matter to you.
                </p>
              </div>
              {[
                { label: 'Assignment updates', desc: 'New comments, status changes, due-soon warnings.' },
                { label: 'Attendance alerts',  desc: 'Notify when you fall below 75% in a subject.' },
                { label: 'AI suggestions',     desc: 'Daily nudges from SYNC AI.' },
                { label: 'Deadlines',          desc: 'Day-of reminders for upcoming deadlines.' },
                { label: 'Collaboration',      desc: 'Mentions and replies in study rooms.' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-border-subtle bg-background-subtle/30 p-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-foreground">{item.label}</div>
                    <div className="text-2xs text-foreground-muted">{item.desc}</div>
                  </div>
                  <Toggle defaultChecked />
                </div>
              ))}
            </div>
          )}

          {nav === 'privacy' && (
            <div className="space-y-4">
              <div>
                <CardTitle>Privacy</CardTitle>
                <p className="mt-1 text-sm text-foreground-muted">Control how others see you on SYNC.</p>
              </div>
              {[
                { label: 'Share analytics',        desc: 'Help us improve by sharing anonymous usage data.' },
                { label: 'Appear in room directory', desc: 'Let others find you in public study rooms.' },
                { label: 'Allow mentions',         desc: 'Receive notifications when someone @mentions you.' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-border-subtle bg-background-subtle/30 p-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-foreground">{item.label}</div>
                    <div className="text-2xs text-foreground-muted">{item.desc}</div>
                  </div>
                  <Toggle />
                </div>
              ))}
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
