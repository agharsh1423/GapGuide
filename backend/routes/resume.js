const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const Resume = require('../models/Resume');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|txt|doc|docx|tex/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'text/plain' || file.mimetype === 'application/x-tex';

    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, TXT, DOC, DOCX, and TEX files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Extract text from uploaded file
async function extractText(filePath, fileType) {
  try {
    if (fileType === '.pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } else if (fileType === '.docx' || fileType === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (fileType === '.txt' || fileType === '.tex') {
      return await fs.readFile(filePath, 'utf-8');
    }
    return '';
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to extract text from file');
  }
}

// Upload and parse resume
router.post('/upload', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileType = path.extname(req.file.originalname).toLowerCase();
    const rawText = await extractText(req.file.path, fileType);

    // Call Python AI service for parsing
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;
    const parseResponse = await axios.post(`${pythonServiceUrl}/parse-resume`, {
      text: rawText,
    });

    // Create resume document
    const resume = new Resume({
      userId: req.userId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType,
      rawText,
      parsedData: parseResponse.data.parsedData,
      aiAnalysis: parseResponse.data.analysis,
    });

    // Get job recommendations
    const jobResponse = await axios.post(`${pythonServiceUrl}/recommend-jobs`, {
      parsedData: parseResponse.data.parsedData,
      analysis: parseResponse.data.analysis,
    });

    resume.jobRecommendations = jobResponse.data.recommendations;
    await resume.save();

    res.json({
      message: 'Resume uploaded and analyzed successfully',
      resumeId: resume._id,
      parsedData: resume.parsedData,
      analysis: resume.aiAnalysis,
      jobRecommendations: resume.jobRecommendations,
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to process resume', details: error.message });
  }
});

// Upload resume as text
router.post('/upload-text', authMiddleware, async (req, res) => {
  try {
    const { resumeText, fileName } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    // Call Python AI service for parsing
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;
    const parseResponse = await axios.post(`${pythonServiceUrl}/parse-resume`, {
      text: resumeText,
    });

    // Create resume document
    const resume = new Resume({
      userId: req.userId,
      fileName: fileName || 'text-input.txt',
      fileType: '.txt',
      rawText: resumeText,
      parsedData: parseResponse.data.parsedData,
      aiAnalysis: parseResponse.data.analysis,
    });

    // Get job recommendations
    const jobResponse = await axios.post(`${pythonServiceUrl}/recommend-jobs`, {
      parsedData: parseResponse.data.parsedData,
      analysis: parseResponse.data.analysis,
    });

    resume.jobRecommendations = jobResponse.data.recommendations;
    await resume.save();

    res.json({
      message: 'Resume analyzed successfully',
      resumeId: resume._id,
      parsedData: resume.parsedData,
      analysis: resume.aiAnalysis,
      jobRecommendations: resume.jobRecommendations,
    });
  } catch (error) {
    console.error('Resume text upload error:', error);
    res.status(500).json({ error: 'Failed to process resume text', details: error.message });
  }
});

// Get all resumes for user
router.get('/my-resumes', authMiddleware, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({ uploadedAt: -1 });
    res.json({ resumes });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// Get single resume
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json({ resume });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// Delete resume
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Delete file if exists
    if (resume.filePath) {
      try {
        await fs.unlink(resume.filePath);
      } catch (error) {
        console.error('File deletion error:', error);
      }
    }

    await Resume.deleteOne({ _id: req.params.id });
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

module.exports = router;
