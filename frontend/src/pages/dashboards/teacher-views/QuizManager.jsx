import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/api";

const QuizManager = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data } = await api.get("/quiz"); // Fetch ALL school quizzes (Shared Library)
        setQuizzes(data);
      } catch (error) {
        console.error("Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quiz Management</h1>
          <p className="text-gray-500">
            Create and manage safety drills for your students.
          </p>
        </div>
        <Link
          to="/dashboard/teacher/quizzes/create"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition"
        >
          + Create New Quiz
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">
          Loading your content...
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-medium text-gray-900">
            No Quizzes Created Yet
          </h3>
          <p className="text-gray-500 mt-2 mb-6">
            Get started by creating your first safety drill.
          </p>
          <Link
            to="/dashboard/teacher/quizzes/create"
            className="text-blue-600 font-semibold hover:underline"
          >
            Start Creating &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-gray-800 line-clamp-1">
                    {quiz.title}
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">
                    {quiz.questions?.length || 0} Qs
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">
                  {quiz.description || "No description provided."}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-4">
                  <span>⏳ {quiz.timeLimit}s time limit</span>
                  <span>🏆 {quiz.xpReward || 100} XP</span>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500">
                  ACTIVE
                </span>
                {/* This button will be linked to analytics later */}
                <Link
                  to={`/dashboard/teacher/quiz/${quiz._id}/analytics`}
                  className="text-blue-600 text-sm font-bold hover:underline"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizManager;
