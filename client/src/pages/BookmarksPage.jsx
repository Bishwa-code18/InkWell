// pages/BookmarksPage.jsx — Saved posts via RTK Query
import { Bookmark, BookmarkX } from 'lucide-react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useGetBookmarksQuery } from '../services/usersApi';
import { useBookmarkPostMutation } from '../services/postsApi';
import PostCard from '../components/posts/PostCard';
import Spinner from '../components/shared/Spinner';

export default function BookmarksPage() {
  const { data, isLoading, refetch } = useGetBookmarksQuery();
  const [unbookmark] = useBookmarkPostMutation();
  const posts = data?.posts || [];

  const handleRemove = async (postId, e) => {
    e.preventDefault();
    e.stopPropagation();
    await unbookmark(postId);
    refetch();
    toast.success('Removed from saved');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bookmark size={20} className="text-primary" />
            Saved Posts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {posts.length} post{posts.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : posts.length === 0 ? (
        <div className="card py-20 text-center">
          <Bookmark size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="font-semibold text-gray-700 mb-1">Nothing saved yet</p>
          <p className="text-sm text-gray-400">
            Bookmark posts to read them later. They'll show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post._id} className="relative group">
              <PostCard post={post} />
              <button
                onClick={(e) => handleRemove(post._id, e)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity btn btn-ghost btn-sm gap-1 text-red-400 hover:text-red-600 hover:bg-red-50 text-xs"
                title="Remove bookmark"
              >
                <BookmarkX size={14} />
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
