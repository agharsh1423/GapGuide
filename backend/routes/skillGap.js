const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const Resume = require('../models/Resume');
const SkillGapAnalysis = require('../models/SkillGapAnalysis');

// Analyze skill gap for a target job
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { resumeId, targetJobTitle, forceReanalyze } = req.body;

    if (!resumeId || !targetJobTitle) {
      return res.status(400).json({ error: 'Resume ID and target job title are required' });
    }

    // Get resume
    const resume = await Resume.findOne({ _id: resumeId, userId: req.userId });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Check if analysis already exists (unless force reanalyze is requested)
    if (!forceReanalyze) {
      const existingAnalysis = await SkillGapAnalysis.findOne({
        userId: req.userId,
        resumeId,
        targetJobTitle: { $regex: new RegExp(`^${targetJobTitle.trim()}$`, 'i') } // case-insensitive match
      }).sort({ createdAt: -1 }); // Get the most recent one

      if (existingAnalysis) {
        return res.json({
          message: 'Returning existing analysis',
          analysisId: existingAnalysis._id,
          fromCache: true,
          analysis: {
            matchPercentage: existingAnalysis.matchPercentage,
            userSkills: existingAnalysis.userSkills,
            requiredSkills: existingAnalysis.requiredSkills,
            matchedSkills: existingAnalysis.matchedSkills,
            missingSkills: existingAnalysis.missingSkills,
            skillsToImprove: existingAnalysis.skillsToImprove,
            learningPath: existingAnalysis.learningPath,
            summary: existingAnalysis.summary,
            recommendations: existingAnalysis.recommendations,
          },
        });
      }
    }

    // Call Python AI service for skill gap analysis
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;
    const response = await axios.post(`${pythonServiceUrl}/analyze-skill-gap`, {
      resumeData: {
        parsedData: resume.parsedData,
        analysis: resume.aiAnalysis,
      },
      targetJobTitle,
    });

    // Save analysis
    const analysis = new SkillGapAnalysis({
      userId: req.userId,
      resumeId,
      targetJobTitle,
      matchPercentage: response.data.matchPercentage,
      userSkills: response.data.userSkills,
      requiredSkills: response.data.requiredSkills,
      matchedSkills: response.data.matchedSkills,
      missingSkills: response.data.missingSkills,
      skillsToImprove: response.data.skillsToImprove,
      learningPath: response.data.learningPath,
      summary: response.data.summary,
      recommendations: response.data.recommendations,
    });

    await analysis.save();

    res.json({
      message: 'Skill gap analysis completed',
      analysisId: analysis._id,
      fromCache: false,
      analysis: response.data,
    });
  } catch (error) {
    console.error('Skill gap analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze skill gap', details: error.message });
  }
});

// Get all skill gap analyses for user
router.get('/my-analyses', authMiddleware, async (req, res) => {
  try {
    const analyses = await SkillGapAnalysis.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate('resumeId', 'fileName');

    res.json({ analyses });
  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

// Get single analysis
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const analysis = await SkillGapAnalysis.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('resumeId', 'fileName');

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({ analysis });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Delete analysis
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const analysis = await SkillGapAnalysis.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    await SkillGapAnalysis.deleteOne({ _id: req.params.id });
    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
});

module.exports = router;
