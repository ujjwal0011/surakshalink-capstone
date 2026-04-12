import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { Link } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

const PrincipalDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [customMessage, setCustomMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [activeAlert, setActiveAlert] = useState(false);

  // RAW DATA: All students in the school
  const [allStudents, setAllStudents] = useState([]);

  // 1. Fetch All Data on Mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/users/students");
        // Add safetyStatus to local state
        const initializedData = data.map((s) => ({
          ...s,
          safetyStatus: "PENDING",
        }));
        setAllStudents(initializedData);
      } catch (error) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
  }, []);

  // 2. Real-Time Listener: Updates specific student in the big list
  useEffect(() => {
    if (!socket) return;

    socket.on("update_dashboard", (data) => {
      if (data.status === "SAFE") {
        setAllStudents((prevStudents) =>
          prevStudents.map((student) =>
            student._id === data.studentId
              ? { ...student, safetyStatus: "SAFE" }
              : student
          )
        );
        toast.success(`Student Marked Safe!`, { id: "safe-update" });
      }
    });

    return () => {
      socket.off("update_dashboard");
    };
  }, [socket]);

  // 3. TRANSFORM DATA: Group Students by Teacher
  // This runs automatically whenever 'allStudents' changes
  const classStats = useMemo(() => {
    const stats = {};

    allStudents.forEach((student) => {
      // Handle students with no teacher assigned
      const teacherName = student.teacherId?.name || "Unassigned";

      if (!stats[teacherName]) {
        stats[teacherName] = { total: 0, safe: 0, students: [] };
      }

      stats[teacherName].total += 1;
      if (student.safetyStatus === "SAFE") {
        stats[teacherName].safe += 1;
      }
      stats[teacherName].students.push(student);
    });

    return stats;
  }, [allStudents]);

  // Calculate Global Totals
  const totalStudents = allStudents.length;
  const totalSafe = allStudents.filter((s) => s.safetyStatus === "SAFE").length;

  const triggerAlert = (type) => {
    if (!socket) return toast.error("Connection Error");
    if (!window.confirm(`Broadcast ${type} alert?`)) return;

    setIsBroadcasting(true);
    setActiveAlert(true);

    // Reset all statuses locally for a new drill
    setAllStudents((prev) =>
      prev.map((s) => ({ ...s, safetyStatus: "PENDING" }))
    );

    const alertData = {
      schoolId: user.schoolId,
      type: type,
      message: customMessage || `ATTENTION: ${type} REPORTED.`,
      timestamp: new Date().toISOString(),
    };

    socket.emit("trigger_alert", alertData);
    toast.success(`${type} Alert Broadcasted!`);
    setIsBroadcasting(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Principal Command Center
        </h1>
        <p className="text-gray-500 text-sm">School Code: {user?.schoolId}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Controls (Width 4/12) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-red-500">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🚨 Emergency Trigger
            </h2>
            <input
              type="text"
              placeholder="Custom Message..."
              className="w-full p-3 mb-4 border border-gray-300 rounded"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
            <div className="space-y-3">
              <button
                onClick={() => triggerAlert("FIRE")}
                disabled={isBroadcasting}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow font-bold text-lg"
              >
                🔥 FIRE ALERT
              </button>
              <button
                onClick={() => triggerAlert("DRILL")}
                disabled={isBroadcasting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow font-bold text-lg"
              >
                🏃 CONDUCT DRILL
              </button>

              <div className="bg-white rounded-xl shadow-sm p-6 mt-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-2">
                  📊 Data & Reports
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Analyze performance across all classes.
                </p>

                <Link
                  to="/dashboard/principal/analytics"
                  className="block w-full text-center py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition"
                >
                  Open Analytics Hub
                </Link>
              </div>
            </div>
          </div>

          {/* Global Summary Card */}
          <div className="bg-gray-800 text-white rounded-xl shadow-md p-6">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
              Total School Status
            </h3>
            <div className="flex items-end mt-2">
              <span
                className={`text-6xl font-black ${activeAlert ? "text-green-400" : "text-gray-500"
                  }`}
              >
                {totalSafe}
              </span>
              <span className="text-2xl text-gray-500 mb-2 ml-2">
                / {totalStudents}
              </span>
            </div>
            <div className="w-full bg-gray-700 h-2 mt-4 rounded-full overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-500"
                style={{
                  width: `${totalStudents ? (totalSafe / totalStudents) * 100 : 0
                    }%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Detailed Analytics (Width 8/12) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow-md">
          <h3 className="font-bold text-gray-800 mb-4 text-xl flex items-center">
            {activeAlert && (
              <span className="animate-pulse h-3 w-3 bg-red-500 rounded-full mr-3"></span>
            )}
            Live Class Reports
          </h3>

          {Object.keys(classStats).length === 0 ? (
            <p className="text-gray-400 italic">No classes found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(classStats).map(([teacherName, stats]) => (
                <div
                  key={teacherName}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-gray-700">
                      {teacherName}'s Class
                    </h4>
                    <span
                      className={`text-sm font-bold px-2 py-1 rounded ${stats.safe === stats.total
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                        }`}
                    >
                      {stats.safe} / {stats.total} Safe
                    </span>
                  </div>

                  {/* Progress Bar for this specific class */}
                  <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
                    <div
                      className={`h-2.5 rounded-full ${stats.safe === stats.total
                          ? "bg-green-500"
                          : "bg-yellow-400"
                        }`}
                      style={{ width: `${(stats.safe / stats.total) * 100}%` }}
                    ></div>
                  </div>

                  {/* List of missing students (Optional detail) */}
                  {stats.safe < stats.total && activeAlert && (
                    <div className="mt-2 text-xs text-red-500">
                      <strong>Missing: </strong>
                      {stats.students
                        .filter((s) => s.safetyStatus !== "SAFE")
                        .map((s) => s.name)
                        .slice(0, 3) // Show first 3 names only
                        .join(", ")}
                      {stats.total - stats.safe > 3 &&
                        ` +${stats.total - stats.safe - 3} more`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
