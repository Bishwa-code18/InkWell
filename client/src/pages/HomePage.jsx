// pages/HomePage.jsx — Live feed with RTK Query + infinite scroll
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Flame, Clock, TrendingUp, AlignJustify, List, LayoutGrid, PenSquare } from 'lucide-react';
import { useGetPostsQuery } from '../services/postsApi';
import { selectIsAuthenticated } from '../store/authSlice';
import PostCard from '../components/posts/PostCard';
import Spinner from '../components/shared/Spinner';

const SORTS = [
  { id: 'hot',  label: 'Hot',  icon: Flame },
  { id: 'new',  label: 'New',  icon: Clock },
  { id: 'top',  label: 'Top',  icon: TrendingUp },
];

const DENSITIES = [
  { id: 'card',    icon: AlignJustify, title: 'Card' },
  { id: 'compact', icon: List,         title: 'Compact' },
  { id: 'gallery', icon: LayoutGrid,   title: 'Gallery' },
];

export default function HomePage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [sort, setSort]       = useState('hot');
  const [density, setDensity] = useState('card');
  const [page, setPage]       = useState(1);
  const loaderRef             = useRef(null);

  const { data, isLoading, isFetching, isError } = useGetPostsQuery(
    { sort, page, limit: 15 },
    { refetchOnMountOrArgChange: true }
  );

  const posts   = data?.posts || [];
  const hasMore = data?.hasMore ?? false;

  // Reset page when sort changes
  useEffect(() => { setPage(1); }, [sort]);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !isFetching) {
      setPage((p) => p + 1);
    }
  }, [hasMore, isFetching]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="flex flex-col gap-0">

      {/* ── Composer bar (auth only) ───────────────────────────────────── */}
      {isAuthenticated && (
        <div className="bg-white border border-gray-200 rounded-[8px] p-3 mb-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <PenSquare size={14} className="text-primary" />
          </div>
          <Link
            to="/create-post"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-[4px] px-3 py-2 text-sm text-gray-400 hover:border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Share an idea with Inkwell...
          </Link>
          <Link to="/create-post" className="btn btn-primary btn-sm">Post</Link>
        </div>
      )}

      {/* ── Sort tabs + density toggle ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-[8px] mb-4">
        <div className="flex items-center justify-between px-2">
          {/* Sort tabs */}
          <div className="flex">
            {SORTS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSort(id)}
                className={`feed-tab flex items-center gap-1.5 ${sort === id ? 'active' : ''}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Density toggle */}
          <div className="flex items-center gap-1 pr-2">
            {DENSITIES.map(({ id, icon: Icon, title }) => (
              <button
                key={id}
                title={title}
                onClick={() => setDensity(id)}
                className={`p-1.5 rounded transition-colors ${
                  density === id
                    ? 'text-primary bg-primary-50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Post feed ─────────────────────────────────────────────────── */}
      {isLoading && page === 1 ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="card text-center py-12">
          <p className="text-red-500 font-medium mb-2">Failed to load posts</p>
          <p className="text-gray-500 text-sm">Check that the backend server is running at localhost:5000</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-gray-600 font-medium">No posts yet</p>
          <p className="text-gray-400 text-sm mt-1">Be the first to share something with Inkwell.</p>
          {isAuthenticated && (
            <Link to="/create-post" className="btn btn-primary mt-4 inline-flex">Create a Post</Link>
          )}
        </div>
      ) : (
        <div className={density === 'gallery' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
          {posts.map((post) => (
            <PostCard key={post._id} post={post} density={density} />
          ))}
        </div>
      )}

      {/* ── Infinite scroll loader ─────────────────────────────────────── */}
      <div ref={loaderRef} className="py-4 flex justify-center">
        {isFetching && page > 1 && <Spinner size="sm" />}
        {!hasMore && posts.length > 0 && (
          <p className="text-gray-400 text-xs">You've reached the end of Inkwell.</p>
        )}
      </div>
    </div>
  );
}
