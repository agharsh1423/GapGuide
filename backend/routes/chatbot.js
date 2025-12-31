const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const Resume = require('../models/Resume');
const ChatConversation = require('../models/ChatConversation');

// Chat about resume
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { resumeId, message, conversationHistory, conversationId } = req.body;

    if (!resumeId || !message) {
      return res.status(400).json({ error: 'Resume ID and message are required' });
    }

    // Get resume
    const resume = await Resume.findOne({ _id: resumeId, userId: req.userId });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Call Python AI service for chat
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;
    const response = await axios.post(`${pythonServiceUrl}/chat`, {
      resumeData: {
        parsedData: resume.parsedData,
        analysis: resume.aiAnalysis,
        rawText: resume.rawText,
      },
      message,
      conversationHistory: conversationHistory || [],
    });

    // Save or update conversation
    let conversation;
    if (conversationId) {
      // Update existing conversation
      conversation = await ChatConversation.findOne({ _id: conversationId, userId: req.userId });
      if (conversation) {
        conversation.messages.push({ role: 'user', content: message });
        conversation.messages.push({ role: 'assistant', content: response.data.reply });
        await conversation.save();
      }
    } else {
      // Create new conversation
      conversation = new ChatConversation({
        userId: req.userId,
        resumeId,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: response.data.reply },
        ],
      });
      await conversation.save();
    }

    res.json({
      reply: response.data.reply,
      conversationHistory: response.data.conversationHistory,
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Failed to process chat message', details: error.message });
  }
});

// Get all chat conversations for user
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await ChatConversation.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .populate('resumeId', 'fileName');

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get single conversation
router.get('/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const conversation = await ChatConversation.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('resumeId', 'fileName parsedData');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Delete conversation
router.delete('/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const conversation = await ChatConversation.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await ChatConversation.deleteOne({ _id: req.params.id });
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Get interview questions based on resume
router.post('/interview-questions', authMiddleware, async (req, res) => {
  try {
    const { resumeId } = req.body;

    if (!resumeId) {
      return res.status(400).json({ error: 'Resume ID is required' });
    }

    // Get resume
    const resume = await Resume.findOne({ _id: resumeId, userId: req.userId });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Call Python AI service for interview questions
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;
    const response = await axios.post(`${pythonServiceUrl}/generate-interview-questions`, {
      parsedData: resume.parsedData,
      analysis: resume.aiAnalysis,
    });

    res.json({
      questions: response.data.questions,
    });
  } catch (error) {
    console.error('Interview questions error:', error);
    res.status(500).json({ error: 'Failed to generate interview questions', details: error.message });
  }
});

module.exports = router;
