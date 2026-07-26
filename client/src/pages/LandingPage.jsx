// pages/LandingPage.jsx — Inkwell Landing Page with GSAP Sticky Horizontal Gallery
import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  PenLine, Users, TrendingUp, Shield, Sparkles, Zap,
  MessageCircle, Star, ArrowRight, ChevronRight,
  Award, Eye, Lock
} from 'lucide-react';
import LightRays from '../components/effects/LightRays';

gsap.registerPlugin(ScrollTrigger);

// ── Gallery Slides Data ────────────────────────────────────────────────────
const GALLERY_SLIDES = [
  {
    id: 1,
    title: 'Rich Text Editor',
    subtitle: 'Write with power',
    description: 'A beautiful, distraction-free writing experience with full formatting support — code blocks, pull quotes, embedded images, and real-time collaboration.',
    image: '/gallery-editor.png',
    accent: '#1A6B47',
    tag: 'CREATE',
  },
  {
    id: 2,
    title: 'Vibrant Communities',
    subtitle: 'Find your tribe',
    description: 'Join salons dedicated to philosophy, science, technology, literature, and more. Each community is curated by passionate moderators.',
    image: '/gallery-communities.png',
    accent: '#7C3AED',
    tag: 'EXPLORE',
  },
  {
    id: 3,
    title: 'Thoughtful Discourse',
    subtitle: 'Ideas, not noise',
    description: 'Threaded conversations with voting, meaningful replies, and moderation tools that elevate quality over volume.',
    image: '/gallery-discourse.png',
    accent: '#0EA5E9',
    tag: 'DISCUSS',
  },
  {
    id: 4,
    title: 'Build Your Reputation',
    subtitle: 'Earn recognition',
    description: 'Contribution scores, achievement badges, and a rich profile showcase your intellectual footprint across the platform.',
    image: '/gallery-reputation.png',
    accent: '#F59E0B',
    tag: 'GROW',
  },
  {
    id: 5,
    title: 'Real-Time Pulse',
    subtitle: 'Never miss a beat',
    description: 'Instant notifications for upvotes, replies, mentions, and new followers. Stay connected to the conversations that matter.',
    image: '/gallery-realtime.png',
    accent: '#EF4444',
    tag: 'CONNECT',
  },
];

// ── Features Data ──────────────────────────────────────────────────────────
const FEATURES = [
  { icon: PenLine, title: 'Rich Editor', desc: 'TipTap-powered editor with code blocks, images & formatting' },
  { icon: Users, title: 'Communities', desc: 'Create and join topic-based salons with custom moderation' },
  { icon: TrendingUp, title: 'Smart Feed', desc: 'Hot, New, and Top algorithms surface the best content' },
  { icon: Shield, title: 'Moderation', desc: 'Built-in tools for content review, reports & community health' },
  { icon: Sparkles, title: 'Reputation', desc: 'Earn points and badges for quality contributions' },
  { icon: Zap, title: 'Real-Time', desc: 'WebSocket-powered notifications and live updates' },
];

// ── How It Works ───────────────────────────────────────────────────────────
const STEPS = [
  {
    step: '01',
    title: 'Create your identity',
    description: 'Sign up in seconds. Set up your profile, pick your interests, and choose the salons that resonate with you.',
    icon: PenLine,
    accent: '#1A6B47',
  },
  {
    step: '02',
    title: 'Join the conversation',
    description: 'Explore communities, publish your first essay, or jump into a thread. Every voice shapes the discourse.',
    icon: MessageCircle,
    accent: '#7C3AED',
  },
  {
    step: '03',
    title: 'Grow your reputation',
    description: 'Earn upvotes, collect badges, and build a profile that reflects your intellectual contributions.',
    icon: Award,
    accent: '#0EA5E9',
  },
];

