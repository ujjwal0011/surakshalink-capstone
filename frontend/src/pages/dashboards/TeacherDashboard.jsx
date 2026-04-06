import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ALERT STATE: Is there an active emergency?
  const [activeAlert, setActiveAlert] = useState(null); 

  // Load the Class Roster on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await api.get('/users/students');
        // Add a local 'status' property to track safe/danger UI
        const roster = data.map(s => ({ ...s, safetyStatus: 'PENDING' }));
        setStudents(roster);
      } catch (error) {
        toast.error("Failed to load class roster");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Listen for Alerts specifically in this component
  useEffect(() => {
    if (!socket) return;

    // 1. Listen for Emergency Start
    socket.on('receive_alert', (data) => {
      setActiveAlert(data); // Switches UI to Red Emergency Mode
    });

    return () => {
      socket.off('receive_alert');
    };
  }, [socket]);

  // Function to Mark Student Safe
  const handleMarkSafe = (studentId) => {
    // 1. Update Local UI
    setStudents(prev => prev.map(student => 
      student._id === studentId ? { ...student, safetyStatus: 'SAFE' } : student
    ));

    // 2. Tell the Server (Principal) immediately
    if (socket) {
      socket.emit('mark_safe', {
        schoolId: user.schoolId,
        studentId: studentId,
        status: 'SAFE',
        markedBy: user.name
      });
    }
  };

  // --- VIEW 1: NORMAL MODE ---
  if (!activeAlert) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Classroom Manager</h1>
            {/* UPDATED: Display Class Code */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-gray-500">Your Class Code:</span>
              <span className="bg-blue-100 text-blue-800 font-mono font-bold px-3 py-1 rounded text-lg border border-blue-200">
                {user?.myClassCode || 'Loading...'}
              </span>
              <Link 
      to="/dashboard/teacher/quizzes"
      className="bg-purple-600 text-white px-4 py-2 rounded shadow font-semibold hover:bg-purple-700 flex items-center"
    >
      Manage Quizzes
    </Link>
            </div>
          </div>
          <button onClick={logout} className="text-red-600 font-semibold hover:underline">Logout</button>
        </div>

        

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Student Roster ({students.length})</h2>
          {loading ? <p>Loading...</p> : (
            students.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {students.map(student => (
                  <div key={student._id} className="py-3 flex justify-between">
                    <span className="text-gray-700">{student.name}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Active</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 italic">
                No students yet. Share code <strong>{user?.myClassCode}</strong> to add them.
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // --- VIEW 2: EMERGENCY MODE (Red Screen) ---
  // (This part remains identical to before)
  return (
    <div className="min-h-screen bg-red-600 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Emergency Header */}
        <div className="bg-red-700 p-6 text-white text-center animate-pulse">
          <h1 className="text-4xl font-black uppercase tracking-widest">
            {activeAlert.type} ALERT
          </h1>
          <p className="mt-2 text-red-100 font-semibold text-lg">{activeAlert.message}</p>
        </div>

        {/* Roll Call List */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Mark Students Safe</h2>
            <button 
              onClick={() => setActiveAlert(null)} // In real app, Principal would turn this off
              className="text-xs text-gray-400 underline"
            >
              (Exit Drill Mode)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {students.map(student => (
              <div 
                key={student._id} 
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  student.safetyStatus === 'SAFE' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-red-100 bg-red-50'
                }`}
              >
                <div>
                  <p className="font-bold text-gray-800">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.email}</p>
                </div>
                
                {student.safetyStatus === 'PENDING' ? (
                  <button 
                    onClick={() => handleMarkSafe(student._id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow font-bold"
                  >
                    MARK SAFE
                  </button>
                ) : (
                  <span className="flex items-center text-green-700 font-bold">
                    ✓ SAFE
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;