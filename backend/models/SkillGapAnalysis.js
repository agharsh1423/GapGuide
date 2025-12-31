const mongoose = require('mongoose');

const skillGapAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  targetJobTitle: {
    type: String,
    required: true,
  },
  matchPercentage: {
    type: Number,
    required: true,
  },
  userSkills: [String],
  requiredSkills: [String],
  matchedSkills: [String],
  missingSkills: [String],
  skillsToImprove: [{
    skill: String,
    currentLevel: String,
    requiredLevel: String,
    priority: String,
  }],
  learningPath: [{
    skill: String,
    resources: [String],
    estimatedTime: String,
    difficulty: String,
  }],
  summary: String,
  recommendations: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SkillGapAnalysis', skillGapAnalysisSchema);
