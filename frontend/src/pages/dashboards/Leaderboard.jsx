import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Rank tier helper (mirrors backend) ──
const getRankTier = (xp) => {
  if (xp >= 6000) return { tier: 'Legend', icon: '🔥', color: '#ef4444', bg: 'from-red-500 to-orange-500' };
  if (xp >= 3500) return { tier: 'Diamond', icon: '💎', color: '#8b5cf6', bg: 'from-purple-500 to-indigo-500' };
  if (xp >= 1500) return { tier: 'Gold', icon: '🥇', color: '#f59e0b', bg: 'from-yellow-400 to-amber-500' };
  if (xp >= 500)  return { tier: 'Silver', icon: '🥈', color: '#9ca3af', bg: 'from-gray-300 to-gray-500' };
  return { tier: 'Bronze', icon: '🥉', color: '#d97706', bg: 'from-amber-600 to-yellow-700' };
};

// ── Animated XP counter ──
const AnimatedXP = ({ value }) => {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) { setDisplayed(0); return; }
    const duration = 1200;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = end / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayed(end);
        clearInterval(timer);
      } else {
        setDisplayed(Math.round(start));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);

  return <span ref={ref}>{displayed.toLocaleString()}</span>;
};

const PERIODS = [
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'alltime', label: 'All Time' },
];

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
const Leaderboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('alltime');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('class'); // student: class|school, principal: students|classes
  const [animateKey, setAnimateKey] = useState(0); // Force re-animation

  const role = user?.role;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const endpoint = `/leaderboard/${role}?period=${period}`;
        const { data: result } = await api.get(endpoint);
        setData(result);
        setAnimateKey(prev => prev + 1);
      } catch (error) {
        console.error('Leaderboard fetch error:', error);
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    if (role) fetchLeaderboard();
  }, [role, period]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 border-4 border-indigo-400 border-t-transparent rounded-full"
               style={{ animation: 'spin 0.8s linear infinite' }} />
          <p className="mt-4 text-indigo-300 font-semibold text-lg">Loading Rankings...</p>
        </div>
      </div>
    );
  }

  // ── PERIOD FILTER PILLS ──
  const PeriodFilter = () => (
    <div className="flex gap-2">
      {PERIODS.map(p => (
        <button
          key={p.key}
          id={`leaderboard-filter-${p.key}`}
          onClick={() => setPeriod(p.key)}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
            period === p.key
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105'
              : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  // ── PODIUM (Top 3) ──
  const Podium = ({ ranking }) => {
    if (!ranking || ranking.length < 1) return null;
    // Order: 2nd, 1st, 3rd for visual podium
    const podiumOrder = [ranking[1], ranking[0], ranking[2]].filter(Boolean);
    const podiumHeights = ['h-28', 'h-40', 'h-20'];
    const podiumColors = [
      'from-gray-300 to-gray-400',
      'from-yellow-300 to-amber-500',
      'from-amber-600 to-amber-800',
    ];
    const podiumBorders = [
      'border-gray-300',
      'border-yellow-400',
      'border-amber-700'
    ];
    const medals = ['🥈', '🥇', '🥉'];

    return (
      <div className="flex items-end justify-center gap-3 md:gap-6 py-8">
        {podiumOrder.map((student, i) => {
          if (!student) return <div key={i} className="w-24 md:w-32" />;
          return (
            <div
              key={student._id}
              className="flex flex-col items-center leaderboard-podium-rise"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {/* Avatar */}
              <div className={`relative mb-2 ${student.isCurrentUser ? 'leaderboard-glow-pulse' : ''}`}>
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${student.tier.bg} 
                  flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-xl 
                  border-3 ${podiumBorders[i]}`}>
                  {student.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="absolute -top-2 -right-2 text-2xl">{medals[i]}</span>
              </div>
              {/* Name */}
              <p className={`text-sm font-bold text-center truncate max-w-[90px] md:max-w-[120px] ${
                student.isCurrentUser ? 'text-indigo-300' : 'text-slate-200'
              }`}>
                {student.isCurrentUser ? 'You' : student.name}
              </p>
              {/* XP */}
              <p className="text-xs text-indigo-400 font-bold mt-0.5">
                <AnimatedXP value={student.xp} /> XP
              </p>
              {/* Podium Bar */}
              <div className={`${podiumHeights[i]} w-24 md:w-32 bg-gradient-to-t ${podiumColors[i]} 
                rounded-t-xl mt-2 flex items-start justify-center pt-3 shadow-inner`}>
                <span className="text-white font-black text-2xl drop-shadow-lg">
                  #{student.rank}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── RANK ROW ──
  const RankRow = ({ entry, index, showTeacher }) => (
    <div
      className={`flex items-center gap-4 px-4 md:px-6 py-4 rounded-xl transition-all duration-300
        leaderboard-rank-slide-in ${
        entry.isCurrentUser
          ? 'bg-indigo-500/20 border border-indigo-400/40 leaderboard-glow-pulse'
          : 'bg-white/5 hover:bg-white/10 border border-transparent'
      }`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Rank Number */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
        entry.rank <= 3
          ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-md'
          : 'bg-white/10 text-slate-400'
      }`}>
        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
      </div>

      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${entry.tier.bg} 
        flex items-center justify-center text-white font-bold text-sm shadow-md`}>
        {entry.name?.charAt(0)?.toUpperCase()}
      </div>

      {/* Name & Tier */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold truncate ${
          entry.isCurrentUser ? 'text-indigo-300' : 'text-slate-200'
        }`}>
          {entry.isCurrentUser ? `${entry.name} (You)` : entry.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs" title={entry.tier.tier}>
            {entry.tier.icon}
          </span>
          <span className="text-[11px] font-semibold" style={{ color: entry.tier.color }}>
            {entry.tier.tier}
          </span>
          {showTeacher && entry.teacherName && (
            <span className="text-[11px] text-slate-500 ml-1">• {entry.teacherName}</span>
          )}
        </div>
      </div>

      {/* XP */}
      <div className="text-right">
        <p className="font-black text-lg text-indigo-400">
          <AnimatedXP value={entry.xp} />
        </p>
        <p className="text-[11px] text-slate-500 font-semibold">XP</p>
      </div>
    </div>
  );

  // ── CLASS COMPARISON CARD (Principal) ──
  const ClassCard = ({ cls, index }) => (
    <div
      className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 
        transition-all duration-300 leaderboard-rank-slide-in"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
              cls.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
              cls.rank === 2 ? 'bg-gray-300 text-gray-700' :
              cls.rank === 3 ? 'bg-amber-600 text-white' :
              'bg-white/10 text-slate-400'
            }`}>
              #{cls.rank}
            </span>
            <h3 className="font-bold text-slate-200 text-lg">{cls.teacherName}'s Class</h3>
          </div>
          {cls.classCode && (
            <span className="text-xs text-indigo-400 font-mono mt-1 block">{cls.classCode}</span>
          )}
        </div>
        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full font-bold">
          {cls.studentCount} students
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 font-semibold">Avg XP</p>
          <p className="text-lg font-black text-indigo-400"><AnimatedXP value={cls.avgXP} /></p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 font-semibold">Total XP</p>
          <p className="text-lg font-black text-emerald-400"><AnimatedXP value={cls.totalXP} /></p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 font-semibold">Top</p>
          <p className="text-sm font-bold text-slate-300 truncate">
            {cls.topStudent?.name || '—'}
          </p>
        </div>
      </div>

      {/* XP bar — visual comparison */}
      {cls.avgXP > 0 && (
        <div className="mt-3 w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(100, (cls.avgXP / 500) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════
  // STUDENT VIEW
  // ═══════════════════════════════════════════════════════
  const StudentView = () => {
    const ranking = tab === 'class' ? data?.classRanking : data?.schoolRanking;
    const myRank = tab === 'class' ? data?.myClassRank : data?.mySchoolRank;

    return (
      <div key={animateKey}>
        {/* Hero: My Rank Card */}
        {myRank && (
          <div className="mb-8 bg-gradient-to-r from-indigo-600/40 to-purple-600/30 
            border border-indigo-400/30 rounded-2xl p-6 md:p-8 leaderboard-rank-slide-in">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${myRank.tier.bg} 
                flex items-center justify-center text-4xl shadow-xl leaderboard-glow-pulse`}>
                {myRank.tier.icon}
              </div>
              <div className="text-center md:text-left flex-1">
                <p className="text-sm text-indigo-300 font-semibold uppercase tracking-wider">
                  Your {tab === 'class' ? 'Class' : 'School'} Rank
                </p>
                <p className="text-5xl font-black text-white mt-1">
                  #{myRank.rank}
                </p>
                <p className="text-sm mt-1" style={{ color: myRank.tier.color }}>
                  {myRank.tier.icon} {myRank.tier.tier} Tier
                </p>
              </div>
              <div className="text-center bg-white/5 rounded-xl px-8 py-4">
                <p className="text-xs text-slate-400 font-semibold">Total XP</p>
                <p className="text-3xl font-black text-indigo-400">
                  <AnimatedXP value={myRank.xp} />
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-6">
          {['class', 'school'].map(t => (
            <button
              key={t}
              id={`leaderboard-tab-${t}`}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                tab === t
                  ? 'bg-white/15 text-white border border-white/20 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t === 'class' ? '👥 My Class' : '🏫 School-Wide'}
            </button>
          ))}
        </div>

        {/* Podium */}
        <Podium ranking={ranking} />

        {/* Full Ranking List */}
        <div className="space-y-2 mt-4">
          {ranking?.slice(3).map((entry, index) => (
            <RankRow key={entry._id} entry={entry} index={index} />
          ))}
        </div>

        {(!ranking || ranking.length === 0) && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-6xl mb-4">🏆</p>
            <p className="text-lg font-bold">No rankings yet</p>
            <p className="text-sm mt-1">Complete quizzes to earn XP and climb the leaderboard!</p>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════
  // TEACHER VIEW
  // ═══════════════════════════════════════════════════════
  const TeacherView = () => {
    const ranking = data?.classRanking;
    const stats = data?.classStats;

    return (
      <div key={animateKey}>
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Students', value: stats.totalStudents, icon: '👥', color: 'from-blue-500 to-cyan-500' },
              { label: 'Total Class XP', value: stats.totalXP, icon: '⚡', color: 'from-yellow-500 to-amber-500' },
              { label: 'Average XP', value: stats.avgXP, icon: '📊', color: 'from-indigo-500 to-purple-500' },
              { label: 'Top Performer', value: stats.topPerformer?.name || '—', isText: true, icon: '🏆', color: 'from-emerald-500 to-teal-500' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 leaderboard-rank-slide-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} 
                    flex items-center justify-center text-sm shadow-md`}>
                    {stat.icon}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{stat.label}</span>
                </div>
                <p className={`font-black ${stat.isText ? 'text-lg text-slate-200 truncate' : 'text-2xl text-white'}`}>
                  {stat.isText ? stat.value : <AnimatedXP value={stat.value} />}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Podium */}
        <Podium ranking={ranking} />

        {/* Full Ranking */}
        <div className="space-y-2 mt-4">
          {ranking?.slice(3).map((entry, index) => (
            <RankRow key={entry._id} entry={entry} index={index} />
          ))}
        </div>

        {(!ranking || ranking.length === 0) && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-lg font-bold">No student data yet</p>
            <p className="text-sm mt-1">Your students need to complete quizzes first!</p>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════
  // PRINCIPAL VIEW
  // ═══════════════════════════════════════════════════════
  const PrincipalView = () => (
    <div key={animateKey}>
      {/* School Stats */}
      {data?.schoolStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Students', value: data.schoolStats.totalStudents, icon: '🏫', color: 'from-blue-500 to-cyan-500' },
            { label: 'School XP', value: data.schoolStats.totalXP, icon: '⚡', color: 'from-yellow-500 to-amber-500' },
            { label: 'Avg XP / Student', value: data.schoolStats.avgXP, icon: '📊', color: 'from-indigo-500 to-purple-500' },
            { label: 'Top Performer', value: data.schoolStats.topPerformer?.name || '—', isText: true, icon: '🏆', color: 'from-emerald-500 to-teal-500' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 leaderboard-rank-slide-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} 
                  flex items-center justify-center text-sm shadow-md`}>
                  {stat.icon}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{stat.label}</span>
              </div>
              <p className={`font-black ${stat.isText ? 'text-lg text-slate-200 truncate' : 'text-2xl text-white'}`}>
                {stat.isText ? stat.value : <AnimatedXP value={stat.value} />}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab Toggle */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'students', label: '🏆 Top Students', id: 'leaderboard-tab-students' },
          { key: 'classes', label: '🏛️ Class vs Class', id: 'leaderboard-tab-classes' },
        ].map(t => (
          <button
            key={t.key}
            id={t.id}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              tab === t.key
                ? 'bg-white/15 text-white border border-white/20 shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'students' ? (
        <>
          <Podium ranking={data?.schoolRanking} />
          <div className="space-y-2 mt-4">
            {data?.schoolRanking?.slice(3).map((entry, index) => (
              <RankRow key={entry._id} entry={entry} index={index} showTeacher />
            ))}
          </div>
          {(!data?.schoolRanking || data.schoolRanking.length === 0) && (
            <div className="text-center py-16 text-slate-500">
              <p className="text-6xl mb-4">🏆</p>
              <p className="text-lg font-bold">No data yet</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.classComparisons?.map((cls, index) => (
              <ClassCard key={cls.teacherId} cls={cls} index={index} />
            ))}
          </div>
          {(!data?.classComparisons || data.classComparisons.length === 0) && (
            <div className="text-center py-16 text-slate-500">
              <p className="text-6xl mb-4">🏛️</p>
              <p className="text-lg font-bold">No classes to compare</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl 
                flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-xl">🏆</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Leaderboard
              </h1>
            </div>
            <p className="text-slate-400 text-sm font-medium ml-[52px]">
              {role === 'student' && 'See how you stack up against your classmates'}
              {role === 'teacher' && 'Track your students\' XP rankings'}
              {role === 'principal' && 'School-wide performance at a glance'}
            </p>
          </div>
          <PeriodFilter />
        </div>

        {/* Period indicator */}
        <div className="flex items-center gap-2 mb-6 ml-1">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            {period === 'alltime' ? 'All-Time Rankings' : 
             period === 'weekly' ? 'Rankings This Week' : 'Rankings This Month'}
          </span>
        </div>

        {/* Role-specific content */}
        {role === 'student' && <StudentView />}
        {role === 'teacher' && <TeacherView />}
        {role === 'principal' && <PrincipalView />}
      </div>
    </div>
  );
};

export default Leaderboard;
