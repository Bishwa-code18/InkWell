// services/searchApi.js — RTK Query search endpoints
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';

export const searchApi = createApi({
  reducerPath: 'searchApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    search: builder.query({
      query: ({ q, type = 'all', page = 1, sort = 'relevance' }) => ({
        url: '/search',
        params: { q, type, page, sort },
      }),
    }),
  }),
});

export const { useSearchQuery } = searchApi;
