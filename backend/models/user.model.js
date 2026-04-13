import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["principal", "teacher", "student"],
    required: true,
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },

  // NEW: For Teachers -> The code they give to students (e.g. "BIO-101")
  myClassCode: { type: String, unique: true, sparse: true },

  // NEW: For Students -> Links them to a specific teacher
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  totalXP: { type: Number, default: 0 },

  // AI Credits System (students only)
  aiCredits: {
    summary: { type: Number, default: 2 },      // Free summary credits (rollover, cap 10)
    chatbot: { type: Number, default: 3 },       // Free chatbot credits (rollover, cap 15)
    purchased: { type: Number, default: 0 },     // Purchased credits (shared pool, no cap)
    lastResetDate: { type: String, default: '' }, // "YYYY-MM-DD" — triggers daily top-up
  },

  // Gamification: Items purchased from the Go-Bag Shop
  ownedItems: [{ type: String }],

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
