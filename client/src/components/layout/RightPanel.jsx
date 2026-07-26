// components/layout/RightPanel.jsx — 280px right sidebar with live trending data
import { Link } from 'react-router-dom';
import { TrendingUp, Plus, Users, Sparkles, Hash } from 'lucide-react';
import { useGetTrendingPostsQuery } from '../../services/postsApi';
import { useGetCommunitiesQuery } from '../../services/communitiesApi';
import Spinner from '../shared/Spinner';
import { formatCount } from '../../utils/formatDate';
import { cn } from '../../utils/cn';

export default function RightPanel() {
  const { 
    data: trendData, 
    isLoading: isTrendingLoading 
  } = useGetTrendingPostsQuery();

  const { 
    data: commData, 
    isLoading: isCommLoading 
  } = useGetCommunitiesQuery({ sort: 'trending', limit: 5 });

  const trending    = trendData?.posts?.slice(0, 4) || [];
  const communities = commData?.communities || [];

  return (
    <aside className="w-[280px] hidden lg:flex flex-col gap-4 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto pb-8 scrollbar-none">
      
      {/* Search Bar - Aesthetic placeholder or mini search */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
          <Hash size={14} />
        </div>
        <input 
          type="text" 
          placeholder="Search Inkwell..."
          className="w-full bg-white dark:bg-dark-sidebar border border-gray-100 dark:border-dark-border rounded-full py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
          onKeyDown={(e) => e.key === 'Enter' && (window.location.href = `/search?q=${e.target.value}`)}
        />
      </div>

      {/* Trending Topics */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <TrendingUp size={13} className="text-primary" /> Trending Now
          </h3>
          <Sparkles size={13} className="text-yellow-500 opacity-50" />
        </div>
        
        {isTrendingLoading ? (
          <div className="flex justify-center py-6"><Spinner size="sm" /></div>
        ) : trending.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic py-2">No trending posts found.</p>
        ) : (
          <div className="space-y-4">
            {trending.map((post) => (
              <Link 
                key={post._id} 
                to={`/post/${post._id}`}
                className="block group"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 bg-primary-50 dark:bg-primary/10 rounded uppercase">
                    {post.community?.displayName || 'News'}
                  </span>
                  <span className="text-[10px] text-gray-400">• {formatCount(post.score || 0)} pts</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {post.commentCount || 0} comments • {post.author?.username}
                </p>
              </Link>
            ))}
          </div>
        )}
        
        <Link to="/popular" className="block text-[11px] text-primary hover:underline font-bold pt-1">
          Explore Popular Feed
        </Link>
      </div>

      {/* Growing Communities */}
      <div className="card p-4 space-y-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Users size={13} className="text-blue-500" /> Growing Communities
        </h3>
        
        {isCommLoading ? (
          <div className="flex justify-center py-4"><Spinner size="sm" /></div>
        ) : (
          <div className="space-y-3">
            {communities.map((c) => (
              <div key={c._id} className="flex items-center justify-between gap-2">
                <Link to={`/s/${c.slug}`} className="flex items-center gap-2 min-w-0 group">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: c.color || '#1A6B47' }}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary truncate transition-colors">
                      s/{c.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {formatCount(c.memberCount || 0)} members
                    </p>
                  </div>
                </Link>
                <Link
                  to={`/s/${c.slug}`}
                  className="btn btn-outline btn-xs h-7 px-3 text-[10px] uppercase tracking-wider font-bold"
                >
                  Visit
                </Link>
              </div>
            ))}
          </div>
        )}
        
        <Link to="/communities" className="block text-[11px] text-primary hover:underline font-bold pt-1">
          Browse All Communities
        </Link>
      </div>

      {/* Build Your Presence card */}
      <div className="relative overflow-hidden rounded-[12px] p-5 text-white bg-gradient-to-br from-gray-900 to-primary shadow-xl group">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
        <div className="relative z-10">
          <p className="font-serif text-lg font-bold leading-tight mb-2">Curate Your Own Discourse</p>
          <p className="text-xs text-white/70 mb-4 leading-relaxed italic">
            "The secret of freedom lies in educating people, whereas the secret of tyranny is in keeping them ignorant."
          </p>
          <Link to="/communities/create" className="btn btn-sm w-full justify-center bg-white text-gray-900 hover:bg-gray-50 border-none font-bold text-[11px] uppercase tracking-widest shadow-lg">
            <Plus size={14} className="mr-1" /> Create Community
          </Link>
        </div>
      </div>

      {/* Footer links */}
      <div className="text-[10px] text-gray-400 px-1 py-4">
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
          {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Content Guidelines', 'Advertise', 'Help Center'].map((l) => (
            <a key={l} href="#" className="hover:text-primary transition-colors">{l}</a>
          ))}
        </div>
        <p className="font-medium tracking-wide">© 2024 INKWELL PLATFORM. PRODUCED BY THE INKWELL COLLECTIVE.</p>
      </div>
    </aside>
  );
}
