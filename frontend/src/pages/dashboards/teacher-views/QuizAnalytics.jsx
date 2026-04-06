import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../services/api';
import StatCard from '../../../components/analytics/StatCard';

const QuizAnalytics = () => {
  const { id } = useParams(); // Quiz ID
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get(`/analytics/teacher/${id}`);
        setData(data);
      } catch (error) {
        console.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Analysis...</div>;

  if (!data?.stats) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-700">No Data Yet</h2>
        <p className="text-gray-500">Students haven't attempted this quiz yet.</p>
        <Link to="/dashboard/teacher/quizzes" className="text-blue-600 mt-4 block hover:underline">
          &larr; Back to Quizzes
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard/teacher/quizzes" className="text-gray-400 hover:text-gray-600">
          &larr; Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Report</h1>
          <p className="text-gray-500">Quiz: {data.quizTitle}</p>
        </div>
      </div>

      {/* 1. KEY STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Class Average" 
          value={`${data.stats.avgScore}%`} 
          color={data.stats.avgScore >= 70 ? "green" : "yellow"} 
        />
        <StatCard 
          title="Participation" 
          value={data.stats.totalStudents} 
          subtext="Students"
          color="blue" 
        />
        <StatCard 
          title="Pass Rate" 
          value={`${data.stats.passRate}%`} 
          color={data.stats.passRate > 80 ? "green" : "red"} 
        />
        <StatCard 
          title="Top Score" 
          value={`${data.stats.topScore}%`} 
          color="purple" 
        />
      </div>

      {/* 2. LEADERBOARD TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-700">Student Leaderboard</h3>
          <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
            Ranked by Score
          </span>
        </div>
        
        <table className="w-full text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Rank</th>
              <th className="px-6 py-3">Student Name</th>
              <th className="px-6 py-3">Score</th>
              <th className="px-6 py-3">XP Earned</th>
              <th className="px-6 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.leaderboard.map((student, index) => (
              <tr key={student._id} className="hover:bg-blue-50 transition">
                <td className="px-6 py-4 font-bold text-gray-400">#{index + 1}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{student.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    student.score >= 80 ? 'bg-green-100 text-green-800' : 
                    student.score >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {student.score}%
                  </span>
                </td>
                <td className="px-6 py-4 text-purple-600 font-bold">+{student.xp} XP</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{student.timeTaken}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuizAnalytics;