// components/comments/CommentThread.jsx — Recursive nested comment display
import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, Flag } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../../store/authSlice';
import VoteButton from '../posts/VoteButton';
import Avatar from '../shared/Avatar';
import CommentForm from './CommentForm';
import { timeAgo } from '../../utils/formatDate';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ReportModal from '../shared/ReportModal';

const INDENT_COLORS = ['border-gray-200', 'border-blue-200', 'border-purple-200', 'border-orange-200', 'border-green-200', 'border-pink-200'];

export default function CommentThread({ comment, postId, depth = 0 }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [collapsed, setCollapsed] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [children, setChildren] = useState(comment.children || []);
  const [isDeleted, setIsDeleted] = useState(comment.isDeleted || false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const isAuthor = user?._id === comment.author?._id;
  const borderColor = INDENT_COLORS[depth % INDENT_COLORS.length];

  const handleReply = (newComment) => {
    setChildren((prev) => [{ ...newComment, children: [] }, ...prev]);
    setShowReplyForm(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/posts/${postId}/comments/${comment._id}`);
      setIsDeleted(true);
      toast.success('Comment deleted.');
    } catch { toast.error('Failed to delete comment'); }
  };

  if (isDeleted && children.length === 0) return null;

  return (
    <div className={cn('relative', depth > 0 && `ml-6 pl-3 border-l-2 ${borderColor}`)}>
      {/* Comment Body */}
      <div className="py-2">
        {/* Author row */}
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="text-gray-300 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
          {!isDeleted && <Avatar user={comment.author} size="xs" />}
          {!isDeleted ? (
            <a href={`/u/${comment.author?.username}`}
               className="text-xs font-semibold text-gray-700 hover:text-primary cursor-pointer">
              u/{comment.author?.username}
            </a>
          ) : (
            <span className="text-xs text-gray-400 italic">[deleted]</span>
          )}
          <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
          {comment.score > 0 && (
            <span className="text-xs text-orange-500 font-medium ml-auto">{comment.score}pts</span>
          )}
        </div>

        {/* Content */}
        {!collapsed && (
          <>
            <p className={cn('text-sm text-gray-700 dark:text-gray-300 leading-relaxed ml-5 mb-2', isDeleted && 'text-gray-400 italic')}>
              {isDeleted ? '[This comment has been deleted]' : comment.body}
            </p>

            {/* Actions */}
            {!isDeleted && (
              <div className="flex items-center gap-3 ml-5">
                <div onClick={(e) => e.stopPropagation()}>
                  <VoteButton
                    targetId={comment._id}
                    targetModel="Comment"
                    initialScore={comment.score || 0}
                    initialVote={comment.userVote || 0}
                    postId={postId}
                    vertical={false}
                  />
                </div>
                {isAuthenticated && depth < 6 && (
                  <button
                    onClick={() => setShowReplyForm((v) => !v)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors"
                  >
                    <MessageSquare size={11} />
                    Reply
                  </button>
                )}
                {isAuthor && (
                  <button
                    onClick={handleDelete}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                )}
                {!isAuthor && isAuthenticated && (
                  <button
                    onClick={() => setIsReportOpen(true)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
                  >
                    <Flag size={11} className="inline mr-1" />
                    Report
                  </button>
                )}
              </div>
            )}

            {/* Reply form */}
            {showReplyForm && (
              <div className="mt-3 ml-5">
                <CommentForm
                  postId={postId}
                  parentId={comment._id}
                  onSuccess={handleReply}
                  onCancel={() => setShowReplyForm(false)}
                  placeholder={`Reply to ${comment.author?.username}...`}
                />
              </div>
            )}
            
            <ReportModal
              isOpen={isReportOpen}
              onClose={() => setIsReportOpen(false)}
              targetId={comment._id}
              targetModel="Comment"
            />
          </>
        )}
      </div>

      {/* Children */}
      {!collapsed && children.length > 0 && (
        <div>
          {children.map((child) => (
            <CommentThread key={child._id} comment={child} postId={postId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
