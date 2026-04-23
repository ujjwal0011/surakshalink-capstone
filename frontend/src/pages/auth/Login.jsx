import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to their dashboard
  if (user) {
    const dashboardPath =
      user.role === 'principal' ? '/dashboard/principal' :
        user.role === 'teacher' ? '/dashboard/teacher' :
          user.role === 'student' ? '/dashboard/student' :
            '/login';
    return <Navigate to={dashboardPath} replace />;
  }

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Login returns the user role (as configured in AuthContext)
      const role = await login(formData.email, formData.password);

      toast.success('Welcome back!');

      // Intelligent Redirect based on Role
      if (role === 'principal') navigate('/dashboard/principal');
      else if (role === 'teacher') navigate('/dashboard/teacher');
      else if (role === 'student') navigate('/dashboard/student');

    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Suraksha<span className="text-blue-600">Link</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email" required
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password" required
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Don't have an account?</p>
            <div className="mt-2 flex justify-center gap-4 text-sm font-medium">
              <Link to="/register-principal" className="text-blue-600 hover:text-blue-700">Register School</Link>
              <span className="text-gray-300">|</span>
              <Link to="/register-teacher" className="text-blue-600 hover:text-blue-700">Teacher Join</Link>
              <span className="text-gray-300">|</span>
              <Link to="/register-student" className="text-blue-600 hover:text-blue-700">Student Join</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;