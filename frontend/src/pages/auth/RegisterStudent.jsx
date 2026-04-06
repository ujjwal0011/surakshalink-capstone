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
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border-t-4 border-blue-500">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Student Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" placeholder="Full Name" required 
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <input 
            type="email" placeholder="Email Address" required 
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password" placeholder="Password" required 
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          
          {/* UPDATED FIELD: Class Code only */}
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Class Code</label>
            <input 
              type="text" placeholder="e.g. TCH-8291 (Ask your teacher)" required 
              className="w-full p-3 border-2 border-blue-100 rounded focus:outline-none focus:border-blue-500 bg-blue-50"
              onChange={(e) => setFormData({...formData, classCode: e.target.value})}
            />
            <p className="text-xs text-gray-400 mt-1">This connects you to your Teacher and School automatically.</p>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200">
            Join Class
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterStudent;