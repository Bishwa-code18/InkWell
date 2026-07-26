// pages/ProfilePage.jsx — Premium user profile with RTK Query
import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import {
  MapPin, Link as LinkIcon, Calendar, Edit2,
  UserPlus, UserCheck, Star, Bookmark, MessageSquare, FileText, Camera
} from 'lucide-react';
import {
  useGetUserQuery, useGetUserPostsQuery, useGetUserCommentsQuery,
  useFollowUserMutation, useUpdateProfileMutation
} from '../services/usersApi';
import { useGetBookmarksQuery } from '../services/usersApi';
import { selectUser, selectIsAuthenticated } from '../store/authSlice';
import PostCard from '../components/posts/PostCard';
import Spinner from '../components/shared/Spinner';
import Avatar from '../components/shared/Avatar';
import toast from 'react-hot-toast';
import api from '../services/api';
import { cn } from '../utils/cn';

const TABS = [
  { id: 'Posts',     icon: FileText },
  { id: 'Comments',  icon: MessageSquare },
  { id: 'Bookmarks', icon: Bookmark },
  { id: 'About',     icon: Star },
];

const REPUTATION_TIERS = [
  { min: 10000, label: 'Luminary',   color: '#F59E0B', emoji: '🌟' },
  { min: 5000,  label: 'Scholar',    color: '#8B5CF6', emoji: '📚' },
  { min: 1000,  label: 'Thinker',    color: '#3B82F6', emoji: '💡' },
  { min: 100,   label: 'Initiate',   color: '#10B981', emoji: '🌱' },
  { min: 0,     label: 'Newcomer',   color: '#6B7280', emoji: '👋' },
];

function reputationTier(rep = 0) {
  return REPUTATION_TIERS.find(t => rep >= t.min) || REPUTATION_TIERS.at(-1);
}

