import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';

const StudentLobby = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data } = await api.get('/quiz'); // Get Shared Library
        setQuizzes(data);
      } catch (error) {
        console.error("Failed to load lobby");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Safety Drill Lobby</h1>
      <p className="text-gray-500 mb-8">Select a training mission to begin.</p>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading missions...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-4xl">🛡️</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{quiz.title}</h3>
                <p className="text-gray-500 text-sm mb-4 h-10 line-clamp-2">
                  {quiz.description || "Complete this safety drill to earn XP."}
                </p>
                
                <div className="flex items-center justify-between mb-6 text-sm font-semibold text-gray-400">
                  <span className="flex items-center gap-1">
                    ⏱️ {quiz.timeLimit}s
                  </span>
                  <span className="flex items-center gap-1 text-yellow-500">
                    🏆 {quiz.xpReward} XP
                  </span>
                </div>

                <Link 
                  to={`/dashboard/student/quiz/${quiz._id}`}
                  className="block w-full text-center bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition"
                >
                  START MISSION
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentLobby;