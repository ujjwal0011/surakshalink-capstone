import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../../services/api";

const PrincipalDashboard = () => {
  const { user } = useAuth();

  const [allStudents, setAllStudents] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeacher, setExpandedTeacher] = useState(null);

  // Fetch all students and teachers on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, teachersRes] = await Promise.all([
          api.get("/users/students"),
          api.get("/users/teachers"),
        ]);
        setAllStudents(studentsRes.data);
        setAllTeachers(teachersRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Group students by teacher
  const studentsByTeacher = useMemo(() => {
    const grouped = {};
    allStudents.forEach((student) => {
      const teacherId = student.teacherId?._id || "unassigned";
      const teacherName = student.teacherId?.name || "Unassigned";
      if (!grouped[teacherId]) {
        grouped[teacherId] = { teacherName, students: [] };
      }
      grouped[teacherId].students.push(student);
    });
    return grouped;
  }, [allStudents]);

  const totalStudents = allStudents.length;
  const totalTeachers = allTeachers.length;
  const totalClasses = Object.keys(studentsByTeacher).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Principal Dashboard
        </h1>
        <p className="text-gray-500 text-sm">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* School Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
            🏫
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {user?.schoolName || "My School"}
            </h2>
            <p className="text-gray-400 text-sm">
              School Code: {user?.schoolId?.toString().slice(-6).toUpperCase() || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-lg">
              👩‍🏫
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Teachers
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {totalTeachers}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-lg">
              👨‍🎓
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Students
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {totalStudents}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-lg">
              📚
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Classes
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {totalClasses}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          📊 Data & Reports
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Analyze performance across all classes.
        </p>
        <Link
          to="/dashboard/principal/analytics"
          className="inline-block text-center py-3 px-6 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition"
        >
          Open Analytics Hub
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Teachers List */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
              👩‍🏫 All Teachers
            </h3>
            {allTeachers.length === 0 ? (
              <p className="text-gray-400 italic text-sm">
                No teachers registered yet.
              </p>
            ) : (
              <div className="space-y-3">
                {allTeachers.map((teacher) => {
                  const classStudents =
                    studentsByTeacher[teacher._id]?.students || [];
                  return (
                    <div
                      key={teacher._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-700">
                            {teacher.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {teacher.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {teacher.myClassCode || "—"}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            {classStudents.length} student
                            {classStudents.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Students by Class */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
              👨‍🎓 Students by Class
            </h3>
            {Object.keys(studentsByTeacher).length === 0 ? (
              <p className="text-gray-400 italic text-sm">
                No students registered yet.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(studentsByTeacher).map(
                  ([teacherId, { teacherName, students }]) => (
                    <div
                      key={teacherId}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Class Header — clickable to expand/collapse */}
                      <button
                        onClick={() =>
                          setExpandedTeacher(
                            expandedTeacher === teacherId ? null : teacherId
                          )
                        }
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition text-left"
                      >
                        <div>
                          <p className="font-bold text-gray-700">
                            {teacherName}'s Class
                          </p>
                          <p className="text-xs text-gray-400">
                            {students.length} student
                            {students.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <span className="text-gray-400 text-lg">
                          {expandedTeacher === teacherId ? "▲" : "▼"}
                        </span>
                      </button>

                      {/* Students List (expanded) */}
                      {expandedTeacher === teacherId && (
                        <div className="divide-y divide-gray-100">
                          {students.map((student, idx) => (
                            <div
                              key={student._id}
                              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    {student.name}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {student.email}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-mono bg-green-50 text-green-600 px-2 py-1 rounded">
                                {student.totalXP || 0} XP
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
