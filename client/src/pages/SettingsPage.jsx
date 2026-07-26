// pages/SettingsPage.jsx — Full settings with avatar upload, RTK Query, and tabbed UI
import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Bell, Shield, Palette, LogOut, Camera,
  Save, Eye, EyeOff, Trash2, CheckCircle, AlertCircle
} from 'lucide-react';
import { selectUser, logoutUser } from '../store/authSlice';
import { setDarkMode } from '../store/uiSlice';
import {
  useUpdateProfileMutation,
  useUpdateSettingsMutation,
  useUpdatePasswordMutation,
} from '../services/usersApi';
import { updateUserSettings } from '../store/authSlice';
import Toggle from '../components/shared/Toggle';
import Spinner from '../components/shared/Spinner';
import api from '../services/api';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

const TABS = [
  { key: 'profile',       label: 'Profile',        icon: User },
  { key: 'preferences',   label: 'Preferences',    icon: Palette },
  { key: 'notifications', label: 'Notifications',  icon: Bell },
  { key: 'security',      label: 'Security',       icon: Shield },
];

const profileSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio:         z.string().max(300).optional(),
  location:    z.string().max(100).optional(),
  website:     z.string().max(200).optional(),
  institution: z.string().max(100).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword:     z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function SettingsPage() {
  const dispatch  = useDispatch();
  const user      = useSelector(selectUser);
  const [tab, setTab]         = useState('profile');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview]     = useState(null);
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const fileRef = useRef(null);

  const [updateProfile, { isLoading: profileSaving }] = useUpdateProfileMutation();
  const [updateSettings]  = useUpdateSettingsMutation();
  const [updatePassword, { isLoading: pwSaving }]     = useUpdatePasswordMutation();

  // Profile form
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      bio:         user?.bio || '',
      location:    user?.location || '',
      website:     user?.website || '',
      institution: user?.institution || '',
    },
  });

  // Password form
  const { register: regPw, handleSubmit: handlePw, reset: resetPw, formState: { errors: pwErrors } }
    = useForm({ resolver: zodResolver(passwordSchema) });

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }

    // Instant preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await updateProfile({ avatar: data.url }).unwrap();
      toast.success('Avatar updated!');
    } catch { toast.error('Upload failed'); setAvatarPreview(null); }
    finally { setAvatarUploading(false); }
  };

  // ── Profile save ─────────────────────────────────────────────────────────
  const onProfileSave = async (values) => {
    try {
      await updateProfile(values).unwrap();
      toast.success('Profile saved ✓');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save');
    }
  };

  // ── Setting toggle helper ─────────────────────────────────────────────────
  const handleSetting = async (key, val) => {
    dispatch(updateUserSettings({ [key]: val }));
    if (key === 'darkMode') dispatch(setDarkMode(val));
    try {
      await updateSettings({ [key]: val }).unwrap();
    } catch { toast.error('Failed to save setting'); }
  };

  // ── Password change ───────────────────────────────────────────────────────
  const onPasswordSave = async (values) => {
    try {
      await updatePassword({
        currentPassword: values.currentPassword,
        newPassword:     values.newPassword,
      }).unwrap();
      toast.success('Password updated!');
      resetPw();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update password');
    }
  };

  const currentAvatar = avatarPreview || user?.avatar;
  const avatarInitial = (user?.displayName || user?.username)?.charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Settings</h1>

      <div className="flex gap-5">
        {/* Tab nav */}
        <nav className="w-44 flex-shrink-0 space-y-0.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              id={`settings-tab-${key}`}
              onClick={() => setTab(key)}
              className={cn('nav-item w-full text-left', tab === key && 'active')}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
          <hr className="border-gray-100 my-2" />
          <button
            className="nav-item w-full text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => dispatch(logoutUser())}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </nav>

        {/* Content panel */}
        <div className="flex-1 card min-h-[400px]">

          {/* ─── Profile tab ─────────────────────────────────────────── */}
          {tab === 'profile' && (
            <form onSubmit={handleSubmit(onProfileSave)} className="space-y-5">
              <h2 className="font-semibold text-sm text-gray-700 border-b border-gray-100 pb-3">
                Profile Information
              </h2>

              {/* Avatar upload */}
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-full border-2 border-gray-200 overflow-hidden bg-primary flex items-center justify-center">
                    {currentAvatar ? (
                      <img src={currentAvatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-2xl">{avatarInitial}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    {avatarUploading
                      ? <Spinner size="sm" className="text-white" />
                      : <Camera size={16} className="text-white" />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Profile Photo</p>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP · Max 5MB</p>
                  <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-primary hover:underline mt-1">
                    Change photo
                  </button>
                </div>
              </div>

              {/* Fields */}
              {[
                { id: 'displayName', label: 'Display Name',  placeholder: 'Your name',           type: 'text' },
                { id: 'location',    label: 'Location',       placeholder: 'City, Country',       type: 'text' },
                { id: 'institution', label: 'Institution',    placeholder: 'University / Company', type: 'text' },
                { id: 'website',     label: 'Website',        placeholder: 'https://...',          type: 'url' },
              ].map(({ id, label, placeholder, type }) => (
                <div key={id}>
                  <label className="label" htmlFor={id}>{label}</label>
                  <input
                    id={id}
                    type={type}
                    {...register(id)}
                    placeholder={placeholder}
                    className={`input ${errors[id] ? 'border-red-400' : ''}`}
                  />
                  {errors[id] && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors[id].message}
                    </p>
                  )}
                </div>
              ))}

              <div>
                <label className="label" htmlFor="bio">Bio <span className="text-gray-400 font-normal">(max 300)</span></label>
                <textarea
                  id="bio"
                  {...register('bio')}
                  rows={3}
                  placeholder="Tell Inkwell about yourself..."
                  className="input resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!isDirty || profileSaving}
                className="btn btn-primary gap-2"
              >
                {profileSaving
                  ? <><Spinner size="sm" /> Saving...</>
                  : <><Save size={14} /> Save Changes</>}
              </button>
            </form>
          )}

          {/* ─── Preferences tab ─────────────────────────────────────── */}
          {tab === 'preferences' && (
            <div className="space-y-5">
              <h2 className="font-semibold text-sm text-gray-700 border-b border-gray-100 pb-3">
                Preferences
              </h2>

              <Toggle
                label="Dark Mode"
                description="Use the dark theme throughout Inkwell"
                icon={<Palette size={15} />}
                checked={user?.settings?.darkMode ?? false}
                onChange={(v) => handleSetting('darkMode', v)}
              />

              <hr className="border-gray-100" />

              <div>
                <label className="label" htmlFor="density">Content Density</label>
                <select
                  id="density"
                  className="input max-w-[220px]"
                  value={user?.settings?.contentDensity || 'classy'}
                  onChange={(e) => handleSetting('contentDensity', e.target.value)}
                >
                  <option value="classy">Card (Default)</option>
                  <option value="compact">Compact List</option>
                  <option value="gallery">Gallery</option>
                </select>
              </div>

              <hr className="border-gray-100" />

              <Toggle
                label="Show Adult Content"
                description="Display NSFW posts in your feed"
                checked={user?.settings?.adultContent ?? false}
                onChange={(v) => handleSetting('adultContent', v)}
              />

              <Toggle
                label="Auto-play Media"
                description="Automatically play videos and GIFs"
                checked={user?.settings?.autoPlayMedia ?? true}
                onChange={(v) => handleSetting('autoPlayMedia', v)}
              />
            </div>
          )}

          {/* ─── Notifications tab ───────────────────────────────────── */}
          {tab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="font-semibold text-sm text-gray-700 border-b border-gray-100 pb-3">
                Notification Preferences
              </h2>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">In-App</p>
                {[
                  { key: 'comments',  label: 'Comments on your posts',  desc: 'Get notified when someone comments' },
                  { key: 'replies',   label: 'Replies to your comments', desc: 'Follow-up replies to your comments' },
                  { key: 'upvotes',   label: 'Upvotes',                  desc: 'When your post gets upvoted' },
                  { key: 'follows',   label: 'New followers',            desc: 'When someone follows you' },
                  { key: 'mentions',  label: 'Mentions',                 desc: 'When someone mentions @you' },
                ].map(({ key, label, desc }) => (
                  <Toggle
                    key={key}
                    label={label}
                    description={desc}
                    icon={<Bell size={14} />}
                    checked={user?.settings?.inAppNotifications?.[key] ?? true}
                    onChange={(v) => handleSetting('inAppNotifications', {
                      ...(user?.settings?.inAppNotifications || {}),
                      [key]: v,
                    })}
                  />
                ))}
              </div>

              <hr className="border-gray-100" />

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Email</p>
                {[
                  { key: 'weeklyDigest',   label: 'Weekly Digest',    desc: 'Best of Inkwell every week' },
                  { key: 'newFollower',    label: 'New Followers',     desc: 'Email when someone follows you' },
                  { key: 'securityAlerts', label: 'Security Alerts',   desc: 'Critical account activity' },
                ].map(({ key, label, desc }) => (
                  <Toggle
                    key={key}
                    label={label}
                    description={desc}
                    checked={user?.settings?.emailNotifications?.[key] ?? true}
                    onChange={(v) => handleSetting('emailNotifications', {
                      ...(user?.settings?.emailNotifications || {}),
                      [key]: v,
                    })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ─── Security tab ────────────────────────────────────────── */}
          {tab === 'security' && (
            <div className="space-y-6">
              <h2 className="font-semibold text-sm text-gray-700 border-b border-gray-100 pb-3">
                Security
              </h2>

              {/* Account info */}
              <div className="bg-gray-50 rounded-[8px] p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Account</p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Email: </span>{user?.email}
                </p>
                {user?.isVerified && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle size={12} /> Email verified
                  </p>
                )}
              </div>

              {/* Password change */}
              <form onSubmit={handlePw(onPasswordSave)} className="space-y-4">
                <h3 className="font-medium text-sm text-gray-700">Change Password</h3>

                {[
                  { id: 'currentPassword', label: 'Current Password', show: showCurrent, toggle: setShowCurrent },
                  { id: 'newPassword',     label: 'New Password',     show: showNew,     toggle: setShowNew },
                  { id: 'confirmPassword', label: 'Confirm New',      show: showConfirm, toggle: setShowConfirm },
                ].map(({ id, label, show, toggle }) => (
                  <div key={id}>
                    <label className="label" htmlFor={id}>{label}</label>
                    <div className="relative">
                      <input
                        id={id}
                        type={show ? 'text' : 'password'}
                        {...regPw(id)}
                        placeholder="••••••••"
                        className={`input pr-10 max-w-xs ${pwErrors[id] ? 'border-red-400' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => toggle(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {show ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {pwErrors[id] && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {pwErrors[id].message}
                      </p>
                    )}
                  </div>
                ))}

                <button type="submit" disabled={pwSaving} className="btn btn-primary gap-2">
                  {pwSaving ? <><Spinner size="sm" /> Updating...</> : <><Shield size={14} /> Update Password</>}
                </button>
              </form>

              {/* Danger zone */}
              <div className="border border-red-200 rounded-[8px] p-4 mt-6">
                <h3 className="font-semibold text-sm text-red-600 mb-1 flex items-center gap-1.5">
                  <AlertCircle size={14} /> Danger Zone
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Permanently delete your account and all associated data. This cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return;
                    try {
                      await api.delete('/users/me');
                      dispatch(logoutUser());
                      toast.success('Account deleted');
                    } catch { toast.error('Failed to delete account'); }
                  }}
                  className="btn btn-sm bg-red-500 hover:bg-red-600 text-white gap-1.5"
                >
                  <Trash2 size={13} /> Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
