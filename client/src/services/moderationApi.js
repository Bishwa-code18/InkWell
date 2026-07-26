// services/moderationApi.js — RTK Query for moderation
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';

export const moderationApi = createApi({
  reducerPath: 'moderationApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Report', 'ModStats'],
  endpoints: (builder) => ({
    getReports: builder.query({
      query: (params) => ({
        url: '/moderation/reports',
        params,
      }),
      providesTags: ['Report'],
    }),
    
    getModStats: builder.query({
      query: () => ({ url: '/moderation/stats' }),
      providesTags: ['ModStats'],
    }),

    submitReport: builder.mutation({
      query: (data) => ({
        url: '/moderation/reports',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Report', 'ModStats'],
    }),

    resolveReport: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/moderation/reports/${id}/resolve`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['Report', 'ModStats'],
    }),
  }),
});

export const {
  useGetReportsQuery,
  useGetModStatsQuery,
  useSubmitReportMutation,
  useResolveReportMutation,
} = moderationApi;
