// store/store.js — Redux store configuration
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import notificationsReducer from './notificationsSlice';
import { postsApi } from '../services/postsApi';
import { commentsApi } from '../services/commentsApi';
import { communitiesApi } from '../services/communitiesApi';
import { usersApi } from '../services/usersApi';
import { authApi } from '../services/authApi';
import { searchApi } from '../services/searchApi';
import { moderationApi } from '../services/moderationApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
    [postsApi.reducerPath]: postsApi.reducer,
    [commentsApi.reducerPath]: commentsApi.reducer,
    [communitiesApi.reducerPath]: communitiesApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [searchApi.reducerPath]: searchApi.reducer,
    [moderationApi.reducerPath]: moderationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/login/fulfilled'],
      },
    }).concat(
      postsApi.middleware,
      commentsApi.middleware,
      communitiesApi.middleware,
      usersApi.middleware,
      authApi.middleware,
      searchApi.middleware,
      moderationApi.middleware,
    ),
  devTools: import.meta.env.DEV,
});

export default store;
