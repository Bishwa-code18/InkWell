// pages/CommunityPage.jsx — Community with RTK Query, join/leave, rules sidebar
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Flame, Clock, TrendingUp, Plus, CheckCircle, Shield } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../store/authSlice';
import PostCard from '../components/posts/PostCard';
import Spinner, { FullPageSpinner } from '../components/shared/Spinner';
import { useGetCommunityQuery, useJoinCommunityMutation, useLeaveCommunityMutation } from '../services/communitiesApi';
import { useGetPostsQuery } from '../services/postsApi';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const SORT = [
  { key: 'hot', label: 'Hot',  icon: Flame },
  { key: 'new', label: 'New',  icon: Clock },
  { key: 'top', label: 'Top',  icon: TrendingUp },
];

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function CommunityPage() {
  const { slug }       = useParams();
  const isAuth         = useSelector(selectIsAuthenticated);
  const currentUser    = useSelector(selectUser);
  const [sort, setSort]   = useState('hot');
  const [page, setPage]   = useState(1);

  const { data: communityData, isLoading: communityLoading } = useGetCommunityQuery(slug);
  const { data: postsData, isLoading: postsLoading, isFetching } = useGetPostsQuery({ sort, page, community: slug });

  const [joinCommunity]  = useJoinCommunityMutation();
  const [leaveCommunity] = useLeaveCommunityMutation();

  const community = communityData?.community;
  const posts     = postsData?.posts || [];
  const hasMore   = postsData?.hasMore ?? false;
  const isMember  = community?.isMember;
  const isMod     = community?.moderators?.some(m => m === currentUser?._id || m._id === currentUser?._id);

  const loadMore = () => { if (hasMore && !isFetching) setPage(p => p + 1); };
  const sentinelRef = useInfiniteScroll(loadMore, hasMore, isFetching);

  const handleJoinLeave = async () => {
    if (!isAuth) { toast.error('Sign in to join communities'); return; }
    try {
      if (isMember) {
        await leaveCommunity(slug);
        toast.success(`Left s/${slug}`);
      } else {
        await joinCommunity(slug);
        toast.success(`Joined s/${slug}! 🎉`);
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  if (communityLoading) return <FullPageSpinner />;
  if (!community) return (
    <div className="card py-20 text-center">
      <p className="text-gray-500">Community not found.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── Banner + Header ──────────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        {/* Banner */}
        <div
          className="h-28 w-full relative"
          style={{
            background: community.banner
              ? `url(${community.banner}) center/cover`
              : `linear-gradient(135deg, ${community.color || '#1A6B47'}, ${community.color || '#1A6B47'}88)`
          }}
        />

        <div className="px-5 pb-5">
          {/* Avatar + Actions */}
          <div className="flex items-end justify-between -mt-7 mb-4">
            <div
              className="w-14 h-14 rounded-xl border-4 border-white flex items-center justify-center font-bold text-2xl text-white flex-shrink-0"
              style={{ backgroundColor: community.color || '#1A6B47' }}
            >
              {community.displayName?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex items-center gap-2">
              {isMod && (
                <Link to={`/s/${slug}/mod`} className="btn btn-outline btn-sm gap-1.5 text-xs">
                  <Shield size={13} /> Mod Tools
                </Link>
              )}
              {isAuth && (
                <Link to={`/create-post?community=${slug}`} className="btn btn-outline btn-sm gap-1.5 text-xs">
                  <Plus size={13} /> Post
                </Link>
              )}
              <button
                id="join-community-btn"
                onClick={handleJoinLeave}
                className={`btn btn-sm gap-1.5 ${isMember ? 'btn-outline' : 'btn-primary'}`}
              >
                {isMember ? <><CheckCircle size={14} /> Joined</> : <><Plus size={14} /> Join</>}
              </button>
            </div>
          </div>

          {/* Info */}
          <h1 className="text-xl font-bold text-gray-900">{community.displayName}</h1>
          <p className="text-sm text-gray-400 mb-2">s/{community.slug}</p>
          {community.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-3">{community.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <Users size={12} /> {formatCount(community.memberCount)} members
            </span>
            {community.isVerified && (
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle size={12} /> Verified
              </span>
            )}
            <span>Founded {community.createdAt ? formatDistanceToNow(new Date(community.createdAt), { addSuffix: true }) : ''}</span>
          </div>

          {/* Topics */}
          {community.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {community.topics.map(t => (
                <span key={t} className="badge badge-green">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Sort + Feed ──────────────────────────────────────────────────── */}
      <div>
        {/* Sort tabs */}
        <div className="flex items-center gap-0 border-b border-gray-200 bg-white rounded-t-[8px] px-2">
          {SORT.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setSort(key); setPage(1); }}
              className={`feed-tab flex items-center gap-1.5 ${sort === key ? 'active' : ''}`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-3 mt-0">
          {posts.map((post) => <PostCard key={post._id} post={post} />)}
          {(postsLoading || isFetching) && (
            <div className="flex justify-center py-6"><Spinner /></div>
          )}
          {!postsLoading && !isFetching && posts.length === 0 && (
            <div className="card py-16 text-center">
              <p className="text-gray-400 text-sm">No posts yet in s/{slug}. Be the first!</p>
              {isAuth && (
                <Link to={`/create-post?community=${slug}`} className="btn btn-primary btn-sm mt-4 gap-1.5">
                  <Plus size={14} /> Create Post
                </Link>
              )}
            </div>
          )}
        </div>

        <div ref={sentinelRef} className="h-4" />
      </div>

      {/* ── Rules (below on mobile, sidebar-like on larger screens) ────── */}
      {community.rules?.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <Shield size={14} className="text-primary" /> Community Rules
          </h3>
          <ol className="space-y-3">
            {community.rules.map((rule, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="font-bold text-primary flex-shrink-0">{i + 1}.</span>
                <div>
                  <p className="font-medium text-gray-800">{rule.title}</p>
                  {rule.body && <p className="text-xs text-gray-500 mt-0.5">{rule.body}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
