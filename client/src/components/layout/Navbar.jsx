// components/layout/Navbar.jsx — Top navigation bar
import { Link, useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Search, Edit3, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useRef, useEffect } from 'react';
import { selectUser, selectIsAuthenticated } from '../../store/authSlice';
import { selectUnreadCount, togglePanel } from '../../store/notificationsSlice';
import { logoutUser } from '../../store/authSlice';
import { setSearchQuery } from '../../store/uiSlice';
import Avatar from '../shared/Avatar';
import NotificationPanel from './NotificationPanel';
import { cn } from '../../utils/cn';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const unreadCount = useSelector(selectUnreadCount);
  const [searchVal, setSearchVal] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      dispatch(setSearchQuery(searchVal));
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border h-14">
      <div className="flex items-center h-full px-4 gap-4 max-w-[1400px] mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold font-serif">IW</span>
          </div>
          <span className="font-serif text-lg font-semibold tracking-tight hidden sm:block">
            Inkwell
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {['Explore', 'Communities', 'Bookmarks'].map((item) => (
            <Link
              key={item}
              to={item === 'Explore' ? '/' : `/${item.toLowerCase()}`}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-dark-border"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              id="navbar-search"
              type="text"
              placeholder="Search Inkwell..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-100 dark:bg-dark-border border-0 rounded-full outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-400 transition-all"
            />
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <div className="relative">
                <button
                  id="notifications-btn"
                  onClick={() => dispatch(togglePanel())}
                  className="btn-ghost w-9 h-9 p-0 rounded-full relative"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationPanel />
              </div>

              {/* Messages */}
              <button className="btn-ghost w-9 h-9 p-0 rounded-full" aria-label="Messages">
                <MessageSquare size={18} />
              </button>

              {/* Create Post */}
              <Link
                to="/create-post"
                className="btn-primary btn-sm hidden sm:flex items-center gap-1.5 ml-1"
                id="create-post-btn"
              >
                <Edit3 size={14} />
                Create Post
              </Link>

              {/* User Menu */}
              <div className="relative ml-1" ref={userMenuRef}>
                <button
                  id="user-menu-btn"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                  aria-label="User menu"
                >
                  <Avatar src={user?.avatar} alt={user?.displayName} size="sm" />
                  <ChevronDown size={12} className="text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-[8px] shadow-xl py-1 animate-slide-up z-50">
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-dark-border">
                      <p className="text-sm font-medium truncate">{user?.displayName}</p>
                      <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
                    </div>
                    <Link to={`/u/${user?.username}`} className="nav-item mx-1 my-0.5" onClick={() => setUserMenuOpen(false)}>
                      <User size={14} /> Profile
                    </Link>
                    <Link to="/settings" className="nav-item mx-1 my-0.5" onClick={() => setUserMenuOpen(false)}>
                      <Settings size={14} /> Settings
                    </Link>
                    <hr className="border-gray-100 dark:border-dark-border my-1" />
                    <button
                      className="nav-item mx-1 my-0.5 w-[calc(100%-8px)] text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => { dispatch(logoutUser()); setUserMenuOpen(false); navigate('/'); }}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline btn-sm">Sign In</Link>
              <Link to="/register" className="btn-primary btn-sm">Join</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
