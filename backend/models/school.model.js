import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  // Unique code for the school itself (e.g., 'SCH-123') to help users find it
  schoolCode: { type: String, required: true, unique: true }, 
  // The secret 4-digit PINs
  teacherPin: { type: String, required: true },
  studentPin: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('School', schoolSchema);