// components/comments/CommentForm.jsx
import { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';
import Avatar from '../shared/Avatar';
import Spinner from '../shared/Spinner';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CommentForm({ postId, parentId = null, onSuccess, onCancel, placeholder = 'Share your thoughts...' }) {
  const user = useSelector(selectUser);
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;

    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { body: body.trim(), parentId });
      setBody('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      onSuccess?.(data.comment);
      toast.success('Comment posted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
    setBody(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-start">
      <Avatar src={user?.avatar} alt={user?.displayName} size="sm" className="flex-shrink-0 mt-1" />
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          id={`comment-form-${parentId || 'root'}`}
          value={body}
          onChange={autoResize}
          placeholder={placeholder}
          rows={2}
          className="input resize-none overflow-hidden w-full"
        />
        <div className="flex items-center justify-end gap-2 mt-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-ghost btn-sm">
              Cancel
            </button>
          )}
          <button type="submit" disabled={!body.trim() || isSubmitting} className="btn-primary btn-sm gap-1.5">
            {isSubmitting ? <Spinner size="sm" /> : <Send size={12} />}
            {parentId ? 'Reply' : 'Comment'}
          </button>
        </div>
      </div>
    </form>
  );
}
