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

  const [statsRef, statsInView] = useInView(0.3);

  const schoolCount = useCounter(150, 2000, statsInView);
  const drillCount = useCounter(2500, 2000, statsInView);
  const studentCount = useCounter(50000, 2500, statsInView);
  const responseTime = useCounter(45, 1500, statsInView);

  const features = [
    {
      title: 'Real-Time Emergency Alerts',
      description: 'Instantly broadcast fire, earthquake, or custom alerts to every teacher and student. Live tracking of safety responses.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      title: 'Safety Drill Management',
      description: 'Conduct and monitor evacuation drills with real-time roll calls. Mark students safe with one click across all classrooms.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: 'Gamified Quiz Training',
      description: 'Engage students with interactive safety quizzes in secure exam mode. Anti-cheat protection ensures honest assessments.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      title: 'Analytics Dashboard',
      description: 'Track school-wide safety performance with detailed analytics. Monitor drill response times and quiz scores across classes.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  const steps = [
    {
      step: '1',
      title: 'Register Your School',
      description: 'Principal creates the school account and gets a unique school code. Teachers and students join using the code.',
    },
    {
      step: '2',
      title: 'Conduct Safety Drills',
      description: 'Trigger emergency alerts, manage real-time evacuations, and track which students have been marked safe.',
    },
    {
      step: '3',
      title: 'Train & Track Progress',
      description: 'Students take gamified safety quizzes. Principals and teachers monitor performance analytics for continuous improvement.',
    },
  ];

  return (
    <div className="bg-white text-gray-900">
      <PublicNavbar />

      {/* ═══════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section id="hero" className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <span className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
            <span className="text-sm font-medium text-blue-700">
              Trusted by Schools Across India
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6 text-gray-900">
            Protect Every Student.
            <br />
            <span className="text-blue-600">
              Prepare Every School.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            SurakshaLink is a real-time disaster preparedness platform for schools.
            Manage emergency alerts, conduct safety drills, train students with gamified quizzes,
            and track school-wide safety analytics — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register-principal"
              id="cta-register"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors"
            >
              Register Your School
            </Link>
            <Link
              to="/login"
              id="cta-login"
              className="px-6 py-3 rounded-lg font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 transition-all"
            >
              Sign In →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FEATURES SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              Everything You Need for School Safety
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              From real-time emergency alerts to gamified training — a complete safety ecosystem.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 text-blue-600 mb-4">
                  {feature.icon}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* HOW IT WORKS SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Get Started in 3 Simple Steps
            </h2>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.step} className="text-center">
                {/* Step Number */}
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white font-bold text-lg mb-5">
                  {step.step}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* IMPACT / STATS SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section id="impact" ref={statsRef} className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
              Our Impact
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Making Schools Safer Every Day
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: schoolCount, suffix: '+', label: 'Schools Protected' },
              { value: drillCount.toLocaleString(), suffix: '+', label: 'Drills Conducted' },
              { value: studentCount.toLocaleString(), suffix: '+', label: 'Students Trained' },
              { value: responseTime, suffix: 's avg', label: 'Response Time' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-gray-200 p-6 text-center"
              >
                <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                  {stat.value}{stat.suffix}
                </span>
                <p className="text-gray-500 text-xs font-medium mt-2 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* CTA BANNER */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-10 sm:p-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Ready to Make Your School Safer?
            </h2>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto">
              Join hundreds of schools already using SurakshaLink to protect their students and prepare for emergencies.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register-principal"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-lg font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 transition-all"
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
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <span className="text-gray-900 font-bold text-xl">
                Suraksha<span className="text-blue-600">Link</span>
              </span>
              <p className="text-gray-500 text-sm max-w-sm leading-relaxed mt-3">
                A comprehensive disaster preparedness and safety management platform designed for schools.
                Built with the mission to make every student safer.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-gray-900 font-semibold text-sm mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">How It Works</a></li>
                <li><Link to="/login" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">Login</Link></li>
              </ul>
            </div>

            {/* Registration */}
            <div>
              <h4 className="text-gray-900 font-semibold text-sm mb-4">Join As</h4>
              <ul className="space-y-2">
                <li><Link to="/register-principal" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">Register School</Link></li>
                <li><Link to="/register-teacher" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">Join as Teacher</Link></li>
                <li><Link to="/register-student" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">Join as Student</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-200 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} SurakshaLink. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm">
              Made with ❤️ for student safety
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
