import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import toast from "react-hot-toast";

const PRESET_CATEGORIES = ["Earthquake", "Fire", "Flood", "Cyclone", "Tsunami", "General"];

const EMOJI_OPTIONS = ["📖", "🔥", "🌊", "🌪️", "🏔️", "⚡", "🛡️", "🚨", "🏥", "📋", "🎒", "🧯", "🚒", "💧", "🌋"];

const CreateGuide = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [serverCategories, setServerCategories] = useState([]);

  // Guide details
  const [guideDetails, setGuideDetails] = useState({
    title: "",
    description: "",
    category: "General",
    coverEmoji: "📖",
  });

  // Sections
  const [sections, setSections] = useState([
    { heading: "", body: "" },
  ]);

  // Fetch existing categories from server (includes custom ones)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/guides/categories");
        setServerCategories(data);
      } catch {
        // Silently fail — preset categories are still available
      }
    };
    fetchCategories();
  }, []);

  // Merge preset + server categories (unique)
  const allCategories = [...new Set([...PRESET_CATEGORIES, ...serverCategories])];

  // --- HANDLERS ---
  const handleDetailChange = (e) => {
    setGuideDetails({ ...guideDetails, [e.target.name]: e.target.value });
  };

  const selectCategory = (cat) => {
    setGuideDetails({ ...guideDetails, category: cat });
    setShowCustomInput(false);
  };

  const addCustomCategory = () => {
    const trimmed = customCategory.trim();
    if (!trimmed) return;
    setGuideDetails({ ...guideDetails, category: trimmed });
    setCustomCategory("");
    setShowCustomInput(false);
  };

  const selectEmoji = (emoji) => {
    setGuideDetails({ ...guideDetails, coverEmoji: emoji });
    setShowEmojiPicker(false);
  };

  // Section handlers
  const addSection = () => {
    setSections([...sections, { heading: "", body: "" }]);
  };

  const removeSection = (index) => {
    if (sections.length === 1) return;
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!guideDetails.title) throw new Error("Guide title is required");
      for (let s of sections) {
        if (!s.heading) throw new Error("All sections must have a heading");
        if (!s.body) throw new Error("All sections must have content");
      }

      const payload = { ...guideDetails, sections };
      await api.post("/guides/create", payload);
      toast.success("Guide created successfully!");
      navigate("/dashboard/teacher/guides");
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || "Failed to create guide");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Create New Guide</h1>
          <button
            type="button"
            onClick={() => navigate("/dashboard/teacher/guides")}
            className="text-gray-600 hover:underline"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: GUIDE DETAILS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-emerald-600 flex items-center gap-2">
              <span className="h-6 w-6 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700">1</span>
              Guide Details
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guide Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. What to Do During an Earthquake"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  value={guideDetails.title}
                  onChange={handleDetailChange}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <textarea
                  name="description"
                  rows="2"
                  placeholder="Brief summary of what this guide covers..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  value={guideDetails.description}
                  onChange={handleDetailChange}
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => selectCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                        guideDetails.category === cat
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200"
                          : "bg-white text-gray-600 border-gray-300 hover:border-emerald-400 hover:text-emerald-600"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    className="px-4 py-2 rounded-full text-sm font-semibold border border-dashed border-gray-400 text-gray-500 hover:border-emerald-500 hover:text-emerald-600 transition-all"
                  >
                    + Custom
                  </button>
                </div>

                {showCustomInput && (
                  <div className="flex gap-2 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Enter custom category..."
                      className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCategory())}
                    />
                    <button
                      type="button"
                      onClick={addCustomCategory}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Emoji Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Icon</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="h-14 w-14 bg-gray-100 rounded-xl flex items-center justify-center text-3xl border-2 border-gray-200 hover:border-emerald-400 transition"
                  >
                    {guideDetails.coverEmoji}
                  </button>
                  <span className="text-sm text-gray-500">Click to change</span>
                </div>
                {showEmojiPicker && (
                  <div className="mt-2 p-3 bg-white border border-gray-200 rounded-xl shadow-md flex flex-wrap gap-2 animate-fade-in">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => selectEmoji(emoji)}
                        className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center hover:bg-gray-100 transition ${
                          guideDetails.coverEmoji === emoji ? "bg-emerald-100 ring-2 ring-emerald-500" : ""
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: CONTENT SECTIONS */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-emerald-600 flex items-center gap-2">
                <span className="h-6 w-6 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700">2</span>
                Guide Content
              </h2>
              <span className="text-sm text-gray-500">
                {sections.length} Section{sections.length !== 1 ? "s" : ""} Added
              </span>
            </div>

            {sections.map((section, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative group"
              >
                {/* Remove Button */}
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    REMOVE
                  </button>
                )}

                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Section {index + 1} — Heading
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Step 1: Drop, Cover, and Hold On"
                    className="w-full p-3 border-b-2 border-gray-200 focus:border-emerald-500 outline-none transition font-semibold text-lg"
                    value={section.heading}
                    onChange={(e) => handleSectionChange(index, "heading", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Content
                  </label>
                  <textarea
                    required
                    rows="5"
                    placeholder="Write the guide content for this section..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-gray-700 leading-relaxed"
                    value={section.body}
                    onChange={(e) => handleSectionChange(index, "body", e.target.value)}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addSection}
              className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-emerald-500 hover:text-emerald-600 font-semibold transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Another Section
            </button>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end pt-4 pb-8">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Publish Guide
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGuide;
