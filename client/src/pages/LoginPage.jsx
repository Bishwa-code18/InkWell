import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLoginMutation } from '../services/authApi';
import { setCredentials } from '../store/authSlice';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function LoginPage() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || '/';
  const [showPw, setShowPw] = useState(false);

  // Handle OAuth errors from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    const provider = params.get('provider');

    if (error === 'oauth_not_configured') {
      toast.error(`${provider} Login is not configured. Please set up your Client ID in the .env file.`, {
        duration: 5000,
        icon: '🔑'
      });
      // Clear URL params
      navigate('/login', { replace: true });
    } else if (error === 'google_failed' || error === 'github_failed') {
      toast.error('OAuth login failed. Please try again or use email.');
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  const [login, { isLoading }] = useLoginMutation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    try {
      const result = await login(values).unwrap();
      dispatch(setCredentials({ user: result.user, token: result.accessToken }));
      toast.success(`Welcome back, ${result.user.username}!`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d1f16 0%, #1A6B47 60%, #0d1f16 100%)' }}
      >
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-[8px] flex items-center justify-center border border-white/20">
              <span className="text-white font-bold text-sm">IW</span>
            </div>
            <div>
              <div className="text-white font-semibold tracking-tight">Inkwell</div>
              <div className="text-white/50 text-xs uppercase tracking-widest">Intellectual Community</div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <blockquote className="text-3xl font-light text-white leading-snug mb-8">
            "Where Ideas Find<br />Their Audience"
          </blockquote>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Join a curated community of thinkers, writers, and intellectuals.
            Share insights that matter. Build reputation through quality discourse.
          </p>
          <div className="grid grid-cols-3 gap-6 mt-10">
            {[['10k+', 'Active Writers'], ['500+', 'Communities'], ['95%', 'Signal Ratio']].map(([n, l]) => (
              <div key={l}>
                <div className="text-2xl font-bold text-white">{n}</div>
                <div className="text-white/50 text-xs mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/30 text-xs">© 2024 Inkwell</div>
      </div>

      {/* ── Right panel (form) ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-[6px] flex items-center justify-center">
              <span className="text-white font-bold text-xs">IW</span>
            </div>
            <span className="font-semibold text-gray-900">Inkwell</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to your Inkwell account</p>

          {/* OAuth buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <a
              href={`${API_URL}/auth/google`}
              className="btn btn-outline w-full gap-3 h-11"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
              Continue with Google
            </a>
            <a
              href={`${API_URL}/auth/github`}
              className="btn btn-dark w-full gap-3 h-11"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.02c-3.34.72-4.04-1.6-4.04-1.6-.54-1.38-1.33-1.75-1.33-1.75-1.08-.74.08-.73.08-.73 1.2.08 1.83 1.23 1.83 1.23 1.07 1.84 2.8 1.3 3.48 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.3.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.04.13 3 .4c2.28-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.9 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Continue with GitHub
            </a>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-gray-50 text-xs text-gray-400">or continue with email</span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className={`input pl-9 ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input pl-9 pr-9 ${errors.password ? 'border-red-400' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full h-11 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner w-4 h-4" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            New to Inkwell?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
