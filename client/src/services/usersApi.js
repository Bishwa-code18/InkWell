// services/usersApi.js — RTK Query user profile & settings endpoints
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['User', 'Me', 'Notifications', 'Bookmarks'],
  endpoints: (builder) => ({

    getMe: builder.query({
      query: () => ({ url: '/users/me' }),
      providesTags: ['Me'],
    }),

    updateProfile: builder.mutation({
      query: (data) => ({ url: '/users/me', method: 'PUT', data }),
      invalidatesTags: ['Me'],
    }),

    updateSettings: builder.mutation({
      query: (settings) => ({ url: '/users/me/settings', method: 'PUT', data: settings }),
      invalidatesTags: ['Me'],
    }),

    updatePassword: builder.mutation({
      query: (data) => ({ url: '/users/me/password', method: 'PUT', data }),
    }),

    getUser: builder.query({
      query: (username) => ({ url: `/users/${username}` }),
      providesTags: (result, error, username) => [{ type: 'User', id: username }],
    }),

    getUserPosts: builder.query({
      query: ({ username, page = 1 }) => ({
        url: `/users/${username}/posts`,
        params: { page },
      }),
    }),

    getUserComments: builder.query({
      query: ({ username, page = 1 }) => ({
        url: `/users/${username}/comments`,
        params: { page },
      }),
    }),

    getBookmarks: builder.query({
      query: ({ page = 1 } = {}) => ({
        url: '/users/me/saved',
        params: { page },
      }),
      providesTags: ['Bookmarks'],
    }),

    getNotifications: builder.query({
      query: ({ page = 1, unreadOnly = false } = {}) => ({
        url: '/notifications',
        params: { page, unreadOnly },
      }),
      providesTags: ['Notifications'],
    }),

    markRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),

    markAllRead: builder.mutation({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),

    followUser: builder.mutation({
      query: (username) => ({ url: `/users/${username}/follow`, method: 'POST' }),
      invalidatesTags: (result, error, username) => [{ type: 'User', id: username }],
    }),

    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/moderation/users/${id}`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id: id }, 'ModStats'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useUpdateProfileMutation,
  useUpdateSettingsMutation,
  useUpdatePasswordMutation,
  useGetUserQuery,
  useGetUserPostsQuery,
  useGetUserCommentsQuery,
  useGetBookmarksQuery,
  useGetNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useFollowUserMutation,
  useUpdateUserMutation,
} = usersApi;
