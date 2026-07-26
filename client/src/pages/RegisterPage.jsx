// pages/RegisterPage.jsx — Live registration with RTK Query
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, AtSign, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRegisterMutation } from '../services/authApi';
import { setCredentials } from '../store/authSlice';

const schema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  username:        z.string().min(3, 'Username must be 3+ characters').max(20).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
  email:           z.string().email('Enter a valid email'),
  password:        z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const BENEFITS = [
  'Share original ideas with an engaged audience',
  'Build reputation through quality contributions',
  'Join specialized intellectual communities',
  'Real-time discussions, zero noise',
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function RegisterPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [showPw, setShowPw]   = useState(false);
  const [showCp, setShowCp]   = useState(false);

  const [register, { isLoading }] = useRegisterMutation();

  const { register: field, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    const { confirmPassword, ...userData } = values;
    try {
      const result = await register(userData).unwrap();
      dispatch(setCredentials({ user: result.user, token: result.accessToken }));
      toast.success(`Welcome to Inkwell, ${result.user.username}! 🎉`);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || 'Registration failed. Try again.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left hero panel ────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0d1f16 0%, #1A6B47 50%, #143d28 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'1\'%3E%3Cpath d=\'M0 0h40v1H0zM0 0v40h1V0z\'/%3E%3C/g%3E%3C/svg%3E")' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/10 rounded-[8px] flex items-center justify-center border border-white/20">
              <span className="text-white font-bold text-sm">IW</span>
            </div>
            <span className="text-white font-semibold tracking-tight">Inkwell</span>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-light text-white leading-tight mb-4">
            Join the intellectual discourse
          </h2>
          <ul className="space-y-3 mt-8">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-white/70 text-sm">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-white/30 text-xs">© 2024 Inkwell. All rights reserved.</div>
      </div>

      {/* ── Right form panel ───────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-[6px] flex items-center justify-center">
              <span className="text-white font-bold text-xs">IW</span>
            </div>
            <span className="font-semibold text-gray-900">Inkwell</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-gray-500 text-sm mb-8">Start your intellectual journey today</p>

          {/* OAuth */}
          <div className="flex flex-col gap-3 mb-6">
            <a href={`${API_URL}/auth/google`} className="btn btn-outline w-full gap-3 h-11">
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
              Sign up with Google
            </a>
            <a href={`${API_URL}/auth/github`} className="btn btn-dark w-full gap-3 h-11">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.02c-3.34.72-4.04-1.6-4.04-1.6-.54-1.38-1.33-1.75-1.33-1.75-1.08-.74.08-.73.08-.73 1.2.08 1.83 1.23 1.83 1.23 1.07 1.84 2.8 1.3 3.48 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.3.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.04.13 3 .4c2.28-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.9 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Sign up with GitHub
            </a>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-gray-50 text-xs text-gray-400">or email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...field('name')} placeholder="Jane Doe" className={`input pl-9 ${errors.name ? 'border-red-400' : ''}`} />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...field('username')} placeholder="janedoe" className={`input pl-9 ${errors.username ? 'border-red-400' : ''}`} />
              </div>
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...field('email')} type="email" placeholder="you@example.com" className={`input pl-9 ${errors.email ? 'border-red-400' : ''}`} />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...field('password')} type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" className={`input pl-9 pr-9 ${errors.password ? 'border-red-400' : ''}`} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="label">Confirm password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...field('confirmPassword')} type={showCp ? 'text' : 'password'} placeholder="Repeat password" className={`input pl-9 pr-9 ${errors.confirmPassword ? 'border-red-400' : ''}`} />
                <button type="button" onClick={() => setShowCp(!showCp)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCp ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <p className="text-xs text-gray-400">
              By joining, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{' '}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>

            <button type="submit" disabled={isLoading} className="btn btn-primary w-full h-11">
              {isLoading ? (
                <span className="flex items-center gap-2"><span className="spinner w-4 h-4" />Creating account...</span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already a member?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
