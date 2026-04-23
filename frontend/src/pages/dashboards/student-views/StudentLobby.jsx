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
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8 flex flex-col md:flex-row gap-5 items-center">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${rank.color} flex items-center justify-center text-white text-2xl flex-shrink-0`}>
            {rank.title === 'Disaster Master' ? '🌋' :
              rank.title === 'First Responder' ? '🚑' :
                rank.title === 'Safety Warden' ? '🛡️' : '🎓'}
          </div>
          <div className="flex-1 w-full text-center md:text-left">
            <h2 className="text-xl font-bold text-gray-800 flex items-center justify-center md:justify-start gap-3">
              {profile.name}
              <span className={`text-xs px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${rank.color}`}>
                {rank.title}
              </span>
            </h2>
            <div className="flex justify-between text-xs text-gray-500 mt-3 mb-1.5 font-medium uppercase tracking-wide">
              <span>{rank.current} XP</span>
              {rank.title !== 'Disaster Master' ? (
                <span>Next: {rank.max} XP ({rank.nextBadge})</span>
              ) : (
                <span>Max Rank Reached!</span>
              )}
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${rank.color} transition-all duration-1000 ease-out`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-right">
              {rank.title !== 'Disaster Master' ? `${rank.max - rank.current} XP to Rank Up` : 'You are a true survivor!'}
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
              <div key={quiz._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                {/* Quiz Card Header */}
                <div className={`px-6 py-4 border-b flex items-center justify-between ${isAttempted
                  ? 'bg-green-50 border-green-100'
                  : 'bg-gray-50 border-gray-100'
                  }`}>
                  <span className="text-2xl">{isAttempted ? '✅' : '🛡️'}</span>
                  <div className="flex items-center gap-2">
                    {isAttempted && (
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                        Best: {Math.round(result.bestScore)}%
                      </span>
                    )}
                    {isAttempted && result.attemptCount > 1 && (
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {result.attemptCount}x attempts
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{quiz.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 h-10 line-clamp-2">
                    {quiz.description || "Complete this safety drill to earn XP and level up your survivor rank."}
                  </p>

                  <div className="flex items-center justify-between mb-4 text-xs font-medium text-gray-400">
                    <span>⏱️ {quiz.timeLimit}s</span>
                    <span>🏆 {quiz.xpReward} XP</span>
                  </div>

                  {/* XP Earned Badge (for attempted quizzes) */}
                  {isAttempted && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⭐</span>
                        <span className="font-bold text-emerald-700 text-sm">Best XP Earned</span>
                      </div>
                      <span className="font-bold text-emerald-600 text-lg">+{result.bestXp}</span>
                    </div>
                  )}

                  <Link
                    to={`/dashboard/student/quiz/${quiz._id}`}
                    className={`block w-full text-center py-2.5 rounded-lg font-medium text-sm transition-colors ${isAttempted
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                  >
                    {isAttempted ? 'Improve Score' : 'Start Mission'}
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