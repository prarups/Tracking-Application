import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NotificationItem } from '@/types';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  toastNotification: NotificationItem | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  toastNotification: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<NotificationItem[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.is_read).length;
    },
    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
      state.toastNotification = action.payload;
    },
    clearToast: (state) => {
      state.toastNotification = null;
    },
    markRead: (state, action: PayloadAction<number>) => {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif && !notif.is_read) {
        notif.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => (n.is_read = true));
      state.unreadCount = 0;
    },
  },
});

export const { setNotifications, addNotification, clearToast, markRead, markAllRead } =
  notificationSlice.actions;
export default notificationSlice.reducer;
