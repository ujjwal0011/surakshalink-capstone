import mongoose from 'mongoose';

const guideSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },

  // Category — preset options + teachers can add custom ones
  category: { type: String, default: 'General' },

  // Visual identifier for cards (emoji)
  coverEmoji: { type: String, default: '📖' },

  // The actual guide content — array of sections
  sections: [{
    heading: { type: String, required: true },
    body: { type: String, required: true }
  }],

  // Who CREATED this guide? (The Teacher)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Who can ACCESS this guide? (The entire School)
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Guide', guideSchema);
