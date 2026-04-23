import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import toast from "react-hot-toast";

const CATEGORY_COLORS = {
  Earthquake: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", gradient: "from-orange-500 to-red-500" },
  Fire: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", gradient: "from-red-500 to-yellow-500" },
  Flood: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", gradient: "from-blue-500 to-cyan-500" },
  Cyclone: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", gradient: "from-purple-500 to-indigo-500" },
  Tsunami: { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200", gradient: "from-teal-500 to-blue-500" },
  General: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200", gradient: "from-gray-500 to-slate-600" },
};

const getColorForCategory = (category) => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
};

const GuideManager = () => {
  const { user } = useAuth();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const { data } = await api.get("/guides");
        setGuides(data);
      } catch (error) {
        console.error("Failed to load guides");
        toast.error("Failed to load guides");
      } finally {
        setLoading(false);
      }
    };
    fetchGuides();
  }, []);

  const handleDelete = async (guideId) => {
    if (!window.confirm("Are you sure you want to delete this guide?")) return;

    setDeletingId(guideId);
    try {
      await api.delete(`/guides/${guideId}`);
      setGuides((prev) => prev.filter((g) => g._id !== guideId));
      toast.success("Guide deleted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete guide");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📖 Guide Management</h1>
          <p className="text-gray-500">
            Create and manage disaster preparedness guides for your students.
          </p>
        </div>
        <Link
          to="/dashboard/teacher/guides/create"
          className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Guide
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-4">Loading your guides...</p>
        </div>
      ) : guides.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-medium text-gray-900">
            No Guides Created Yet
          </h3>
          <p className="text-gray-500 mt-2 mb-6">
            Get started by creating your first disaster preparedness guide.
          </p>
          <Link
            to="/dashboard/teacher/guides/create"
            className="text-emerald-600 font-semibold hover:underline"
          >
            Start Creating &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => {
            const colors = getColorForCategory(guide.category);
            const isOwner = guide.createdBy?._id === user?.id || guide.createdBy === user?.id;

            return (
              <div
                key={guide._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group"
              >
                {/* Card Header */}
                <div className="bg-gray-50 border-b border-gray-100 h-24 flex items-center justify-center relative">
                  <span className="text-4xl">
                    {guide.coverEmoji || "📖"}
                  </span>
                  <span className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                    {guide.category || "General"}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">
                    {guide.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">
                    {guide.description || "No description provided."}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-3 mb-4">
                    <span className="flex items-center gap-1">
                      📝 {guide.sections?.length || 0} Section{guide.sections?.length !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      👤 {guide.createdBy?.name || "Unknown"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/dashboard/teacher/guides/${guide._id}`}
                      className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
                    >
                      View
                    </Link>
                    {isOwner && (
                      <>
                        <Link
                          to={`/dashboard/teacher/guides/${guide._id}/edit`}
                          className="flex-1 text-center bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(guide._id)}
                          disabled={deletingId === guide._id}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50"
                        >
                          {deletingId === guide._id ? "..." : "✕"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GuideManager;
