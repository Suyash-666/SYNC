import { createSlice } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
  },
  reducers: {
    setNotifications(state, action) {
      state.notifications = action.payload || [];
      state.unreadCount = state.notifications.filter((item) => !item.is_read).length;
    },
    prependNotification(state, action) {
      state.notifications = [action.payload, ...state.notifications];
      if (!action.payload?.is_read) state.unreadCount += 1;
    },
    markNotificationRead(state, action) {
      const id = action.payload;
      state.notifications = state.notifications.map((item) => (item.id === id ? { ...item, is_read: true } : item));
      state.unreadCount = Math.max(0, state.notifications.filter((item) => !item.is_read).length);
    },
    markAllNotificationsRead(state) {
      state.notifications = state.notifications.map((item) => ({ ...item, is_read: true }));
      state.unreadCount = 0;
    },
  },
});

export const { setNotifications, prependNotification, markNotificationRead, markAllNotificationsRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
