// components/posts/PostCard.jsx — Post card with live RTK Query voting
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MessageSquare, Bookmark, Share2, ExternalLink, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useVotePostMutation, useBookmarkPostMutation } from '../../services/postsApi';
import { selectIsAuthenticated } from '../../store/authSlice';
import VoteButton from './VoteButton';
import Avatar from '../shared/Avatar';
import ReportModal from '../shared/ReportModal';
import { useState } from 'react';
import { cn } from '../../utils/cn';

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function PostCard({ post, density = 'card' }) {
  const isAuth          = useSelector(selectIsAuthenticated);
  const [votePost]     = useVotePostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const navigate        = useNavigate();
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleVote = async (e, value) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuth) { toast.error('Sign in to vote'); return; }
    await votePost({ postId: post._id, value });
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuth) { toast.error('Sign in to save posts'); return; }
    await bookmarkPost(post._id);
    toast.success('Saved!');
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
    toast.success('Link copied!');
  };

  const handleReport = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuth) { toast.error('Sign in to report content'); return; }
    setIsReportOpen(true);
  };

  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : '';

  // ── Compact density ────────────────────────────────────────────────────────
  if (density === 'compact') {
    return (
      <Link
        to={`/post/${post._id}`}
        className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
      >
        {/* Vote inline */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.preventDefault()}>
          <button onClick={(e) => handleVote(e, 1)} className={`vote-btn w-6 h-6 ${post.userVote === 1 ? 'active-up' : ''}`}>▲</button>
          <span className="text-xs font-semibold text-gray-700 w-6 text-center">{formatCount(post.score)}</span>
          <button onClick={(e) => handleVote(e, -1)} className={`vote-btn w-6 h-6 ${post.userVote === -1 ? 'active-down' : ''}`}>▼</button>
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-gray-800 group-hover:text-primary transition-colors line-clamp-1">
            {post.title}
          </span>
          <div className="text-xs text-gray-400 mt-0.5">
            {post.community?.name && <span>s/{post.community.slug} · </span>}
            {post.commentCount ?? 0} comments · {timeAgo}
          </div>
        </div>

        {post.type === 'link' && <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />}
      </Link>
    );
  }

  // ── Gallery density ────────────────────────────────────────────────────────
  if (density === 'gallery') {
    return (
      <Link to={`/post/${post._id}`} className="post-card block group overflow-hidden p-0">
        {post.imageUrl && (
          <div className="h-40 overflow-hidden">
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}
        <div className={`p-3 ${!post.imageUrl ? 'h-full flex flex-col justify-between' : ''}`}>
          <div className="text-xs text-gray-400 mb-1">
            {post.community?.slug && <span>s/{post.community.slug} · </span>}
            {timeAgo}
          </div>
          <p className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-0.5">▲ {formatCount(post.score)}</span>
            <span className="flex items-center gap-1"><MessageSquare size={11} /> {post.commentCount ?? 0}</span>
          </div>
        </div>
      </Link>
    );
  }

  // ── Card density (default) ─────────────────────────────────────────────────
  return (
    <div
      onClick={() => navigate(`/post/${post._id}`)}
      className="post-card flex gap-3 group cursor-pointer"
    >
      {/* Vote column */}
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0" onClick={(e) => e.preventDefault()}>
        <VoteButton
          score={post.score}
          userVote={post.userVote}
          onVote={(val) => handleVote({ preventDefault: () => {}, stopPropagation: () => {} }, val)}
          vertical
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Meta */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 flex-wrap">
          {post.community?.slug && (
            <Link to={`/s/${post.community.slug}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-gray-600 hover:text-primary">
              s/{post.community.slug}
            </Link>
          )}
          {post.community?.slug && <span>·</span>}
          <Link
            to={`/u/${post.author?.username}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Avatar user={post.author} size={16} />
            <span className="hover:underline">u/{post.author?.username}</span>
          </Link>
          <span>·</span>
          <span>{timeAgo}</span>
          {post.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="badge badge-green">{tag}</span>
          ))}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 leading-snug mb-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>

        {/* Link preview */}
        {post.type === 'link' && post.url && (
          <div className="flex items-center gap-1 text-xs text-primary mb-2">
            <ExternalLink size={11} />
            <span className="truncate max-w-xs">{post.url}</span>
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
        )}

        {/* Thumbnail */}
        {post.imageUrl && (
          <img src={post.imageUrl} alt="" className="rounded-[6px] h-32 w-full object-cover mb-3" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 -ml-2">
          <button onClick={(e) => { e.preventDefault(); }} className="btn btn-ghost btn-sm gap-1 text-gray-500 text-xs hover:text-gray-700">
            <MessageSquare size={13} />
            {formatCount(post.commentCount ?? 0)} comments
          </button>
          <button onClick={handleBookmark} className="btn btn-ghost btn-sm gap-1 text-gray-500 text-xs hover:text-gray-700">
            <Bookmark size={13} />
            Save
          </button>
          <button onClick={handleShare} className="btn btn-ghost btn-sm gap-1 text-gray-500 text-xs hover:text-gray-700">
            <Share2 size={13} />
            Share
          </button>
          <button onClick={handleReport} className="btn btn-ghost btn-sm gap-1 text-gray-500 text-xs hover:text-red-500 ml-auto">
            <Flag size={13} />
            Report
          </button>
        </div>
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetId={post._id}
        targetModel="Post"
      />
    </div>
  );
}
