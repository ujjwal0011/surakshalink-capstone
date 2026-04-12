import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';

const StudentLobby = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState({}); // quizId -> { bestScore, bestXp, attemptCount }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch quizzes and results in parallel
        const [quizzesRes, resultsRes] = await Promise.all([
          api.get('/quiz'),
          api.get('/quiz/my-results').catch(() => ({ data: {} })) // Graceful fallback
        ]);
        setQuizzes(quizzesRes.data);
        setResults(resultsRes.data);
      } catch (error) {
        console.error("Failed to load lobby");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Safety Drill Lobby</h1>
      <p className="text-gray-500 mb-8">Select a training mission to begin.</p>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading missions...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const result = results[quiz._id];
            const isAttempted = !!result;

            return (
              <div key={quiz._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Quiz Card Header */}
                <div className={`h-32 flex items-center justify-center relative ${
                  isAttempted
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600'
                }`}>
                  <span className="text-4xl">{isAttempted ? '✅' : '🛡️'}</span>

                  {/* Completion Badge */}
                  {isAttempted && (
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-white text-xs font-bold">
                        Best: {Math.round(result.bestScore)}%
                      </span>
                    </div>
                  )}

                  {/* Attempt Count Badge */}
                  {isAttempted && result.attemptCount > 1 && (
                    <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-white text-xs font-bold">
                        {result.attemptCount}x attempted
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{quiz.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 h-10 line-clamp-2">
                    {quiz.description || "Complete this safety drill to earn XP."}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4 text-sm font-semibold text-gray-400">
                    <span className="flex items-center gap-1">
                      ⏱️ {quiz.timeLimit}s
                    </span>
                    <span className="flex items-center gap-1 text-yellow-500">
                      🏆 {quiz.xpReward} XP
                    </span>
                  </div>

                  {/* XP Earned Badge (for attempted quizzes) */}
                  {isAttempted && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⭐</span>
                        <span className="font-bold text-emerald-700 text-sm">XP Earned</span>
                      </div>
                      <span className="font-black text-emerald-600 text-lg">{result.bestXp}</span>
                    </div>
                  )}

                  <Link 
                    to={`/dashboard/student/quiz/${quiz._id}`}
                    className={`block w-full text-center py-3 rounded-xl font-bold transition ${
                      isAttempted
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isAttempted ? '🔄 ATTEMPT AGAIN' : '🚀 START MISSION'}
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