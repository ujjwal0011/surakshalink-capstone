import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PublicNavbar from '../components/PublicNavbar';

// Animated counter hook
const useCounter = (target, duration = 2000, startCounting = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startCounting) return;
    let start = 0;
    const incrementTime = Math.floor(duration / target);
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= target) clearInterval(timer);
    }, incrementTime);
    return () => clearInterval(timer);
  }, [target, duration, startCounting]);
  return count;
};

// Intersection observer hook for scroll animations
const useInView = (threshold = 0.2) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
};

const LandingPage = () => {
  const { user } = useAuth();

  // If already logged in, redirect to dashboard
  if (user) {
    const dashboardPath =
      user.role === 'principal' ? '/dashboard/principal' :
        user.role === 'teacher' ? '/dashboard/teacher' :
          user.role === 'student' ? '/dashboard/student' : '/';
    return <Navigate to={dashboardPath} replace />;
  }

  const [featuresRef, featuresInView] = useInView(0.1);
  const [howItWorksRef, howItWorksInView] = useInView(0.1);
  const [statsRef, statsInView] = useInView(0.3);

  const schoolCount = useCounter(150, 2000, statsInView);
  const drillCount = useCounter(2500, 2000, statsInView);
  const studentCount = useCounter(50000, 2500, statsInView);
  const responseTime = useCounter(45, 1500, statsInView);

  const features = [
    {
      icon: '🚨',
      title: 'Real-Time Emergency Alerts',
      description: 'Instantly broadcast fire, earthquake, or custom alerts to every teacher and student. Live tracking of safety responses.',
      gradient: 'from-red-500 to-orange-500',
      shadowColor: 'shadow-red-500/20',
    },
    {
      icon: '🏃',
      title: 'Safety Drill Management',
      description: 'Conduct and monitor evacuation drills with real-time roll calls. Mark students safe with one click across all classrooms.',
      gradient: 'from-blue-500 to-cyan-500',
      shadowColor: 'shadow-blue-500/20',
    },
    {
      icon: '📝',
      title: 'Gamified Quiz Training',
      description: 'Engage students with interactive safety quizzes in secure exam mode. Anti-cheat protection ensures honest assessments.',
      gradient: 'from-purple-500 to-pink-500',
      shadowColor: 'shadow-purple-500/20',
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Track school-wide safety performance with detailed analytics. Monitor drill response times and quiz scores across classes.',
      gradient: 'from-emerald-500 to-teal-500',
      shadowColor: 'shadow-emerald-500/20',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Register Your School',
      description: 'Principal creates the school account and gets a unique school code. Teachers and students join using the code.',
      icon: '🏫',
    },
    {
      step: '02',
      title: 'Conduct Safety Drills',
      description: 'Trigger emergency alerts, manage real-time evacuations, and track which students have been marked safe.',
      icon: '🔔',
    },
    {
      step: '03',
      title: 'Train & Track Progress',
      description: 'Students take gamified safety quizzes. Principals and teachers monitor performance analytics for continuous improvement.',
      icon: '📈',
    },
  ];

  return (
    <div className="bg-slate-950 text-white overflow-hidden">
      <PublicNavbar />

      {/* ═══════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />

        {/* Animated background orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in-up">
            <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-slate-300">
              Trusted by Schools Across India
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6 animate-fade-in-up delay-100" style={{ opacity: 0 }}>
            Protect Every Student.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Prepare Every School.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up delay-200" style={{ opacity: 0 }}>
            SurakshaLink is a real-time disaster preparedness platform for schools.
            Manage emergency alerts, conduct safety drills, train students with gamified quizzes,
            and track school-wide safety analytics — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300" style={{ opacity: 0 }}>
            <Link
              to="/register-principal"
              id="cta-register"
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-600/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10">Register Your School</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link
              to="/login"
              id="cta-login"
              className="px-8 py-4 rounded-2xl font-bold text-lg border-2 border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300 text-slate-300 hover:text-white"
            >
              Sign In →
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FEATURES SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section id="features" ref={featuresRef} className="relative py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-bold tracking-wider uppercase mb-4">
              Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              Everything You Need for
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                School Safety
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              From real-time emergency alerts to gamified training — a complete safety ecosystem.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`group relative rounded-2xl p-8 glass hover:bg-white/[0.06] transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${feature.shadowColor} ${featuresInView ? 'animate-fade-in-up' : 'opacity-0'
                  }`}
                style={{ animationDelay: `${i * 0.15}s`, opacity: featuresInView ? undefined : 0 }}
              >
                {/* Gradient border accent */}
                <div className={`absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r ${feature.gradient} rounded-full opacity-50 group-hover:opacity-100 transition-opacity`} />

                <div className={`inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg mb-6`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* HOW IT WORKS SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section id="how-it-works" ref={howItWorksRef} className="relative py-24 px-4">
        <div className="absolute inset-0 bg-slate-900" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold tracking-wider uppercase mb-4">
              How It Works
            </span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              Get Started in{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                3 Simple Steps
              </span>
            </h2>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div
                key={step.step}
                className={`relative text-center ${howItWorksInView ? 'animate-fade-in-up' : 'opacity-0'
                  }`}
                style={{ animationDelay: `${i * 0.2}s`, opacity: howItWorksInView ? undefined : 0 }}
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-slate-700 to-transparent" />
                )}

                {/* Step Number */}
                <div className="inline-flex items-center justify-center h-32 w-32 rounded-3xl glass mb-6 relative">
                  <span className="text-5xl">{step.icon}</span>
                  <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-black shadow-lg">
                    {step.step}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* IMPACT / STATS SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section id="impact" ref={statsRef} className="relative py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-sm font-bold tracking-wider uppercase mb-4">
              Our Impact
            </span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              Making Schools{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Safer Every Day
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: schoolCount, suffix: '+', label: 'Schools Protected', gradient: 'from-blue-500 to-cyan-500' },
              { value: drillCount.toLocaleString(), suffix: '+', label: 'Drills Conducted', gradient: 'from-emerald-500 to-teal-500' },
              { value: studentCount.toLocaleString(), suffix: '+', label: 'Students Trained', gradient: 'from-purple-500 to-pink-500' },
              { value: responseTime, suffix: 's avg', label: 'Response Time', gradient: 'from-amber-500 to-orange-500' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`glass rounded-2xl p-6 text-center hover:bg-white/[0.06] transition-all duration-300 ${statsInView ? 'animate-fade-in-up' : 'opacity-0'
                  }`}
                style={{ animationDelay: `${i * 0.1}s`, opacity: statsInView ? undefined : 0 }}
              >
                <span className={`text-4xl sm:text-5xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}{stat.suffix}
                </span>
                <p className="text-slate-400 text-sm font-semibold mt-2 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* CTA BANNER */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative py-20 px-4">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl p-10 sm:p-14 animate-pulse-glow">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Ready to Make Your School Safer?
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Join hundreds of schools already using SurakshaLink to protect their students and prepare for emergencies.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register-principal"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-600/30 hover:scale-105 transition-all duration-300"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 rounded-2xl font-bold text-lg border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all text-slate-300 hover:text-white"
              >
                I Already Have an Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════ */}
      <footer className="border-t border-white/5 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-sm">SL</span>
                </div>
                <span className="text-white font-extrabold text-xl">
                  Suraksha<span className="text-cyan-400">Link</span>
                </span>
              </div>
              <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                A comprehensive disaster preparedness and safety management platform designed for schools.
                Built with the mission to make every student safer.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">How It Works</a></li>
                <li><Link to="/login" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Login</Link></li>
              </ul>
            </div>

            {/* Registration */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Join As</h4>
              <ul className="space-y-2">
                <li><Link to="/register-principal" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Register School</Link></li>
                <li><Link to="/register-teacher" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Join as Teacher</Link></li>
                <li><Link to="/register-student" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Join as Student</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/5 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-600 text-sm">
              © {new Date().getFullYear()} SurakshaLink. All rights reserved.
            </p>
            <p className="text-slate-600 text-sm">
              Made with ❤️ for student safety
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
