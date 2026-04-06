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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/dashboard/principal/analytics')} className="text-gray-500 hover:text-gray-800">
          &larr; Back to List
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Class Comparison Report</h1>
      </div>

      {/* GRAPH: COMPARISON BAR CHART */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h3 className="font-bold text-gray-700 mb-6">Average Score by Class Teacher</h3>
        
        {reportData.length === 0 ? (
          <p className="text-gray-400 italic">No classes have attempted this quiz yet.</p>
        ) : (
          <div className="space-y-4">
            {reportData.map((cls, index) => (
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

      {/* DATA TABLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportData.map((cls, index) => (
          <StatCard 
            key={index}
            title={`${cls.teacher}'s Performance`}
            value={`${cls.avgScore}%`}
            subtext={`${cls.totalStudents} Students Attempted`}
            color={cls.avgScore >= 75 ? "green" : "blue"}
          />
        ))}
      </div>
    </div>
  );
};

export default SchoolAnalytics;