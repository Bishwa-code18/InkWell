// pages/SearchPage.jsx — Live search with discovery features and premium aesthetic
import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, Users, FileText, Hash, TrendingUp, Sparkles, UserPlus, ArrowRight, ChevronRight } from 'lucide-react';
import PostCard from '../components/posts/PostCard';
import Spinner from '../components/shared/Spinner';
import Avatar from '../components/shared/Avatar';
import { useSearchQuery } from '../services/searchApi';
import { useGetCommunitiesQuery } from '../services/communitiesApi';
import { useGetTrendingPostsQuery } from '../services/postsApi';

const TYPES = [
  { id: 'posts',       label: 'Posts',       icon: FileText },
  { id: 'communities', label: 'Communities', icon: Hash },
  { id: 'users',       label: 'Users',       icon: Users },
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const q              = searchParams.get('q') || '';
  const [type, setType]   = useState('posts');
  const [inputVal, setInputVal] = useState(q);

  // Discovery data for empty state
  const { data: trendingComms } = useGetCommunitiesQuery({ limit: 4 });
  const { data: trendingPosts } = useGetTrendingPostsQuery();

  // Update URL when user types (debounced)
  useEffect(() => {
    if (inputVal === q) return;
    const timer = setTimeout(() => {
      if (inputVal.trim()) {
        navigate(`/search?q=${encodeURIComponent(inputVal.trim())}`, { replace: true });
      } else {
        navigate('/search', { replace: true });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [inputVal, q, navigate]);

  // Sync input if URL changes
  useEffect(() => { setInputVal(q); }, [q]);

  const { data, isLoading, isFetching } = useSearchQuery(
    { q, type },
    { skip: !q.trim() }
  );
  const results = data?.results || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Search Header */}
      <div className="card overflow-hidden shadow-lg border-primary/5">
        <div className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-dark-sidebar dark:to-dark-bg">
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <Sparkles className="text-primary" size={24} /> Explore Inkwell
          </h1>
          <div className="relative group">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="search"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search concepts, communities, or scholars..."
              autoFocus
              className="w-full bg-white dark:bg-dark-sidebar border-2 border-gray-100 dark:border-dark-border focus:border-primary/50 rounded-2xl pl-12 pr-4 py-4 text-lg outline-none transition-all shadow-sm focus:shadow-md"
            />
          </div>
        </div>

        {/* Type tabs */}
        <div className="flex border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-sidebar">
          {TYPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setType(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${
                type === id 
                  ? 'border-primary text-primary bg-primary-50/30' 
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Discovery View (Empty State) */}
      {!q ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Suggested Communities */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Hash size={14} className="text-primary" /> Growing Communities
              </h2>
              <Link to="/communities" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trendingComms?.communities?.slice(0, 4).map((c) => (
                <Link
                  key={c._id}
                  to={`/s/${c.slug}`}
                  className="card p-4 flex items-center gap-4 hover:border-primary/30 transition-all group"
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-serif text-xl font-bold flex-shrink-0"
                    style={{ backgroundColor: c.color || '#1A6B47' }}
                  >
                    {c.displayName?.[0] || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">s/{c.slug}</p>
                    <p className="text-xs text-gray-500">{c.memberCount?.toLocaleString()} members</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </section>

          {/* Trending Posts */}
          <section>
            <div className="flex items-center mb-4 px-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <TrendingUp size={14} className="text-primary" /> Intellectual Peaks
              </h2>
            </div>
            <div className="space-y-4">
              {trendingPosts?.posts?.slice(0, 3).map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-gray-500">
              {isFetching ? (
                <span className="flex items-center gap-2"><Spinner size="xs" /> Resonating...</span>
              ) : (
                <>Found <span className="font-bold text-gray-900 dark:text-gray-100">{results.length}</span> {type} for "{q}"</>
              )}
            </p>
          </div>

          {isLoading || isFetching ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
              <Spinner size="lg" />
              <p className="text-sm font-serif italic text-gray-400">Seeking knowledge...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="card py-24 text-center">
              <Search size={48} className="mx-auto mb-4 text-gray-100" />
              <p className="text-lg font-serif font-medium text-gray-900 dark:text-gray-100">No {type} resonate with "{q}"</p>
              <p className="text-sm text-gray-500 mt-1">Try broad concepts or different perspectives.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {type === 'posts' && results.map((post) => <PostCard key={post._id} post={post} />)}
              
              {type === 'communities' && (
                <div className="grid gap-3">
                  {results.map((c) => (
                    <Link
                      key={c._id}
                      to={`/s/${c.slug}`}
                      className="card p-5 flex items-center gap-4 hover:border-primary/30 hover:shadow-md transition-all group"
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-serif text-2xl font-bold flex-shrink-0"
                        style={{ backgroundColor: c.color || '#1A6B47' }}
                      >
                        {c.displayName?.[0] || 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                            {c.displayName}
                          </h3>
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-gray-100 dark:bg-dark-border rounded text-gray-400">
                            s/{c.slug}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">{c.description || 'A gathering place for thinkers.'}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Users size={12} /> {c.memberCount?.toLocaleString()} members
                          </span>
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm rounded-xl">Visit</button>
                    </Link>
                  ))}
                </div>
              )}

              {type === 'users' && (
                <div className="grid gap-3">
                  {results.map((u) => (
                    <Link
                      key={u._id}
                      to={`/u/${u.username}`}
                      className="card p-5 flex items-center gap-4 hover:border-primary/30 transition-all group"
                    >
                      <Avatar user={u} size={56} className="ring-2 ring-transparent group-hover:ring-primary/20 transition-all" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                          {u.displayName || u.username}
                        </h3>
                        <p className="text-xs text-gray-400">u/{u.username}</p>
                        {u.bio && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">{u.bio}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{u.postKarma?.toLocaleString() || 0}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Karma</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
