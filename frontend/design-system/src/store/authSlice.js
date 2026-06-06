import { createSlice } from '@reduxjs/toolkit';

const loadPersistedAuth = () => {
  if (typeof window === 'undefined') {
    return { user: null, supabaseSession: null, isAuthenticated: false };
  }
  try {
    const raw = window.localStorage.getItem('sync_auth');
    if (!raw) return { user: null, supabaseSession: null, isAuthenticated: false };
    const parsed = JSON.parse(raw);
    return {
      user: parsed.user ?? null,
      supabaseSession: parsed.supabaseSession ?? null,
      isAuthenticated: Boolean(parsed.supabaseSession?.access_token),
    };
  } catch {
    return { user: null, supabaseSession: null, isAuthenticated: false };
  }
};

const persistAuth = (state) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    'sync_auth',
    JSON.stringify({ user: state.user, supabaseSession: state.supabaseSession })
  );
};

const initialState = {
  user: loadPersistedAuth().user,
  supabaseSession: loadPersistedAuth().supabaseSession,
  isAuthenticated: loadPersistedAuth().isAuthenticated,
  isLoading: false,
  sessionChecked: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    setSession(state, action) {
      const { user, supabaseSession } = action.payload || {};
      state.user = user ?? state.user;
      state.supabaseSession = supabaseSession ?? state.supabaseSession;
      state.isAuthenticated = Boolean(state.supabaseSession?.access_token);
      state.isLoading = false;
      state.sessionChecked = true;
      persistAuth(state);
    },
    setSessionChecked(state, action) {
      state.sessionChecked = Boolean(action.payload);
    },
    logout(state) {
      state.user = null;
      state.supabaseSession = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.sessionChecked = true;
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('sync_auth');
      }
    },
  },
});

export const { setLoading, setSession, setSessionChecked, logout } = authSlice.actions;
export default authSlice.reducer;
