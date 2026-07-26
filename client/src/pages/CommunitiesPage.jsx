// pages/CommunitiesPage.jsx — Browse communities via RTK Query
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, TrendingUp, Zap, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/authSlice';
import { useGetCommunitiesQuery, useJoinCommunityMutation } from '../services/communitiesApi';
import Spinner from '../components/shared/Spinner';
import toast from 'react-hot-toast';

const SORT_TABS = [
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'newest',   label: 'Newest',   icon: Zap },
  { id: 'top',      label: 'Top',      icon: Users },
];

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function CommunitiesPage() {
  const isAuth = useSelector(selectIsAuthenticated);
  const [sort, setSort]     = useState('trending');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useGetCommunitiesQuery({ sort, limit: 24, search });
  const [joinCommunity]     = useJoinCommunityMutation();

  const communities = data?.communities || [];
  const filtered    = search
    ? communities.filter(c =>
        c.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        c.slug?.toLowerCase().includes(search.toLowerCase())
      )
    : communities;

  const handleJoin = async (slug, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuth) { toast.error('Sign in to join communities'); return; }
    await joinCommunity(slug);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
          <p className="text-sm text-gray-500 mt-0.5">Find your intellectual home</p>
        </div>
        {isAuth && (
          <Link to="/communities/create" className="btn btn-primary btn-sm gap-1.5">
            <Plus size={15} /> Create Community
          </Link>
        )}
      </div>

      {/* Search + Sort */}
      <div className="card p-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities..."
            className="input pl-8 py-1.5 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {SORT_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSort(id)}
              className={`btn btn-sm gap-1.5 ${sort === id ? 'btn-primary' : 'btn-outline'}`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500">No communities found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((c) => (
            <Link
              key={c._id}
              to={`/s/${c.slug}`}
              className="card hover:border-primary/30 hover:shadow-md transition-all duration-200 flex items-start gap-4 p-4 group"
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl text-white flex-shrink-0 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: c.color || '#1A6B47' }}
              >
                {(c.displayName || c.name || 'C').charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors">
                  {c.displayName || c.name}
                </h3>
                <p className="text-xs text-gray-400 mb-1">s/{c.slug}</p>
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{c.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users size={10} /> {formatCount(c.memberCount)} members
                  </span>
                  {c.postCount > 0 && (
                    <span>{formatCount(c.postCount)} posts</span>
                  )}
                </div>
              </div>

              {/* Join button */}
              <button
                id={`join-${c.slug}`}
                onClick={(e) => handleJoin(c.slug, e)}
                className={`btn btn-sm flex-shrink-0 text-xs ${c.isMember ? 'btn-outline' : 'btn-primary'}`}
              >
                {c.isMember ? '✓ Joined' : 'Join'}
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
