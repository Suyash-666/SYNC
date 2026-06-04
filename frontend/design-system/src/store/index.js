import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import notificationsReducer from './notificationsSlice';
import { bindAuthStore } from '../api/client';
import { bindSocketStore } from '../lib/socket';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
  },
});

bindAuthStore(store);
bindSocketStore(store);

export default store;
