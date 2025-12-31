const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  filePath: String,
  fileType: String,
  rawText: String,
  parsedData: {
    name: String,
    email: String,
    phone: String,
    skills: [String],
    experience: [{
      title: String,
      company: String,
      duration: String,
      description: String,
    }],
    education: [{
      degree: String,
      institution: String,
      year: String,
    }],
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      githubUrl: String,
      liveUrl: String,
    }],
    githubProfile: String,
    summary: String,
  },
  aiAnalysis: {
    skillLevel: String,
    primaryDomain: String,
    experienceYears: Number,
    strengths: [String],
    recommendations: [String],
  },
  jobRecommendations: [{
    jobTitle: String,
    matchPercentage: Number,
    reasoning: String,
    requiredSkills: [String],
    matchedSkills: [String],
    missingSkills: [String],
  }],
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Resume', resumeSchema);
