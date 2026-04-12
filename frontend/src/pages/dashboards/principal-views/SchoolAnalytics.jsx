import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import StatCard from '../../../components/analytics/StatCard';

const SchoolAnalytics = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quizzes, setQuizzes] = useState([]); // List of all quizzes
  const [reportData, setReportData] = useState(null); // Selected quiz data
  const [loading, setLoading] = useState(true);

  // 1. Load Quiz List (If no ID selected)
  useEffect(() => {
    if (!quizId) {
      api.get('/quiz').then(({ data }) => {
        setQuizzes(data);
        setLoading(false);
      });
    }
  }, [quizId]);

  // 2. Load Specific Report (If ID selected)
  useEffect(() => {
    if (quizId) {
      setLoading(true);
      api.get(`/analytics/principal/${quizId}`)
        .then(({ data }) => {
          setReportData(data);
          setLoading(false);
        })
        .catch(() => navigate('/dashboard/principal/analytics'));
    }
  }, [quizId, navigate]);

  // --- VIEW 1: SELECTION LIST ---
  if (!quizId) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">School-Wide Reports</h1>
        {loading ? <div>Loading Drills...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quizzes.map(quiz => (
              <button 
                key={quiz._id}
                onClick={() => navigate(`/dashboard/principal/analytics/${quiz._id}`)}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition text-left group"
              >
                <h3 className="font-bold text-gray-800 group-hover:text-blue-600">{quiz.title}</h3>
                <p className="text-sm text-gray-500 mt-2">{quiz.questions.length} Questions</p>
                <div className="mt-4 text-xs font-bold text-blue-600 uppercase tracking-wider">
                  View Report &rarr;
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- VIEW 2: DETAILED REPORT ---
  if (loading) return <div className="p-8 text-center">Generating School Report...</div>;

  if (!reportData?.schoolStats) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-700">No Data Yet</h2>
        <p className="text-gray-500">No classes have attempted this quiz yet.</p>
        <button onClick={() => navigate('/dashboard/principal/analytics')} className="text-blue-600 mt-4 block hover:underline mx-auto">
          &larr; Back to Analytics
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/dashboard/principal/analytics')} className="text-gray-500 hover:text-gray-800">
          &larr; Back to List
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School-Wide Performance Report</h1>
          <p className="text-gray-500">Quiz: {reportData.quizTitle}</p>
        </div>
      </div>

      {/* 1. KEY STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="School Average" 
          value={`${reportData.schoolStats.avgScore}%`} 
          color={reportData.schoolStats.avgScore >= 70 ? "green" : "yellow"} 
        />
        <StatCard 
          title="Participation" 
          value={reportData.schoolStats.totalStudents} 
          subtext="Students"
          color="blue" 
        />
        <StatCard 
          title="Pass Rate" 
          value={`${reportData.schoolStats.passRate}%`} 
          color={reportData.schoolStats.passRate > 80 ? "green" : "red"} 
        />
        <StatCard 
          title="Top Score" 
          value={`${reportData.schoolStats.topScore}%`} 
          color="purple" 
        />
      </div>

      {/* 2. CLASS COMPARISON */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h3 className="font-bold text-gray-700 mb-6">Average Score by Class Teacher</h3>
        
        {reportData.classComparisons.length === 0 ? (
          <p className="text-gray-400 italic">No classes have attempted this quiz yet.</p>
        ) : (
          <div className="space-y-4">
            {reportData.classComparisons.map((cls, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-gray-700">{cls.teacher}'s Class</span>
                  <span className="font-bold text-gray-900">{cls.avgScore}% Avg</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div 
                    className={`h-full ${
                      cls.avgScore >= 80 ? 'bg-green-500' : 
                      cls.avgScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${cls.avgScore}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. SCHOOL LEADERBOARD TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-700">School-Wide Student Leaderboard</h3>
          <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded">
            Ranked by Score
          </span>
        </div>
        
        <table className="w-full text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Rank</th>
              <th className="px-6 py-3">Student Name</th>
              <th className="px-6 py-3">Class/Teacher</th>
              <th className="px-6 py-3">Score</th>
              <th className="px-6 py-3">XP Earned</th>
              <th className="px-6 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reportData.leaderboard.map((student, index) => (
              <tr key={student._id} className="hover:bg-purple-50 transition">
                <td className="px-6 py-4 font-bold text-gray-400">#{index + 1}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{student.name}</td>
                <td className="px-6 py-4 font-medium text-gray-600">{student.teacherName}</td>
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

export default SchoolAnalytics;