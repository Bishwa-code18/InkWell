// services/commentsApi.js — RTK Query comments endpoints
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';

export const commentsApi = createApi({
  reducerPath: 'commentsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Comments'],
  endpoints: (builder) => ({

    getComments: builder.query({
      query: ({ postId, sort = 'best' }) => ({
        url: `/posts/${postId}/comments`,
        params: { sort },
      }),
      providesTags: (result, error, { postId }) => [{ type: 'Comments', id: postId }],
    }),

    addComment: builder.mutation({
      query: ({ postId, content, parentId }) => ({
        url: `/posts/${postId}/comments`,
        method: 'POST',
        data: { content, parentId },
      }),
      invalidatesTags: (result, error, { postId }) => [{ type: 'Comments', id: postId }],
    }),

    editComment: builder.mutation({
      query: ({ postId, commentId, content }) => ({
        url: `/posts/${postId}/comments/${commentId}`,
        method: 'PUT',
        data: { content },
      }),
      invalidatesTags: (result, error, { postId }) => [{ type: 'Comments', id: postId }],
    }),

    deleteComment: builder.mutation({
      query: ({ postId, commentId }) => ({
        url: `/posts/${postId}/comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { postId }) => [{ type: 'Comments', id: postId }],
    }),

    voteComment: builder.mutation({
      query: ({ postId, commentId, value }) => ({
        url: `/posts/${postId}/comments/${commentId}/vote`,
        method: 'POST',
        data: { value },
      }),
    }),
  }),
});

export const {
  useGetCommentsQuery,
  useAddCommentMutation,
  useEditCommentMutation,
  useDeleteCommentMutation,
  useVoteCommentMutation,
} = commentsApi;
