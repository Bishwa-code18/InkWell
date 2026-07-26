// components/posts/VoteButton.jsx — Up/down vote with optimistic updates
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useVote } from '../../hooks/useVote';
import { cn } from '../../utils/cn';
import { formatCount } from '../../utils/formatDate';

export default function VoteButton({ targetId, targetModel = 'Post', initialScore, initialVote, postId, vertical = true }) {
  const { score, userVote, vote, isVoting } = useVote({
    targetId,
    targetModel,
    initialScore,
    initialVote,
    postId,
  });

  if (vertical) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <button
          id={`upvote-${targetId}`}
          onClick={(e) => { e.stopPropagation(); vote(1); }}
          disabled={isVoting}
          className={cn('vote-btn', userVote === 1 && 'active-up')}
          aria-label="Upvote"
        >
          <ChevronUp size={16} strokeWidth={2.5} />
        </button>
        <span className={cn(
          'text-xs font-bold min-w-[24px] text-center',
          userVote === 1 ? 'text-primary' : userVote === -1 ? 'text-red-500' : 'text-gray-600'
        )}>
          {formatCount(score)}
        </span>
        <button
          id={`downvote-${targetId}`}
          onClick={(e) => { e.stopPropagation(); vote(-1); }}
          disabled={isVoting}
          className={cn('vote-btn', userVote === -1 && 'active-down')}
          aria-label="Downvote"
        >
          <ChevronDown size={16} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  // Horizontal layout (for comment cards)
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); vote(1); }}
        disabled={isVoting}
        className={cn('vote-btn w-6 h-6', userVote === 1 && 'active-up')}
        aria-label="Upvote"
      >
        <ChevronUp size={14} strokeWidth={2.5} />
      </button>
      <span className={cn('text-xs font-bold', userVote === 1 ? 'text-primary' : userVote === -1 ? 'text-red-500' : 'text-gray-600')}>
        {formatCount(score)}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); vote(-1); }}
        disabled={isVoting}
        className={cn('vote-btn w-6 h-6', userVote === -1 && 'active-down')}
        aria-label="Downvote"
      >
        <ChevronDown size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
