const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

// Get job recommendations based on skills
router.post('/recommend-by-skills', authMiddleware, async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'Skills array is required' });
    }

    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;
    const response = await axios.post(`${pythonServiceUrl}/recommend-jobs-by-skills`, {
      skills,
    });

    res.json({
      recommendations: response.data.recommendations,
    });
  } catch (error) {
    console.error('Job recommendation error:', error);
    res.status(500).json({ error: 'Failed to get job recommendations', details: error.message });
  }
});

// Get common job categories
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const categories = [
      'Frontend Development',
      'Backend Development',
      'Full Stack Development',
      'Mobile Development',
      'DevOps Engineering',
      'Data Science',
      'Machine Learning Engineering',
      'AI Engineering',
      'Cloud Architecture',
      'Cybersecurity',
      'Game Development',
      'Blockchain Development',
      'QA/Testing',
      'UI/UX Design',
      'Product Management',
    ];

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