export default function ProfilePage() {
  const { username }    = useParams();
  const currentUser     = useSelector(selectUser);
  const isAuth          = useSelector(selectIsAuthenticated);
  const [tab, setTab]   = useState('Posts');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef(null);

  const { data: userData, isLoading: userLoading, refetch: refetchUser }
    = useGetUserQuery(username);
  const { data: postsData,    isLoading: postsLoading }
    = useGetUserPostsQuery({ username }, { skip: tab !== 'Posts' });
  const { data: commentsData, isLoading: commentsLoading }
    = useGetUserCommentsQuery({ username }, { skip: tab !== 'Comments' });
  const { data: bookmarksData, isLoading: bookmarksLoading }
    = useGetBookmarksQuery({}, { skip: tab !== 'Bookmarks' || !isAuth });

  const [followUser]     = useFollowUserMutation();
  const [updateProfile]  = useUpdateProfileMutation();

  const user     = userData?.user;
  const posts    = postsData?.posts || [];
  const comments = commentsData?.comments || [];
  const bookmarks = bookmarksData?.posts || [];
  const isOwn    = currentUser?.username === username;
  const tier     = reputationTier(user?.reputation);

  const handleFollow = async () => {
    if (!isAuth) { toast.error('Sign in to follow users'); return; }
    try {
      await followUser(username).unwrap();
      toast.success(user?.isFollowing ? 'Unfollowed' : `Following u/${username}!`);
    } catch { toast.error('Something went wrong'); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await updateProfile({ avatar: data.url }).unwrap();
      await refetchUser();
      toast.success('Avatar updated!');
    } catch { toast.error('Upload failed'); }
    finally { setAvatarUploading(false); }
  };

  if (userLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!user) return <div className="card text-center py-16"><p className="text-gray-500">User not found.</p></div>;

  return (
    <div>
      {/* ── Header card ─────────────────────────────────────────────────── */}
      <div className="card p-0 overflow-hidden mb-4">
        {/* Cover gradient */}
        <div
          className="h-36 w-full relative"
          style={{
            background: user.coverColor ||
              `linear-gradient(135deg, ${tier.color}88, ${tier.color}33)`,
          }}
        >
          {/* Reputation tier chip */}
          <div
            className="absolute top-3 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-sm"
            style={{ backgroundColor: `${tier.color}cc` }}
          >
            {tier.emoji} {tier.label}
          </div>
        </div>

        <div className="px-5 pb-5">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-primary shadow-md">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary">
                    <span className="text-white font-bold text-3xl">
                      {(user.displayName || user.username)?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {/* Avatar upload overlay for own profile */}
              {isOwn && (
                <>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Change avatar"
                  >
                    {avatarUploading
                      ? <Spinner size="sm" className="text-white" />
                      : <Camera size={18} className="text-white" />}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isOwn ? (
                <Link to="/settings" className="btn btn-outline btn-sm gap-1.5">
                  <Edit2 size={13} /> Edit Profile
                </Link>
              ) : (
                <>
                  <button
                    id="follow-btn"
                    onClick={handleFollow}
                    className={`btn btn-sm gap-1.5 ${user.isFollowing ? 'btn-outline' : 'btn-primary'}`}
                  >
                    {user.isFollowing
                      ? <><UserCheck size={14} /> Following</>
                      : <><UserPlus size={14} /> Follow</>}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name + bio */}
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            {user.displayName || user.username}
          </h1>
          <p className="text-sm text-gray-400 mb-1">u/{user.username}</p>
          {user.bio && (
            <p className="text-sm text-gray-600 leading-relaxed mt-2 max-w-lg">{user.bio}</p>
          )}

          {/* Meta links */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-400">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {user.location}
              </span>
            )}
            {user.website && (
              <a
                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <LinkIcon size={11} />
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              Joined {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'long ago'}
            </span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-gray-100">
            {[
              { label: 'Post Karma',    val: user.postKarma ?? 0 },
              { label: 'Comment Karma', val: user.commentKarma ?? 0 },
              { label: 'Followers',     val: user.followerCount ?? 0 },
              { label: 'Reputation',    val: user.reputation ?? 0 },
            ].map(({ label, val }) => (
              <div key={label} className="text-center py-1">
                <div className="text-lg font-bold text-gray-900">{val?.toLocaleString()}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200 mb-4 bg-white rounded-t-[8px] px-2 overflow-x-auto scrollbar-none">
        {TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`feed-tab flex items-center gap-1.5 whitespace-nowrap ${tab === id ? 'active' : ''}`}
          >
            <Icon size={13} /> {id}
          </button>
        ))}
      </div>

      {/* ── Posts ───────────────────────────────────────────────────────── */}
      {tab === 'Posts' && (
        postsLoading
          ? <div className="flex justify-center py-12"><Spinner /></div>
          : posts.length === 0
            ? <div className="card text-center py-14"><p className="text-gray-400 text-sm">No posts yet.</p></div>
            : <div className="flex flex-col gap-3">{posts.map(p => <PostCard key={p._id} post={p} />)}</div>
      )}

      {/* ── Comments ────────────────────────────────────────────────────── */}
      {tab === 'Comments' && (
        commentsLoading
          ? <div className="flex justify-center py-12"><Spinner /></div>
          : comments.length === 0
            ? <div className="card text-center py-14"><p className="text-gray-400 text-sm">No comments yet.</p></div>
            : (
              <div className="flex flex-col gap-2">
                {comments.map(c => (
                  <div key={c._id} className="card py-3.5 hover:shadow-sm transition-shadow">
                    <div className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                      <MessageSquare size={11} />
                      <Link to={`/post/${c.post?._id}`} className="text-primary hover:underline font-medium truncate">
                        {c.post?.title || 'View post'}
                      </Link>
                      <span>·</span>
                      <span>{c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{c.body || c.content}</p>
                  </div>
                ))}
              </div>
            )
      )}

      {/* ── Bookmarks (own profile only) ─────────────────────────────── */}
      {tab === 'Bookmarks' && (
        !isOwn
          ? <div className="card text-center py-14"><p className="text-gray-400 text-sm">Bookmarks are private.</p></div>
          : bookmarksLoading
            ? <div className="flex justify-center py-12"><Spinner /></div>
            : bookmarks.length === 0
              ? <div className="card text-center py-14"><p className="text-gray-400 text-sm">No saved posts yet.</p></div>
              : <div className="flex flex-col gap-3">{bookmarks.map(p => <PostCard key={p._id} post={p} />)}</div>
      )}

      {/* ── About ───────────────────────────────────────────────────────── */}
      {tab === 'About' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">About u/{user.username}</h3>
            {user.bio
              ? <p className="text-gray-600 text-sm leading-relaxed">{user.bio}</p>
              : <p className="text-gray-400 text-sm italic">No bio yet.</p>
            }
            {user.institution && (
              <p className="text-sm text-gray-500 mt-3 flex items-center gap-1.5">
                🏛️ {user.institution}
              </p>
            )}
          </div>

          {/* Achievements */}
          {user.achievements?.length > 0 && (
            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Star size={15} className="text-yellow-500" /> Achievements
              </h4>
              <div className="flex flex-wrap gap-2">
                {user.achievements.map((a, i) => (
                  <div
                    key={a._id || i}
                    title={a.description}
                    className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full text-xs font-medium"
                  >
                    <span>{a.icon}</span> {a.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics of interest */}
          {user.topics?.length > 0 && (
            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-3">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {user.topics.map(t => (
                  <span key={t} className="badge badge-green">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
