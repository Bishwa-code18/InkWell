// components/layout/Sidebar.jsx — Left sidebar with live user communities
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Globe, Users, Settings, Plus, Bookmark, Bell, PenSquare, Shield } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAuthenticated } from '../../store/authSlice';
import { selectUnreadCount } from '../../store/notificationsSlice';
import { cn } from '../../utils/cn';

const PUBLIC_NAV = [
  { label: 'Home',        icon: Home,        to: '/',            id: 'nav-home'        },
  { label: 'Popular',     icon: TrendingUp,  to: '/popular',     id: 'nav-popular'     },
  { label: 'All',         icon: Globe,       to: '/all',         id: 'nav-all'         },
  { label: 'Communities', icon: Users,       to: '/communities', id: 'nav-communities' },
];

const AUTH_NAV = [
  { label: 'Bookmarks',     icon: Bookmark,    to: '/bookmarks',     id: 'nav-bookmarks'     },
  { label: 'Notifications', icon: Bell,        to: '/notifications', id: 'nav-notifications', badge: true },
  { label: 'Settings',      icon: Settings,    to: '/settings',      id: 'nav-settings'      },
];

export default function Sidebar() {
  const location      = useLocation();
  const user          = useSelector(selectUser);
  const isAuth        = useSelector(selectIsAuthenticated);
  const unreadCount   = useSelector(selectUnreadCount);

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  // User's joined communities (from Redux user object)
  const myCommunities = user?.communities?.slice(0, 8) || [];

  return (
    <aside className="w-[200px] flex-shrink-0 bg-sidebar dark:bg-dark-sidebar sticky top-14 h-[calc(100vh-56px)] overflow-y-auto border-r border-gray-200 dark:border-dark-border flex flex-col scrollbar-thin">
      {/* Brand */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-gray-900 dark:bg-dark-border rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold font-serif">I</span>
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Inkwell</p>
            <p className="text-[11px] text-gray-400 leading-tight uppercase tracking-wider">Intellectual Feed</p>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="px-2 mt-2 space-y-0.5" aria-label="Main navigation">
        {PUBLIC_NAV.map(({ label, icon: Icon, to, id }) => (
          <Link
            key={to}
            to={to}
            id={id}
            className={cn('nav-item', isActive(to) && 'active')}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}

        {/* Auth-only nav */}
        {isAuth && AUTH_NAV.map(({ label, icon: Icon, to, id, badge }) => (
          <Link
            key={to}
            to={to}
            id={id}
            className={cn('nav-item relative', isActive(to) && 'active')}
          >
            <Icon size={16} />
            {label}
            {badge && unreadCount > 0 && (
              <span className="ml-auto text-[10px] bg-primary text-white rounded-full px-1.5 py-0.5 leading-none font-bold min-w-[18px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        ))}

        {/* Mod-only link */}
        {isAuth && (user?.role === 'moderator' || user?.role === 'admin') && (
          <Link
            to="/mod"
            className={cn('nav-item text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10', isActive('/mod') && 'active bg-red-50 dark:bg-red-900/10')}
          >
            <Shield size={16} />
            Moderation
          </Link>
        )}
      </nav>

      {/* Create post shortcut */}
      {isAuth && (
        <div className="px-2 mt-3">
          <Link
            to="/create-post"
            id="sidebar-create-post"
            className="nav-item text-primary font-medium hover:bg-primary-50"
          >
            <PenSquare size={16} />
            Create Post
          </Link>
        </div>
      )}

      {/* Your Communities */}
      {isAuth && (
        <div className="mt-4 px-2">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Your Communities
            </p>
            <Link to="/communities/create" className="text-gray-400 hover:text-primary transition-colors">
              <Plus size={13} />
            </Link>
          </div>
          <div className="space-y-0.5">
            {myCommunities.length > 0 ? (
              myCommunities.map((c) => (
                <Link
                  key={c.slug || c._id}
                  to={`/s/${c.slug}`}
                  className={cn('nav-item', isActive(`/s/${c.slug}`) && 'active')}
                >
                  <span
                    className="community-dot"
                    style={{ backgroundColor: c.color || '#1A6B47' }}
                  />
                  <span className="truncate">{c.displayName || c.name}</span>
                </Link>
              ))
            ) : (
              <p className="text-xs text-gray-400 px-3 py-2">
                No communities yet.{' '}
                <Link to="/communities" className="text-primary hover:underline">Browse</Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom CTA */}
      <div className="px-3 py-4">
        <Link
          to={isAuth ? '/communities' : '/register'}
          id="sidebar-cta"
          className="btn btn-primary w-full justify-center text-sm"
        >
          <Plus size={14} />
          {isAuth ? 'Explore Communities' : 'Join Inkwell'}
        </Link>
        <div className="flex gap-3 mt-3 text-[11px] text-gray-400">
          <a href="#" className="hover:text-gray-600">Privacy</a>
          <a href="#" className="hover:text-gray-600">Terms</a>
          <a href="#" className="hover:text-gray-600">Help</a>
        </div>
      </div>
    </aside>
  );
}
