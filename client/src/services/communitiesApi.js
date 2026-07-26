// services/communitiesApi.js — RTK Query communities endpoints
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';

export const communitiesApi = createApi({
  reducerPath: 'communitiesApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Community', 'Communities'],
  endpoints: (builder) => ({

    getCommunities: builder.query({
      query: ({ page = 1, limit = 20, sort = 'members', search } = {}) => ({
        url: '/communities',
        params: { page, limit, sort, ...(search ? { search } : {}) },
      }),
      providesTags: ['Communities'],
    }),

    getCommunity: builder.query({
      query: (slug) => ({ url: `/communities/${slug}` }),
      providesTags: (result, error, slug) => [{ type: 'Community', id: slug }],
    }),

    createCommunity: builder.mutation({
      query: (data) => ({ url: '/communities', method: 'POST', data }),
      invalidatesTags: ['Communities'],
    }),

    joinCommunity: builder.mutation({
      query: (slug) => ({ url: `/communities/${slug}/join`, method: 'POST' }),
      invalidatesTags: (result, error, slug) => [{ type: 'Community', id: slug }, 'Communities'],
    }),

    leaveCommunity: builder.mutation({
      query: (slug) => ({ url: `/communities/${slug}/leave`, method: 'POST' }),
      invalidatesTags: (result, error, slug) => [{ type: 'Community', id: slug }, 'Communities'],
    }),

    updateCommunity: builder.mutation({
      query: ({ slug, ...data }) => ({
        url: `/communities/${slug}`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: (result, error, { slug }) => [{ type: 'Community', id: slug }],
    }),
  }),
});

export const {
  useGetCommunitiesQuery,
  useGetCommunityQuery,
  useCreateCommunityMutation,
  useJoinCommunityMutation,
  useLeaveCommunityMutation,
  useUpdateCommunityMutation,
} = communitiesApi;
