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
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            <span className="text-5xl">📚</span>
            Preparedness Guides
          </h1>
          <p className="text-emerald-100 text-lg max-w-2xl">
            Learn essential safety procedures and disaster preparedness techniques from your school's experts.
          </p>

          {/* Stats */}
          <div className="flex gap-6 mt-6">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
              <p className="text-2xl font-black">{guides.length}</p>
              <p className="text-xs text-emerald-100 font-medium">Total Guides</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
              <p className="text-2xl font-black">{categories.length}</p>
              <p className="text-xs text-emerald-100 font-medium">Categories</p>
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
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                activeCategory === "All"
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
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                    activeCategory === cat
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
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Gradient Card Header */}
                  <div className={`h-36 bg-gradient-to-br ${colors.gradient} flex items-center justify-center relative overflow-hidden`}>
                    {/* Abstract pattern overlay */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-4 left-4 w-20 h-20 border-4 border-white rounded-full"></div>
                      <div className="absolute bottom-4 right-4 w-16 h-16 border-4 border-white rounded-lg rotate-45"></div>
                    </div>
                    <span className="text-6xl drop-shadow-lg group-hover:scale-125 transition-transform duration-500">
                      {guide.coverEmoji || "📖"}
                    </span>
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-white/90 ${colors.text} backdrop-blur-sm`}>
                      {guide.category || "General"}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-800 mb-1.5 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10 leading-relaxed">
                      {guide.description || "Learn about disaster preparedness."}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                      <span className="flex items-center gap-1">
                        📝 {guide.sections?.length || 0} section{guide.sections?.length !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        👤 {guide.createdBy?.name || "Teacher"}
                      </span>
                    </div>

                    {/* Read CTA */}
                    <div className="mt-4 w-full text-center bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-bold group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
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
