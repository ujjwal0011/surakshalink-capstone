import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const RegisterTeacher = () => {
  const { registerTeacher } = useAuth();
  
  // State to store the response (which contains the Class Code)
  const [successData, setSuccessData] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    schoolCode: '',
    teacherPin: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // The backend now returns { message, classCode }
      const res = await registerTeacher(formData);
      setSuccessData(res.data);
      toast.success('Teacher Account Created!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  // --- SUCCESS VIEW: SHOW CLASS CODE ---
  if (successData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Registration Complete!</h2>
          <p className="mt-2 text-gray-500 text-sm">You have been assigned a unique Class Code.</p>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <label className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Your Class Code</label>
            <div className="text-4xl font-mono font-bold text-gray-800 mt-2 tracking-widest">
              {successData.classCode}
            </div>
            <p className="text-xs text-gray-500 mt-2">Share this code with your students so they can join your class.</p>
          </div>

          <Link to="/login" className="mt-8 block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">
            Proceed to Login
          </Link>
        </div>
      </div>
    );
  }

  // --- FORM VIEW ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Teacher Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" required 
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" required 
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" required 
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Code</label>
              <input 
                type="text" placeholder="SCH-123" required 
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                onChange={(e) => setFormData({...formData, schoolCode: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher PIN</label>
              <input 
                type="text" placeholder="4-digit" required maxLength={4}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                onChange={(e) => setFormData({...formData, teacherPin: e.target.value})}
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors">
            Register as Teacher
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterTeacher;