import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import notificationsReducer from './notificationsSlice';
import { bindAuthStore } from '../api/client';
import { bindSocketStore } from '../lib/socket';
import { bindSupabaseStore } from '../lib/supabase';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
  },
});

bindAuthStore(store);
bindSocketStore(store);
bindSupabaseStore(() => {
  const auth = store.getState().auth;
  return auth.supabaseSession?.access_token || null;
});

export default store;
