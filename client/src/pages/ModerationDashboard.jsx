// pages/ModerationDashboard.jsx — Admin/Mod interface for reports and bans
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Users, 
  FileText, 
  Clock, 
  ArrowRight,
  MoreVertical,
  ExternalLink,
  Ban,
  Trash2,
  Search as SearchIcon,
  ShieldCheck
} from 'lucide-react';
import { useGetReportsQuery, useGetModStatsQuery, useResolveReportMutation } from '../services/moderationApi';
import { useSearchQuery } from '../services/searchApi';
import Spinner, { FullPageSpinner } from '../components/shared/Spinner';
import Avatar from '../components/shared/Avatar';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useUpdateUserMutation } from '../services/usersApi';

export default function ModerationDashboard() {
  const [activeTab, setActiveTab] = useState('pending');
  const [userSearch, setUserSearch] = useState('');
  const currentUser = useSelector(selectUser);
  const { data: statsData, isLoading: statsLoading } = useGetModStatsQuery();
  const { data: reportsData, isLoading: reportsLoading } = useGetReportsQuery({ status: activeTab }, { skip: activeTab === 'users' });
  const { data: userData, isLoading: userLoading } = useSearchQuery({ q: userSearch, type: 'users' }, { skip: activeTab !== 'users' || !userSearch });
  const [resolveReport] = useResolveReportMutation();
  const [updateUser] = useUpdateUserMutation();

  const reports = reportsData?.reports || [];
  const stats = statsData?.stats || {};

  const handleAction = async (reportId, action) => {
    try {
      await resolveReport({ 
        id: reportId, 
        status: action === 'dismiss' ? 'resolved' : 'resolved', // backend handles logic
        action: action 
      }).unwrap();
      toast.success(`Action: ${action} successful`);
    } catch (err) {
      toast.error(err?.data?.message || 'Action failed');
    }
  };

  if (statsLoading && reportsLoading) return <FullPageSpinner />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="text-primary" /> Moderation Hub
          </h1>
          <p className="text-sm text-gray-500">Protect the integrity of Inkwell.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Reports', value: stats.pendingReports, icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Banned Users', value: stats.bannedUsers, icon: Ban, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Total Content', value: stats.totalPosts, icon: FileText, color: 'text-primary', bg: 'bg-primary-50' },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <div className={`w-8 h-8 rounded-lg ${item.bg} ${item.color} flex items-center justify-center mb-3`}>
              <item.icon size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.value?.toLocaleString() || 0}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Report Management */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-dark-border">
          {['pending', 'resolved', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${
                activeTab === tab 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'users' ? 'User Manager' : `${tab} Reports`}
            </button>
          ))}
        </div>

        {activeTab === 'users' ? (
          <div className="p-6">
            <div className="relative mb-6">
              <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by username or display name..."
                className="input pl-12 h-12 text-sm"
              />
            </div>

            {userLoading ? (
              <div className="py-10 flex justify-center"><Spinner /></div>
            ) : !userSearch ? (
              <div className="py-20 text-center text-gray-400">
                <Users className="mx-auto mb-3 opacity-20" size={48} />
                <p>Search for a user to manage their permissions.</p>
              </div>
            ) : (userData?.results || []).length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <p>No users found matching "{userSearch}"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userData.results.map(u => (
                  <div key={u._id} className="p-4 rounded-xl border border-gray-100 dark:border-dark-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar user={u} size={48} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 dark:text-gray-100">{u.displayName || u.username}</p>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                            u.role === 'admin' ? 'bg-red-100 text-red-600' : 
                            u.role === 'moderator' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">u/{u.username} • {u.postKarma} karma</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {currentUser?.role === 'admin' && u._id !== currentUser?._id && (
                        <button 
                          onClick={async () => {
                            try {
                              const newRole = u.role === 'user' ? 'moderator' : 'user';
                              await updateUser({ id: u._id, role: newRole }).unwrap();
                              toast.success(`Role updated to ${newRole}`);
                            } catch (err) { 
                              toast.error(err?.data?.message || 'Failed to update role'); 
                            }
                          }}
                          className="btn btn-sm btn-ghost gap-1.5 text-xs"
                        >
                          <ShieldCheck size={14} /> {u.role === 'user' ? 'Make Mod' : 'Revoke Mod'}
                        </button>
                      )}
                      {u._id !== currentUser?._id && (
                        <button 
                          className={`btn btn-sm btn-outline gap-1.5 text-xs ${
                            u.isBanned 
                              ? 'text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200' 
                              : 'text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200'
                          }`}
                          onClick={async () => {
                            try {
                              const newBannedState = !u.isBanned;
                              await updateUser({ id: u._id, isBanned: newBannedState }).unwrap();
                              toast.success(newBannedState ? 'User banned successfully' : 'User unbanned successfully');
                            } catch (err) {
                              toast.error(err?.data?.message || 'Failed to update ban status');
                            }
                          }}
                        >
                          {u.isBanned ? (
                            <>
                              <ShieldCheck size={14} /> Unban
                            </>
                          ) : (
                            <>
                              <Ban size={14} /> Ban
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : reportsLoading ? (
          <div className="py-20 flex justify-center"><Spinner /></div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            <CheckCircle className="mx-auto mb-3 text-green-200" size={48} />
            <p className="font-medium">No {activeTab} reports.</p>
            <p className="text-xs mt-1">Great job! Inkwell is clean.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-dark-border">
            {reports.map((report) => (
              <div key={report._id} className="p-5 hover:bg-gray-50/50 dark:hover:bg-dark-border/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`mt-1 p-2 rounded-lg ${report.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-gray-100 dark:bg-dark-border rounded text-gray-500">
                          {report.targetModel}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          Reported by <span className="font-bold text-gray-700">u/{report.reporter?.username}</span>
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} /> {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                        Reason: {report.reason.replace('_', ' ')}
                      </p>
                      
                      {report.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-sidebar p-3 rounded-lg border border-gray-100 dark:border-dark-border mt-2 italic">
                          "{report.description}"
                        </p>
                      )}

                      {/* Target Preview */}
                      <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-dark-sidebar border border-dashed border-gray-200 dark:border-dark-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar user={report.target?.author} size={24} />
                            <span className="text-xs font-bold text-gray-700">u/{report.target?.author?.username || 'unknown'}</span>
                          </div>
                          <Link 
                            to={report.targetModel === 'Post' ? `/post/${report.target?._id}` : '#'} 
                            className="text-xs text-primary flex items-center gap-1 hover:underline"
                          >
                            View Original <ExternalLink size={12} />
                          </Link>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium line-clamp-2">
                          {report.target?.title || report.target?.content || 'Content not available'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {activeTab === 'pending' && (
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => handleAction(report._id, 'delete')}
                        className="btn btn-sm btn-outline text-red-500 hover:bg-red-50 hover:border-red-200 gap-1.5"
                        title="Delete Content"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                      <button 
                        onClick={() => handleAction(report._id, 'ban')}
                        className="btn btn-sm btn-outline text-gray-900 hover:bg-gray-900 hover:text-white gap-1.5"
                        title="Ban User"
                      >
                        <Ban size={14} /> Ban User
                      </button>
                      <button 
                        onClick={() => handleAction(report._id, 'dismiss')}
                        className="btn btn-sm btn-ghost text-gray-400 hover:text-gray-600 gap-1.5"
                        title="Dismiss"
                      >
                        <XCircle size={14} /> Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
