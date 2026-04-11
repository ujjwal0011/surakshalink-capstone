import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";

const CATEGORY_COLORS = {
  Earthquake: { bg: "bg-orange-100", text: "text-orange-800", gradient: "from-orange-500 to-red-500" },
  Fire: { bg: "bg-red-100", text: "text-red-800", gradient: "from-red-500 to-yellow-500" },
  Flood: { bg: "bg-blue-100", text: "text-blue-800", gradient: "from-blue-500 to-cyan-500" },
  Cyclone: { bg: "bg-purple-100", text: "text-purple-800", gradient: "from-purple-500 to-indigo-500" },
  Tsunami: { bg: "bg-teal-100", text: "text-teal-800", gradient: "from-teal-500 to-blue-500" },
  General: { bg: "bg-gray-100", text: "text-gray-800", gradient: "from-gray-500 to-slate-600" },
};

const getColorForCategory = (category) => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
};

const ViewGuide = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const { data } = await api.get(`/guides/${id}`);
        setGuide(data);
      } catch (error) {
        console.error("Failed to load guide");
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, [id]);

  const getBackPath = () => {
    switch (user?.role) {
      case "teacher":
        return "/dashboard/teacher/guides";
      case "principal":
        return "/dashboard/principal/guides";
      default:
        return "/dashboard/student/guides";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-4">Loading guide...</p>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Guide Not Found</h2>
          <p className="text-gray-500 mb-6">This guide may have been deleted or doesn't exist.</p>
          <button
            onClick={() => navigate(getBackPath())}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
          >
            ← Back to Guides
          </button>
        </div>
      </div>
    );
  }

  const colors = getColorForCategory(guide.category);
  const createdDate = new Date(guide.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className={`bg-gradient-to-br ${colors.gradient} text-white`}>
        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Back button */}
          <button
            onClick={() => navigate(getBackPath())}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Guides
          </button>

          <div className="flex items-start gap-6">
            {/* Emoji */}
            <div className="h-20 w-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 flex-shrink-0">
              <span className="text-4xl">{guide.coverEmoji || "📖"}</span>
            </div>

            <div className="flex-1">
              {/* Category Badge */}
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 mb-3">
                {guide.category || "General"}
              </span>

              <h1 className="text-3xl md:text-4xl font-black leading-tight mb-3">
                {guide.title}
              </h1>

              {guide.description && (
                <p className="text-white/80 text-lg leading-relaxed max-w-2xl">
                  {guide.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 mt-5 text-sm text-white/70">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {guide.createdBy?.name || "Teacher"}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {createdDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {guide.sections?.length || 0} section{guide.sections?.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Table of Contents */}
        {guide.sections?.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
              Table of Contents
            </h3>
            <div className="space-y-1">
              {guide.sections.map((section, index) => (
                <a
                  key={index}
                  href={`#section-${index}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition group"
                >
                  <span className="h-6 w-6 bg-gray-100 group-hover:bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 group-hover:text-emerald-700 transition">
                    {index + 1}
                  </span>
                  <span className="font-medium text-sm">{section.heading}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-8">
          {guide.sections?.map((section, index) => (
            <article
              key={index}
              id={`section-${index}`}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-20"
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <span className={`h-8 w-8 bg-gradient-to-br ${colors.gradient} rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                  {index + 1}
                </span>
                <h2 className="text-xl font-bold text-gray-800">{section.heading}</h2>
              </div>

              {/* Section Body */}
              <div className="px-6 py-5">
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px]">
                  {section.body}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom Nav */}
        <div className="mt-12 pb-8 flex justify-center">
          <button
            onClick={() => navigate(getBackPath())}
            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Guides
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewGuide;
