import { createSlice } from '@reduxjs/toolkit';

const loadPersistedAuth = () => {
  if (typeof window === 'undefined') return { user: null, accessToken: null, isAuthenticated: false };
  try {
    const raw = window.localStorage.getItem('sync_auth');
    if (!raw) return { user: null, accessToken: null, isAuthenticated: false };
    const parsed = JSON.parse(raw);
    return {
      user: parsed.user ?? null,
      accessToken: parsed.accessToken ?? null,
      isAuthenticated: Boolean(parsed.accessToken),
    };
  } catch {
    return { user: null, accessToken: null, isAuthenticated: false };
  }
};

const persistAuth = (state) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('sync_auth', JSON.stringify({ user: state.user, accessToken: state.accessToken }));
};

const initialState = {
  user: loadPersistedAuth().user,
  accessToken: loadPersistedAuth().accessToken,
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
    setCredentials(state, action) {
      const { user, accessToken } = action.payload || {};
      state.user = user ?? state.user;
      state.accessToken = accessToken ?? state.accessToken;
      state.isAuthenticated = Boolean(state.accessToken);
      state.isLoading = false;
      state.sessionChecked = true;
      persistAuth(state);
    },
    setSessionChecked(state, action) {
      state.sessionChecked = Boolean(action.payload);
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.sessionChecked = true;
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('sync_auth');
      }
    },
  },
});

export const { setLoading, setCredentials, setSessionChecked, logout } = authSlice.actions;
export default authSlice.reducer;
