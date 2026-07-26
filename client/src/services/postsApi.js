// services/postsApi.js — RTK Query endpoints for posts
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';

export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Post', 'Feed'],
  endpoints: (builder) => ({

    // ── Feed ──────────────────────────────────────────────────────────────────
    getPosts: builder.query({
      query: ({ sort = 'hot', page = 1, limit = 15, community } = {}) => ({
        url: '/posts',
        params: { sort, page, limit, ...(community ? { community } : {}) },
      }),
      serializeQueryArgs: ({ queryArgs }) => `${queryArgs.sort}-${queryArgs.community || 'home'}`,
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) return newItems;
        return {
          ...newItems,
          posts: [...(currentCache.posts || []), ...(newItems.posts || [])],
        };
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page || currentArg?.sort !== previousArg?.sort,
      providesTags: ['Feed'],
    }),

    // ── Single post ───────────────────────────────────────────────────────────
    getPost: builder.query({
      query: (id) => ({ url: `/posts/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),

    // ── Create ────────────────────────────────────────────────────────────────
    createPost: builder.mutation({
      query: (body) => ({ url: '/posts', method: 'POST', data: body }),
      invalidatesTags: ['Feed'],
    }),

    // ── Vote ──────────────────────────────────────────────────────────────────
    votePost: builder.mutation({
      query: ({ postId, value }) => ({
        url: `/posts/${postId}/vote`,
        method: 'POST',
        data: { value },
      }),
      // Optimistic update
      onQueryStarted: async ({ postId, value }, { dispatch, queryFulfilled, getState }) => {
        // Find and patch all cached feeds
        const patches = [];
        const state = getState();
        const queries = state.postsApi?.queries || {};
        for (const key of Object.keys(queries)) {
          if (key.startsWith('getPosts(')) {
            const patch = dispatch(
              postsApi.util.updateQueryData('getPosts', queries[key]?.originalArgs, (draft) => {
                const post = draft?.posts?.find((p) => p._id === postId);
                if (post) {
                  const prev = post.userVote;
                  post.userVote = prev === value ? 0 : value;
                  post.score = (post.score || 0) - (prev || 0) + post.userVote;
                }
              })
            );
            patches.push(patch);
          }
        }
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),

    // ── Bookmark ──────────────────────────────────────────────────────────────
    bookmarkPost: builder.mutation({
      query: (postId) => ({ url: `/posts/${postId}/bookmark`, method: 'POST' }),
      invalidatesTags: ['Feed', 'Bookmarks'],
    }),

    // ── Trending ──────────────────────────────────────────────────────────────
    getTrendingPosts: builder.query({
      query: () => ({ url: '/posts/trending' }),
    }),

    // ── Delete ────────────────────────────────────────────────────────────────
    deletePost: builder.mutation({
      query: (postId) => ({ url: `/posts/${postId}`, method: 'DELETE' }),
      invalidatesTags: ['Feed'],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostQuery,
  useGetTrendingPostsQuery,
  useCreatePostMutation,
  useVotePostMutation,
  useBookmarkPostMutation,
  useDeletePostMutation,
} = postsApi;