// ── Testimonials ───────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: 'Inkwell is the intellectual home I never knew I needed. Every conversation here is substantive.',
    author: 'Priya Menon',
    role: 'Philosophy Writer',
    avatar: 'PM',
  },
  {
    quote: 'The community moderation tools are top-notch. Our science salon self-regulates beautifully.',
    author: 'Alex Chen',
    role: 'Community Moderator',
    avatar: 'AC',
  },
  {
    quote: 'Writing on Inkwell feels premium. The editor, the typography, the audience — everything is thoughtful.',
    author: 'Sarah Williams',
    role: 'Tech Essayist',
    avatar: 'SW',
  },
];

// ════════════════════════════════════════════════════════════════════════════
// ── LANDING PAGE COMPONENT ─────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

export default function LandingPage() {
  // ── Refs for GSAP ──────────────────────────────────────────────────────
  const sectionRef = useRef(null);
  const triggerRef = useRef(null);
  const trackRef = useRef(null);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const stepsRef = useRef(null);

  // ── Navbar scroll effect ───────────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── GSAP Horizontal Scroll (with safety delay) ────────────────────────
  useLayoutEffect(() => {
    // Safety delay: wait for DOM + images to render and compute accurate widths
    let ctx;
    const timeoutId = setTimeout(() => {
      const track = trackRef.current;
      const trigger = triggerRef.current;

      if (!track || !trigger) return;

      // Force a reflow to ensure widths are calculated
      track.getBoundingClientRect();

      const scrollWidth = track.scrollWidth;
      const viewportWidth = window.innerWidth;
      const scrollDistance = scrollWidth - viewportWidth;

      // Only create animation if there's content to scroll
      if (scrollDistance <= 0) return;

      ctx = gsap.context(() => {
        gsap.to(track, {
          x: -scrollDistance,
          ease: 'none',
          scrollTrigger: {
            trigger: trigger,
            pin: true,
            scrub: 1,
            start: 'top top',
            end: () => `+=${scrollDistance}`,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
      }, sectionRef);
    }, 150); // 150ms delay ensures React commit + layout is complete

    return () => {
      clearTimeout(timeoutId);
      if (ctx) ctx.revert();
      // Kill all ScrollTrigger instances in this section
      ScrollTrigger.getAll().forEach((st) => {
        if (sectionRef.current && sectionRef.current.contains(st.trigger)) {
          st.kill();
        }
      });
    };
  }, []);

  // ── Hero entrance animations ───────────────────────────────────────────
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states explicitly to prevent FOUC / flash before animation
      gsap.set(['.hero-title', '.hero-subtitle', '.hero-cta', '.hero-badge'], { opacity: 0 });

      gsap.fromTo('.hero-badge', 
        { scale: 0.8, opacity: 0, y: 20 }, 
        { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' }
      );
      gsap.fromTo('.hero-title', 
        { y: 60, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1, delay: 0.2, ease: 'power3.out' }
      );
      gsap.fromTo('.hero-subtitle', 
        { y: 40, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1, delay: 0.4, ease: 'power3.out' }
      );
      gsap.fromTo('.hero-cta', 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, delay: 0.6, ease: 'power3.out' }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // ── Feature cards stagger ──────────────────────────────────────────────
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.feature-card');
      // Set initial state explicitly so cards are visible by default
      gsap.set(cards, { opacity: 1, y: 0 });

      ScrollTrigger.batch(cards, {
        onEnter: (batch) => {
          gsap.fromTo(batch,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out', overwrite: true }
          );
        },
        start: 'top 90%',
        once: true,
      });
    }, featuresRef);

    return () => ctx.revert();
  }, []);

  // ── Steps stagger ──────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray('.step-card');
      gsap.set(items, { opacity: 1, y: 0 });

      ScrollTrigger.batch(items, {
        onEnter: (batch) => {
          gsap.fromTo(batch,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, stagger: 0.15, duration: 0.7, ease: 'power3.out', overwrite: true }
          );
        },
        start: 'top 90%',
        once: true,
      });
    }, stepsRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="landing-page dark bg-[#050505] min-h-screen text-gray-200" ref={sectionRef}>
      {/* ── Fixed Landing Navbar ──────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#050505]/90 backdrop-blur-xl shadow-sm border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white text-sm font-bold font-serif">IW</span>
            </div>
            <span className="font-serif text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Inkwell
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Gallery', 'Community'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={`text-sm font-medium transition-colors ${
                  scrolled
                    ? 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                    : 'text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white'
                }`}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                scrolled
                  ? 'text-gray-700 hover:text-gray-900 dark:text-gray-300'
                  : 'text-gray-700 hover:text-gray-900 dark:text-gray-200'
              }`}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-600 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              Join Inkwell
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ──────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 bg-[#050505]"
      >
        {/* Background gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
        <div className="absolute top-20 right-20 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-20 left-20 w-[400px] h-[400px] rounded-full bg-primary-200/20 blur-[100px]" />

        {/* WebGL Light Rays Effect */}
        <LightRays
          raysOrigin="top-center"
          raysColor="#1A6B47"
          raysSpeed={1.5}
          lightSpread={1.2}
          rayLength={1.8}
          followMouse={true}
          mouseInfluence={0.15}
          noiseAmount={0.03}
          distortion={0.05}
          className="opacity-50 mix-blend-screen pointer-events-none"
        />

        {/* Floating grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #1A6B47 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
            <Sparkles size={14} />
            The Intellectual Community
          </div>

          <h1 className="hero-title text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-6">
            Where ideas find
            <span className="block mt-2 bg-gradient-to-r from-primary via-primary-400 to-emerald-400 bg-clip-text text-transparent">
              their audience
            </span>
          </h1>

          <p className="hero-subtitle text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Inkwell is the digital salon for writers, thinkers, and curious minds.
            Share ideas, build reputation, and engage in discourse that matters.
          </p>

          <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white font-semibold text-base hover:bg-primary-600 transition-all shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Start Writing
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#gallery"
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 font-semibold text-base hover:bg-gray-200 dark:hover:bg-white/15 transition-all"
            >
              See It In Action
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-5 text-sm text-gray-400">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Sparkles size={14} className="text-primary-400" />
              <span className="text-gray-300">Free to join</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Lock size={14} className="text-primary-400" />
              <span className="text-gray-300">No ads, ever</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Shield size={14} className="text-primary-400" />
              <span className="text-gray-300">Community moderated</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────────────────────────── */}
      <section id="features" ref={featuresRef} className="py-24 sm:py-32 px-6 bg-[#050505]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold tracking-widest uppercase text-primary">Platform</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-3 mb-4">
              Everything you need to write,<br className="hidden sm:block" /> discuss, and grow
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Built from the ground up for intellectual discourse — not engagement farming.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={i}
                className="feature-card group p-6 rounded-2xl border border-gray-200 dark:border-[#2d2d2d] bg-gray-50/50 dark:bg-[#1a1a1a] hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/5 transition-all duration-300 cursor-default"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STICKY HORIZONTAL SCROLL GALLERY ──────────────────────────────── */}
      <section id="gallery" ref={triggerRef} className="relative overflow-hidden">
        {/* Gallery header */}
        <div
          ref={trackRef}
          className="flex items-stretch h-screen"
          style={{ width: `${GALLERY_SLIDES.length * 100}vw` }}
        >
          {GALLERY_SLIDES.map((slide, i) => (
            <div
              key={slide.id}
              className="relative flex items-center justify-center w-screen h-screen flex-shrink-0 px-6 sm:px-12 lg:px-20"
              style={{
                background: i % 2 === 0
                  ? 'linear-gradient(135deg, #050505 0%, #0a0f0c 100%)'
                  : 'linear-gradient(135deg, #050505 0%, #0c0914 100%)',
              }}
            >
              {/* Slide number indicator */}
              <div className="absolute top-8 left-8 sm:left-12 lg:left-20 flex items-center gap-3">
                <span
                  className="text-xs font-bold tracking-[0.25em] uppercase px-3 py-1.5 rounded-full text-white"
                  style={{ background: slide.accent }}
                >
                  {slide.tag}
                </span>
                <span className="text-sm text-gray-400 font-mono">
                  {String(i + 1).padStart(2, '0')} / {String(GALLERY_SLIDES.length).padStart(2, '0')}
                </span>
              </div>

              <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 max-w-6xl w-full">
                {/* Text Side */}
                <div className="flex-1 max-w-md">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3">
                    {slide.title}
                  </h3>
                  <p
                    className="text-lg font-medium mb-4"
                    style={{ color: slide.accent }}
                  >
                    {slide.subtitle}
                  </p>
                  <p className="text-gray-400 leading-relaxed text-base">
                    {slide.description}
                  </p>
                </div>

                {/* Image Side */}
                <div className="flex-1 w-full max-w-2xl">
                  <div
                    className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/50"
                    style={{
                      boxShadow: `0 25px 60px -12px ${slide.accent}20, 0 0 0 1px ${slide.accent}10`,
                    }}
                  >
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                    {/* Gradient overlay at bottom */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-20"
                      style={{
                        background: `linear-gradient(to top, ${slide.accent}08, transparent)`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Progress dots */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {GALLERY_SLIDES.map((_, j) => (
                  <div
                    key={j}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: j === i ? '32px' : '8px',
                      background: j === i ? slide.accent : '#d1d5db',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION ───────────────────────────────────────────── */}
      <section ref={stepsRef} className="py-24 sm:py-32 px-6 bg-[#050505] relative overflow-hidden">
        <LightRays
          raysOrigin="bottom-center"
          raysColor="#1A6B47"
          raysSpeed={0.6}
          lightSpread={1.5}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.02}
          distortion={0.03}
          className="opacity-25 mix-blend-screen pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-primary-900/5" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold tracking-widest uppercase text-primary-300">Getting Started</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">
              Three steps to your first post
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              From sign-up to your first published essay — it takes less than two minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ step, title, description, icon: Icon, accent }, i) => (
              <div key={i} className="step-card relative group">
                {/* Connector line between steps */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-40px)] h-px bg-gradient-to-r from-white/20 to-transparent" />
                )}

                <div 
                  className="text-center p-8 rounded-2xl bg-[#0a0a0a]/80 border border-white/15 backdrop-blur-xl hover:bg-[#111] hover:border-white/25 transition-all duration-500 shadow-2xl shadow-black/50"
                  style={{
                    boxShadow: `inset 0 0 30px -15px ${accent}30`
                  }}
                >
                  {/* Step number */}
                  <div
                    className="text-[64px] font-black leading-none mb-4 opacity-25"
                    style={{ color: accent }}
                  >
                    {step}
                  </div>

                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${accent}20` }}
                  >
                    <Icon size={24} style={{ color: accent }} />
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ──────────────────────────────────────────── */}
      <section id="community" className="py-24 sm:py-32 px-6 bg-[#050505]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold tracking-widest uppercase text-primary">Voices</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-3 mb-4">
              Loved by writers & thinkers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-gray-200 dark:border-[#2d2d2d] bg-gray-50/50 dark:bg-[#1a1a1a] hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 text-sm">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: ['#1A6B47', '#7C3AED', '#0EA5E9'][i] }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.author}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ───────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32 px-6 bg-[#050505] relative overflow-hidden">
        <LightRays
          raysOrigin="top-center"
          raysColor="#1A6B47"
          raysSpeed={1.0}
          lightSpread={1.5}
          rayLength={1.0}
          followMouse={true}
          mouseInfluence={0.1}
          className="opacity-30 mix-blend-screen pointer-events-none"
        />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            <Eye size={14} />
            Open to all curious minds
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Ready to join the<br />conversation?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Whether you're a seasoned essayist or just finding your voice, Inkwell is where your ideas belong.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white font-semibold text-base hover:bg-primary-600 transition-all shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Create Your Free Account
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-gray-700 dark:text-gray-300 font-semibold text-base hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 bg-[#020202] border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold font-serif">IW</span>
              </div>
              <span className="font-serif text-lg font-semibold text-gray-900 dark:text-white">Inkwell</span>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              {['About', 'Blog', 'Guidelines', 'Privacy', 'Terms', 'Contact'].map((l) => (
                <a key={l} href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  {l}
                </a>
              ))}
            </nav>

            <p className="text-xs text-gray-400">© 2025 Inkwell. The Digital Salon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
