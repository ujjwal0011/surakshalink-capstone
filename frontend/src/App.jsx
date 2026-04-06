import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast"; // Notifications

// Pages (You'll create these next)
import Login from "./pages/auth/Login";
import RegisterPrincipal from "./pages/auth/RegisterPrincipal";
import RegisterTeacher from "./pages/auth/RegisterTeacher";
import RegisterStudent from "./pages/auth/RegisterStudent";
import PrincipalDashboard from "./pages/dashboards/PrincipalDashboard";
import TeacherDashboard from "./pages/dashboards/TeacherDashboard";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import QuizManager from "./pages/dashboards/teacher-views/QuizManager";
import CreateQuiz from "./pages/dashboards/teacher-views/CreateQuiz";
import QuizAnalytics from "./pages/dashboards/teacher-views/QuizAnalytics";
import StudentLobby from "./pages/dashboards/student-views/StudentLobby";
import PlayQuiz from "./pages/dashboards/student-views/PlayQuiz";
import SchoolAnalytics from "./pages/dashboards/principal-views/SchoolAnalytics";
import ProtectedRoute from "./components/ProtectedRoute";
import { SocketProvider } from "./context/SocketContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register-principal" element={<RegisterPrincipal />} />
            <Route path="/register-teacher" element={<RegisterTeacher />} />
            <Route path="/register-student" element={<RegisterStudent />} />

            {/* Protected Routes */}

            {/* Principal Routes */}
            <Route element={<ProtectedRoute allowedRoles={["principal"]} />}>
              <Route
                path="/dashboard/principal"
                element={<PrincipalDashboard />}
              />
              <Route
                path="/dashboard/principal/analytics"
                element={<SchoolAnalytics />}
              />
              <Route
                path="/dashboard/principal/analytics/:quizId"
                element={<SchoolAnalytics />}
              />
            </Route>

            {/* Teacher Routes */}
            <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
              <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
              <Route
                path="/dashboard/teacher/quizzes"
                element={<QuizManager />}
              />
              <Route
                path="/dashboard/teacher/quizzes/create"
                element={<CreateQuiz />}
              />
            </Route>
            <Route
              path="/dashboard/teacher/quiz/:id/analytics"
              element={<QuizAnalytics />}
            />

            {/* Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
              {/* <Route path="/dashboard/student" element={<StudentDashboard />} /> */}
              <Route path="/dashboard/student" element={<StudentLobby />} />

              {/* The Game Route */}
              <Route
                path="/dashboard/student/quiz/:id"
                element={<PlayQuiz />}
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
