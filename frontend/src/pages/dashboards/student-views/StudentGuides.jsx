import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";

const CATEGORY_COLORS = {
  Earthquake: { bg: "bg-orange-100", text: "text-orange-800", gradient: "from-orange-500 to-red-500", emoji: "🏔️" },
  Fire: { bg: "bg-red-100", text: "text-red-800", gradient: "from-red-500 to-yellow-500", emoji: "🔥" },
  Flood: { bg: "bg-blue-100", text: "text-blue-800", gradient: "from-blue-500 to-cyan-500", emoji: "🌊" },
  Cyclone: { bg: "bg-purple-100", text: "text-purple-800", gradient: "from-purple-500 to-indigo-500", emoji: "🌪️" },
  Tsunami: { bg: "bg-teal-100", text: "text-teal-800", gradient: "from-teal-500 to-blue-500", emoji: "🌊" },
  General: { bg: "bg-gray-100", text: "text-gray-800", gradient: "from-gray-500 to-slate-600", emoji: "📖" },
};

const getColorForCategory = (category) => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
};

const StudentGuides = () => {
  const { user } = useAuth();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const { data } = await api.get("/guides");
        setGuides(data);
        // Extract unique categories
        const cats = [...new Set(data.map((g) => g.category || "General"))];
        setCategories(cats);
      } catch (error) {
        console.error("Failed to load guides");
      } finally {
        setLoading(false);
      }
    };
    fetchGuides();
  }, []);

  const filteredGuides = activeCategory === "All"
    ? guides
    : guides.filter((g) => g.category === activeCategory);

  // Determine the base path based on user role
  const basePath = user?.role === "principal"
    ? "/dashboard/principal/guides"
    : "/dashboard/student/guides";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Preparedness Guides
          </h1>
          <p className="text-gray-500 text-sm">
            Learn essential safety procedures and disaster preparedness techniques from your school's experts.
          </p>

          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <p className="text-lg font-bold text-gray-900">{guides.length}</p>
              <p className="text-xs text-gray-500 font-medium">Total Guides</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <p className="text-lg font-bold text-gray-900">{categories.length}</p>
              <p className="text-xs text-gray-500 font-medium">Categories</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Category Filter Tabs */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory("All")}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${activeCategory === "All"
                  ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400 hover:shadow"
                }`}
            >
              All Guides
            </button>
            {categories.map((cat) => {
              const colors = getColorForCategory(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${activeCategory === cat
                      ? `${colors.bg} ${colors.text} shadow-md`
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400 hover:shadow"
                    }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-4">Loading guides...</p>
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {activeCategory === "All" ? "No Guides Available Yet" : `No ${activeCategory} Guides`}
            </h3>
            <p className="text-gray-500">
              {activeCategory === "All"
                ? "Your teachers haven't published any guides yet. Check back soon!"
                : "Try selecting a different category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide, index) => {
              const colors = getColorForCategory(guide.category);
              return (
                <Link
                  key={guide._id}
                  to={`${basePath}/${guide._id}`}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Clean Card Header */}
                  <div className={`px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50`}>
                    <span className="text-3xl">
                      {guide.coverEmoji || "📖"}
                    </span>
                    <span className={`px-2.5 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {guide.category || "General"}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="font-semibold text-base text-gray-800 mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10 leading-relaxed">
                      {guide.description || "Learn about disaster preparedness."}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                      <span>
                        {guide.sections?.length || 0} section{guide.sections?.length !== 1 ? "s" : ""}
                      </span>
                      <span>
                        {guide.createdBy?.name || "Teacher"}
                      </span>
                    </div>

                    {/* Read CTA */}
                    <div className="mt-4 w-full text-center bg-gray-50 text-gray-600 py-2 rounded-lg text-sm font-medium group-hover:bg-blue-600 group-hover:text-white transition-all">
                      Read Guide →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentGuides;
