import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { jwtDecode } from "jwt-decode"; // Fix import

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in when app loads
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Ensure token isn't expired
        if (decoded.exp * 1000 > Date.now()) {
            setUser(decoded); // Use decoded data or fetch profile here
        } else {
            localStorage.removeItem('token');
        }
      } catch (error) {
        console.error("Invalid token");
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    // You might want to decode the token again or use the user data from response
    const decoded = jwtDecode(data.token); 
    setUser({ ...decoded, ...data.user }); 
    return data.user.role; // Return role for redirecting
  };

  const registerPrincipal = async (formData) => {
    return await api.post('/auth/register/principal', formData);
  };
  
  const registerTeacher = async (formData) => {
    return await api.post('/auth/register/teacher', formData);
  };
  
  const registerStudent = async (formData) => {
    return await api.post('/auth/register/student', formData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, registerPrincipal, registerTeacher, registerStudent, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom Hook to use Auth easily
export const useAuth = () => useContext(AuthContext);