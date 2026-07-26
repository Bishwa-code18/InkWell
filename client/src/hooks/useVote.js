// hooks/useVote.js — Optimistic voting hook for posts and comments
import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/authSlice';
import { openModal } from '../store/uiSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * useVote — handles optimistic upvote/downvote for a post or comment.
 * @param {string} targetId - post or comment ID
 * @param {'Post'|'Comment'} targetModel
 * @param {number} initialScore - current score
 * @param {number} initialVote - user's current vote: 1 | 0 | -1
 * @param {string} postId - required for comments
 */
export const useVote = ({ targetId, targetModel, initialScore, initialVote = 0, postId }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [score, setScore] = useState(initialScore ?? 0);
  const [userVote, setUserVote] = useState(initialVote);
  const [isVoting, setIsVoting] = useState(false);

  const vote = useCallback(
    async (value) => {
      if (!isAuthenticated) {
        dispatch(openModal('login'));
        return;
      }

      if (isVoting) return;

      // Optimistic update
      const prevScore = score;
      const prevVote = userVote;

      let newScore = score;
      let newVote = value;

      if (userVote === value) {
        // Toggle off
        newVote = 0;
        newScore = score - value;
      } else if (userVote !== 0) {
        // Change direction
        newScore = score - userVote + value;
      } else {
        newScore = score + value;
      }

      setScore(newScore);
      setUserVote(newVote);
      setIsVoting(true);

      try {
        const url =
          targetModel === 'Comment'
            ? `/posts/${postId}/comments/${targetId}/vote`
            : `/posts/${targetId}/vote`;

        await api.post(url, { value });
      } catch (err) {
        // Rollback on error
        setScore(prevScore);
        setUserVote(prevVote);
        toast.error('Failed to register vote.');
      } finally {
        setIsVoting(false);
      }
    },
    [isAuthenticated, isVoting, score, userVote, targetId, targetModel, postId, dispatch]
  );

  return { score, userVote, vote, isVoting };
};
