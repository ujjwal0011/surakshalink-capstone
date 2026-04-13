import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';

const StudentLobby = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState({}); // quizId -> { bestScore, bestXp, attemptCount }
  const [profile, setProfile] = useState(null); // Real-time updated Profile for total XP
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch quizzes, results, and Profile in parallel
        const [quizzesRes, resultsRes, profileRes] = await Promise.all([
          api.get('/quiz'),
          api.get('/quiz/my-results').catch(() => ({ data: {} })), // Graceful fallback
          api.get('/users/me').catch(() => ({ data: null }))
        ]);
        setQuizzes(quizzesRes.data);
        setResults(resultsRes.data);
        if (profileRes.data) setProfile(profileRes.data);
      } catch (error) {
        console.error("Failed to load lobby");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Gamification Logic
  const getRankInfo = (xp) => {
    if (xp >= 3000) return { title: 'Disaster Master', color: 'from-orange-500 to-red-600', base: 3000, max: 5000, current: xp, nextBadge: 'Hero' };
    if (xp >= 1500) return { title: 'First Responder', color: 'from-orange-400 to-orange-500', base: 1500, max: 3000, current: xp, nextBadge: 'Disaster Master' };
    if (xp >= 500) return { title: 'Safety Warden', color: 'from-yellow-400 to-yellow-500', base: 500, max: 1500, current: xp, nextBadge: 'First Responder' };
    return { title: 'Trainee', color: 'from-green-400 to-emerald-500', base: 0, max: 500, current: xp, nextBadge: 'Safety Warden' };
  };

  const rank = profile ? getRankInfo(profile.totalXP) : null;

  // Progress relative to current level bracket
  let progressPercent = 0;
  if (rank) {
    if (rank.current >= rank.max && rank.title === 'Disaster Master') {
      progressPercent = 100;
    } else {
      const levelRange = rank.max - rank.base;
      const currentProgress = rank.current - rank.base;
      progressPercent = Math.max(0, Math.min(100, (currentProgress / levelRange) * 100));
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Safety Drill Lobby</h1>
      <p className="text-gray-500 mb-8">Select a training mission to begin.</p>

      {/* GAMIFICATION BANNER: PLAYER PROFILE & PROGRESS */}
      {profile && rank && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-col md:flex-row gap-6 items-center hover:shadow-md transition">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${rank.color} flex items-center justify-center text-white text-3xl shadow-lg border-4 border-white ring-4 ring-gray-50 flex-shrink-0`}>
            {rank.title === 'Disaster Master' ? '🌋' :
              rank.title === 'First Responder' ? '🚑' :
                rank.title === 'Safety Warden' ? '🛡️' : '🎓'}
          </div>
          <div className="flex-1 w-full text-center md:text-left">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center justify-center md:justify-start gap-3">
              {profile.name}
              <span className={`text-xs ml-2 px-3 py-1.5 rounded-full text-white bg-gradient-to-r ${rank.color} uppercase tracking-wider shadow-sm`}>
                {rank.title}
              </span>
            </h2>
            <div className="flex justify-between text-sm text-gray-500 mt-4 mb-2 font-bold uppercase tracking-wide">
              <span>{rank.current} XP <span className="text-gray-300 mx-1">|</span> Lvl</span>
              {rank.title !== 'Disaster Master' ? (
                <span>Next: {rank.max} XP ({rank.nextBadge})</span>
              ) : (
                <span>Max Rank Reached!</span>
              )}
            </div>

            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden relative shadow-inner">
              {/* Animated Progress Bar */}
              <div
                className={`h-full bg-gradient-to-r ${rank.color} transition-all duration-1000 ease-out`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">
              {rank.title !== 'Disaster Master' ? `${rank.max - rank.current} XP to Rank Up!` : 'You are a true survivor!'}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400 font-medium">Loading missions...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const result = results[quiz._id];
            const isAttempted = !!result;

            return (
              <div key={quiz._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                {/* Quiz Card Header */}
                <div className={`h-32 flex items-center justify-center relative transition-colors duration-500 ${isAttempted
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:from-blue-600 group-hover:to-indigo-700'
                  }`}>
                  <span className="text-4xl filter drop-shadow-md pb-2">{isAttempted ? '✅' : '🛡️'}</span>

                  {/* Completion Badge */}
                  {isAttempted && (
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md border border-white/20 rounded-full px-3 py-1">
                      <span className="text-white text-xs font-bold drop-shadow-sm">
                        Best: {Math.round(result.bestScore)}%
                      </span>
                    </div>
                  )}

                  {/* Attempt Count Badge */}
                  {isAttempted && result.attemptCount > 1 && (
                    <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md border border-white/20 rounded-full px-3 py-1">
                      <span className="text-white text-xs font-bold drop-shadow-sm">
                        {result.attemptCount}x attempts
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{quiz.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 h-10 line-clamp-2">
                    {quiz.description || "Complete this safety drill to earn XP and level up your survivor rank."}
                  </p>

                  <div className="flex items-center justify-between mb-5 text-sm font-bold text-gray-400 bg-gray-50 rounded-lg p-2">
                    <span className="flex items-center gap-1.5">
                      ⏱️ {quiz.timeLimit}s
                    </span>
                    <span className="flex items-center gap-1.5 text-yellow-500">
                      🏆 {quiz.xpReward} XP
                    </span>
                  </div>

                  {/* XP Earned Badge (for attempted quizzes) */}
                  {isAttempted && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⭐</span>
                        <span className="font-bold text-emerald-700 text-sm">Best XP Earned</span>
                      </div>
                      <span className="font-black text-emerald-600 text-lg shadow-sm">+{result.bestXp}</span>
                    </div>
                  )}

                  <Link
                    to={`/dashboard/student/quiz/${quiz._id}`}
                    className={`block w-full text-center py-3 rounded-xl font-bold shadow-sm transition-all duration-300 ${isAttempted
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border border-indigo-100'
                      : 'bg-gray-900 text-white hover:bg-black hover:shadow-md'
                      }`}
                  >
                    {isAttempted ? '🔄 IMPROVE SCORE' : '🚀 START MISSION'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentLobby;