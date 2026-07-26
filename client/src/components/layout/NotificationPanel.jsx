// components/layout/NotificationPanel.jsx — Full real-time notification panel
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, Check, X, MessageSquare, Heart, UserPlus, AtSign, Trophy, ShieldAlert, Trash2 } from 'lucide-react';
import {
  selectNotifications,
  selectPanelOpen,
  closePanel,
  markRead,
  fetchNotifications,
  markAllNotificationsRead,
} from '../../store/notificationsSlice';
import Avatar from '../shared/Avatar';
import { timeAgo } from '../../utils/formatDate';
import { cn } from '../../utils/cn';

const TYPE_CONFIG = {
  upvote:    { icon: Heart,       color: 'text-orange-500', bg: 'bg-orange-50' },
  comment:   { icon: MessageSquare, color: 'text-blue-500',  bg: 'bg-blue-50'  },
  reply:     { icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  follow:    { icon: UserPlus,    color: 'text-green-500', bg: 'bg-green-50' },
  mention:   { icon: AtSign,      color: 'text-purple-500', bg: 'bg-purple-50' },
  achievement:{ icon: Trophy,     color: 'text-yellow-500', bg: 'bg-yellow-50' },
  modAction: { icon: ShieldAlert, color: 'text-red-500',    bg: 'bg-red-50'   },
};

function NotifIcon({ type }) {
  const cfg = TYPE_CONFIG[type] || { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-50' };
  const Icon = cfg.icon;
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
      <Icon size={13} className={cfg.color} />
    </div>
  );
}

export default function NotificationPanel() {
  const dispatch      = useDispatch();
  const isOpen        = useSelector(selectPanelOpen);
  const notifications = useSelector(selectNotifications);
  const panelRef      = useRef(null);

  // Load notifications when panel opens
  useEffect(() => {
    if (isOpen) dispatch(fetchNotifications());
  }, [isOpen, dispatch]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        dispatch(closePanel());
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const unread = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const handleNotifClick = (n) => {
    if (!n.isRead) dispatch(markRead(n._id));
    dispatch(closePanel());
  };

  const getLink = (n) => {
    if (n.post?._id || n.post) return `/post/${n.post?._id || n.post}`;
    if (n.sender?.username && n.type === 'follow') return `/u/${n.sender.username}`;
    return '#';
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[340px] bg-white border border-gray-200 rounded-[10px] shadow-2xl z-50 animate-slide-up overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-primary" />
          <span className="font-semibold text-sm text-gray-900">Notifications</span>
          {unread > 0 && (
            <span className="text-xs bg-primary text-white rounded-full px-1.5 py-0.5 leading-none">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-ghost p-1 text-xs gap-1 text-gray-500 hover:text-primary"
              title="Mark all read"
            >
              <Check size={12} /> All read
            </button>
          )}
          <button
            onClick={() => dispatch(closePanel())}
            className="btn btn-ghost p-1.5 text-gray-400 hover:text-gray-700"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <Bell size={36} className="mb-3 opacity-20" />
            <p className="text-sm font-medium text-gray-500">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <Link
              key={n._id}
              to={getLink(n)}
              onClick={() => handleNotifClick(n)}
              className={cn(
                'flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group',
                !n.isRead && 'bg-primary-50/40'
              )}
            >
              {/* Sender avatar */}
              <div className="relative flex-shrink-0 mt-0.5">
                {n.sender ? (
                  <Avatar user={n.sender} size={32} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Bell size={14} className="text-gray-400" />
                  </div>
                )}
                {/* Type icon overlay */}
                <div className="absolute -bottom-1 -right-1">
                  <NotifIcon type={n.type} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 leading-relaxed">
                  {n.message}
                </p>
                {n.post?.title && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    "{n.post.title}"
                  </p>
                )}
                <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
              </div>

              {/* Unread dot */}
              {!n.isRead && (
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              )}
            </Link>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-2.5 text-center">
          <Link
            to="/notifications"
            onClick={() => dispatch(closePanel())}
            className="text-xs text-primary hover:underline font-medium"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
