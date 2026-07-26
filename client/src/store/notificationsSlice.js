// store/notificationsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, { rejectWithValue }) => {
  try {
    // Lazy import to break the circular dependency chain
    const { default: api } = await import('../services/api');
    const { data } = await api.get('/notifications');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async () => {
  const { default: api } = await import('../services/api');
  await api.put('/notifications/read-all');
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    isLoading: false,
    panelOpen: false,
  },
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    togglePanel: (state) => { state.panelOpen = !state.panelOpen; },
    closePanel: (state) => { state.panelOpen = false; },
    markRead: (state, action) => {
      const n = state.items.find((i) => i._id === action.payload);
      if (n && !n.isRead) { n.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.isLoading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.isRead = true; });
        state.unreadCount = 0;
      });
  },
});

export const { addNotification, togglePanel, closePanel, markRead } = notificationsSlice.actions;
export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectPanelOpen = (state) => state.notifications.panelOpen;

export default notificationsSlice.reducer;
