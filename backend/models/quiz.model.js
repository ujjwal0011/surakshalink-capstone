import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  
  // Who AUTHORIZED/CREATED this quiz? (The Teacher)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Who can ACCESS this quiz? (The entire School)
  // This allows Teacher B's students to see Teacher A's quiz.
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  
  // Gamification Settings
  timeLimit: { type: Number, default: 60 }, // Global timer (in seconds)
  xpReward: { type: Number, default: 100 }, // Max XP available for 100% score
  
  questions: [{
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }], // Array of 4 strings
    correctOptionIndex: { type: Number, required: true } // 0, 1, 2, or 3
  }],

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Quiz', quizSchema);