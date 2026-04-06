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
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-2xl border-2 border-green-100 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Registration Complete!</h2>
          <p className="mt-2 text-gray-600">You have been assigned a unique Class Code.</p>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Your Class Code</label>
            <div className="text-4xl font-mono font-black text-gray-800 mt-2 tracking-widest">
              {successData.classCode}
            </div>
            <p className="text-xs text-gray-500 mt-2">Share this code with your students so they can join your class.</p>
          </div>

          <Link to="/login" className="mt-8 block w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition">
            Proceed to Login
          </Link>
        </div>
      </div>
    );
  }

  // --- FORM VIEW ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Teacher Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" placeholder="Full Name" required 
            className="w-full p-2 border rounded"
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <input 
            type="email" placeholder="Email Address" required 
            className="w-full p-2 border rounded"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password" placeholder="Password" required 
            className="w-full p-2 border rounded"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" placeholder="School Code (e.g. SCH-123)" required 
              className="p-2 border rounded"
              onChange={(e) => setFormData({...formData, schoolCode: e.target.value})}
            />
            <input 
              type="text" placeholder="Teacher PIN" required maxLength={4}
              className="p-2 border rounded"
              onChange={(e) => setFormData({...formData, teacherPin: e.target.value})}
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Register as Teacher
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterTeacher;