import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const RegisterPrincipal = () => {
  const { registerPrincipal } = useAuth();
  
  // State to store the generated codes after success
  const [successData, setSuccessData] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    schoolName: '',
    schoolAddress: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // The backend returns the PINs in 'res.data'
      const res = await registerPrincipal(formData);
      setSuccessData(res.data); 
      toast.success('School Registered Successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  // View 1: Success Screen (Shows PINs)
  if (successData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-lg w-full p-8 bg-white rounded-xl shadow-2xl border-2 border-green-100">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Registration Complete!</h2>
            <p className="mt-2 text-gray-600">Please copy these credentials. You will need to share them with your staff and students.</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4 border border-gray-200">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">School Code</label>
              <div className="text-2xl font-mono font-bold text-blue-600">{successData.schoolCode}</div>
              <p className="text-xs text-gray-400">Required for everyone to join.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase">Teacher PIN</label>
                <div className="text-xl font-mono font-bold text-gray-800">{successData.teacherPin}</div>
              </div>
              <div className="p-3 bg-white rounded border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase">Student PIN</label>
                <div className="text-xl font-mono font-bold text-gray-800">{successData.studentPin}</div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link to="/login" className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // View 2: Registration Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Register Your School</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Principal Name</label>
            <input 
              type="text" required 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Official Email</label>
            <input 
              type="email" required 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" required 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700">School Name</label>
            <input 
              type="text" required 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address / City</label>
            <input 
              type="text" required 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => setFormData({...formData, schoolAddress: e.target.value})}
            />
          </div>

          <button type="submit" className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 font-medium">
            Create School Account
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPrincipal;