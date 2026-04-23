import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const RegisterStudent = () => {
  const { registerStudent } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    classCode: '' // UPDATED: Single code to link School + Teacher
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerStudent(formData);
      toast.success('Joined Class Successfully! Please Login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Student Registration</h2>
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
          
          {/* UPDATED FIELD: Class Code only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Code</label>
            <input 
              type="text" placeholder="e.g. TCH-8291 (Ask your teacher)" required 
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              onChange={(e) => setFormData({...formData, classCode: e.target.value})}
            />
            <p className="text-xs text-gray-400 mt-1">This connects you to your Teacher and School automatically.</p>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors">
            Join Class
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterStudent;