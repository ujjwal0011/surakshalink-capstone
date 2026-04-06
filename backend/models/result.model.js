import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },

  // Performance Metrics
  score: { type: Number, required: true },       // Percentage (0-100)
  totalQuestions: { type: Number, required: true },
  xpEarned: { type: Number, default: 0 },        // Gamified Reward

  // Analytics Detail
  correctAnswers: { type: Number, required: true },
  wrongAnswers: { type: Number, required: true },
  timeTaken: { type: Number }, // seconds used

  // Anti-Cheating Data
  violations: { type: Number, default: 0 },          // Tab switches, fullscreen exits, etc.
  terminatedBySystem: { type: Boolean, default: false }, // Was quiz auto-ended due to violations?

  completedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Result', resultSchema);