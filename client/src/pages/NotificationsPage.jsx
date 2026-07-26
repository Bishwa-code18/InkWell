// pages/NotificationsPage.jsx — Full notifications page with mark-read and delete
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Bell, Check, Trash2, MessageSquare, Heart, UserPlus, AtSign, Trophy, ShieldAlert, RefreshCw } from 'lucide-react';
import { markRead as markReadRedux, fetchNotifications, markAllNotificationsRead as markAllReadRedux } from '../store/notificationsSlice';
import { useGetNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } from '../services/usersApi';
import Avatar from '../components/shared/Avatar';
import Spinner from '../components/shared/Spinner';
import { timeAgo } from '../utils/formatDate';
import { cn } from '../utils/cn';

const TYPE_CONFIG = {
  upvote:     { icon: Heart,         color: 'text-orange-500', bg: 'bg-orange-50', label: 'upvoted your post' },
  comment:    { icon: MessageSquare, color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'commented' },
  reply:      { icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'replied' },
  follow:     { icon: UserPlus,      color: 'text-green-500',  bg: 'bg-green-50',  label: 'followed you' },
  mention:    { icon: AtSign,        color: 'text-purple-500', bg: 'bg-purple-50', label: 'mentioned you' },
  achievement:{ icon: Trophy,        color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'achievement unlocked' },
  modAction:  { icon: ShieldAlert,   color: 'text-red-500',    bg: 'bg-red-50',    label: 'mod action' },
};

const FILTERS = [
  { id: 'all',     label: 'All' },
  { id: 'unread',  label: 'Unread' },
  { id: 'upvote',  label: 'Upvotes' },
  { id: 'comment', label: 'Comments' },
  { id: 'follow',  label: 'Follows' },
];

export default function NotificationsPage() {
  const dispatch   = useDispatch();
  const [filter, setFilter] = useState('all');
  const [page, setPage]     = useState(1);

  const { data, isLoading, isFetching, refetch } = useGetNotificationsQuery({
    page,
    unreadOnly: filter === 'unread',
  });
  const [markRead]    = useMarkReadMutation();
  const [markAllRead] = useMarkAllReadMutation();

  const all          = data?.notifications || [];
  const unreadCount  = data?.unreadCount ?? 0;
  const total        = data?.total ?? 0;

  const filtered = filter === 'all' || filter === 'unread'
    ? all
    : all.filter(n => n.type === filter);

  const handleMarkOne = async (n) => {
    if (n.isRead) return;
    dispatch(markReadRedux(n._id));
    try {
      await markRead(n._id).unwrap();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAll = async () => {
    dispatch(markAllReadRedux());
    try {
      await markAllRead().unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const getLink = (n) => {
    if (n.post) return `/post/${n.post?._id || n.post}`;
    if (n.type === 'follow' && n.sender?.username) return `/u/${n.sender.username}`;
    return '#';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={20} className="text-primary" />
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="btn btn-ghost btn-sm p-2"
            title="Refresh"
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="btn btn-outline btn-sm gap-1.5"
            >
              <Check size={13} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setPage(1); }}
            className={`btn btn-sm whitespace-nowrap ${filter === f.id ? 'btn-primary' : 'btn-outline'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="card py-20 text-center">
          <Bell size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">No notifications</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here'}
          </p>
        </div>
      ) : (
        <div className="card p-0 divide-y divide-gray-50 overflow-hidden">
          {filtered.map((n) => {
            const cfg  = TYPE_CONFIG[n.type] || { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-50' };
            const Icon = cfg.icon;

            return (
              <Link
                key={n._id}
                to={getLink(n)}
                onClick={() => handleMarkOne(n)}
                className={cn(
                  'flex items-start gap-3 px-4 py-4 hover:bg-gray-50 transition-colors group',
                  !n.isRead && 'bg-primary-50/40'
                )}
              >
                {/* Avatar + icon */}
                <div className="relative flex-shrink-0">
                  {n.sender ? (
                    <Avatar user={n.sender} size={36} />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                      <Bell size={16} className="text-gray-400" />
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${cfg.bg}`}>
                    <Icon size={10} className={cfg.color} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-relaxed">{n.message}</p>
                  {n.post?.title && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">"{n.post.title}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>

                {/* Unread indicator */}
                {!n.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-outline btn-sm"
          >
            ← Previous
          </button>
          <span className="btn btn-ghost btn-sm pointer-events-none">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="btn btn-outline btn-sm"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
