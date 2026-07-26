// pages/PostDetailPage.jsx — Full post view with Socket.io real-time comments
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, MessageSquare, Bookmark, Share2, Flag, Trash2, BookmarkCheck } from 'lucide-react';
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';
import { useGetPostQuery, useVotePostMutation, useBookmarkPostMutation, useDeletePostMutation } from '../services/postsApi';
import { useGetCommentsQuery, useAddCommentMutation } from '../services/commentsApi';
import { selectIsAuthenticated, selectUser } from '../store/authSlice';
import { useSocket } from '../hooks/useSocket';
import VoteButton from '../components/posts/VoteButton';
import CommentThread from '../components/comments/CommentThread';
import CommentForm from '../components/comments/CommentForm';
import Spinner from '../components/shared/Spinner';
import Avatar from '../components/shared/Avatar';
import ReportModal from '../components/shared/ReportModal';

export default function PostDetailPage() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const isAuth         = useSelector(selectIsAuthenticated);
  const currentUser    = useSelector(selectUser);
  const [commentSort, setCommentSort] = useState('best');
  const [typers, setTypers]   = useState([]);     // who is typing
  const [bookmarked, setBookmarked] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Socket.io
  const { joinPost, leavePost, emitTyping, emitStopTyping } = useSocket();

  const { data: postData,     isLoading: postLoading,     isError: postError }
    = useGetPostQuery(id);
  const { data: commentsData, isLoading: commentsLoading, refetch: refetchComments }
    = useGetCommentsQuery({ postId: id, sort: commentSort }, { skip: !id });

  const [votePost]     = useVotePostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [deletePost]   = useDeletePostMutation();
  const [addComment]   = useAddCommentMutation();

  const post     = postData?.post;
  const comments = commentsData?.comments || [];
  const isAuthor = currentUser?._id === post?.author?._id;

  // ── Socket lifecycle ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    joinPost(id);

    // Listen for new comments emitted by server
    const handleNewComment = () => refetchComments();
    const handleTyping     = ({ username }) => {
      setTypers(prev => prev.includes(username) ? prev : [...prev, username]);
    };
    const handleStopTyping = ({ userId: uid }) => {
      setTypers(prev => prev.filter(u => u !== uid));
    };

    // Attach via window events (emitted from useSocket broadcast)
    window.addEventListener('socket:newComment', handleNewComment);
    window.addEventListener('socket:userTyping', handleTyping);
    window.addEventListener('socket:userStopTyping', handleStopTyping);

    return () => {
      leavePost(id);
      window.removeEventListener('socket:newComment', handleNewComment);
      window.removeEventListener('socket:userTyping', handleTyping);
      window.removeEventListener('socket:userStopTyping', handleStopTyping);
    };
  }, [id]);

  // ── Typing debounce ──────────────────────────────────────────────────────
  const handleTypingChange = useCallback(() => {
    emitTyping(id);
    const t = setTimeout(() => emitStopTyping(id), 2000);
    return () => clearTimeout(t);
  }, [id, emitTyping, emitStopTyping]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleVote = async (value) => {
    if (!isAuth) return toast.error('Sign in to vote');
    await votePost({ postId: post._id, value });
  };

  const handleBookmark = async () => {
    if (!isAuth) return toast.error('Sign in to save posts');
    await bookmarkPost(post._id);
    setBookmarked(b => !b);
    toast.success(bookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks');
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    await deletePost(post._id);
    toast.success('Post deleted');
    navigate('/');
  };

  const handleShare = () => {
    toast.success('Link copied to clipboard!');
  };

  const handleReport = () => {
    if (!isAuth) return toast.error('Sign in to report content');
    setIsReportOpen(true);
  };

  const handleAddComment = async (content) => {
    if (!isAuth) return toast.error('Sign in to comment');
    await addComment({ postId: post._id, content }).unwrap();
    refetchComments();
    emitStopTyping(id);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (postLoading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  );

  if (postError || !post) return (
    <div className="card text-center py-16">
      <p className="text-gray-500">Post not found or has been removed.</p>
      <button onClick={() => navigate(-1)} className="btn btn-outline mt-4">Go Back</button>
    </div>
  );

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn btn-ghost mb-4 gap-2 text-gray-500 -ml-2">
        <ArrowLeft size={16} /> Back
      </button>

      {/* ── Post card ──────────────────────────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        <div className="flex">
          {/* Vote column */}
          <div className="bg-gray-50 dark:bg-dark-border flex flex-col items-center pt-4 px-3 gap-1 min-w-[48px]">
            <VoteButton
              score={post.score}
              userVote={post.userVote}
              onVote={handleVote}
              vertical
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-5 min-w-0">
            {/* Meta */}
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 flex-wrap">
              {post.community && (
                <>
                  <Link
                    to={`/s/${post.community.slug}`}
                    className="font-semibold text-gray-700 hover:text-primary transition-colors"
                  >
                    s/{post.community.slug}
                  </Link>
                  <span>·</span>
                </>
              )}
              <span>Posted by</span>
              <Link to={`/u/${post.author?.username}`} className="hover:text-primary flex items-center gap-1">
                <Avatar user={post.author} size={16} />
                u/{post.author?.username}
              </Link>
              <span>·</span>
              <span>{post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ''}</span>
              {post.tags?.length > 0 && post.tags.map((tag) => (
                <span key={tag} className="badge badge-green">{tag}</span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900 leading-snug mb-4">{post.title}</h1>

            {/* Link post */}
            {post.type === 'link' && post.url && (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary text-sm hover:underline mb-4 bg-primary-50 px-3 py-1.5 rounded-[6px]"
              >
                🔗 {post.url}
              </a>
            )}

            {/* Rich text body */}
            {post.content && (
              <div
                className="prose prose-sm max-w-none text-gray-700 leading-relaxed mb-4"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
              />
            )}

            {/* Post image */}
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt={post.title}
                className="rounded-[8px] max-h-[500px] w-full object-cover mb-4 border border-gray-100"
              />
            )}

            {/* Actions bar */}
            <div className="flex items-center gap-1 mt-4 pt-4 border-t border-gray-100 flex-wrap">
              <button className="btn btn-ghost btn-sm gap-1.5 text-gray-500">
                <MessageSquare size={14} />
                {post.commentCount ?? comments.length} comments
              </button>
              <button
                onClick={handleBookmark}
                className={`btn btn-ghost btn-sm gap-1.5 transition-colors ${bookmarked ? 'text-primary' : 'text-gray-500'}`}
              >
                {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {bookmarked ? 'Saved' : 'Save'}
              </button>
              <button onClick={handleShare} className="btn btn-ghost btn-sm gap-1.5 text-gray-500">
                <Share2 size={14} /> Share
              </button>
              {isAuthor ? (
                <button
                  onClick={handleDelete}
                  className="btn btn-ghost btn-sm gap-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 ml-auto"
                >
                  <Trash2 size={14} /> Delete
                </button>
              ) : (
                <button 
                  onClick={handleReport}
                  className="btn btn-ghost btn-sm gap-1.5 text-gray-400 hover:text-red-500 ml-auto"
                >
                  <Flag size={14} /> Report
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetId={post._id}
        targetModel="Post"
      />

      {/* ── Comment section ────────────────────────────────────────────── */}
      <div className="mt-4 card">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-primary" />
          {post.commentCount ?? comments.length} Comments
        </h2>

        {/* Comment form */}
        {isAuth ? (
          <CommentForm
            postId={post._id}
            onSubmit={handleAddComment}
            onTyping={handleTypingChange}
          />
        ) : (
          <div className="bg-gray-50 rounded-[8px] p-4 text-center mb-6 border border-gray-100">
            <p className="text-sm text-gray-600">
              <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              {' '}to join the discussion
            </p>
          </div>
        )}

        {/* Typing indicator */}
        {typers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 animate-pulse">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>{typers.join(', ')} {typers.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}

        {/* Sort */}
        <div className="flex items-center gap-2 mb-4 mt-2">
          <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Sort by</span>
          {['best', 'new', 'top'].map((s) => (
            <button
              key={s}
              onClick={() => setCommentSort(s)}
              className={`text-xs px-2.5 py-1 rounded-full capitalize transition-colors ${
                commentSort === s
                  ? 'bg-primary text-white font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Comment tree */}
        {commentsLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : comments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            No comments yet. Start the conversation!
          </p>
        ) : (
          <div className="space-y-2">
            {comments.map((comment) => (
              <CommentThread
                key={comment._id}
                comment={comment}
                postId={post._id}
                depth={0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
