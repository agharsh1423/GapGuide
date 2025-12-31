import axios from 'axios'

const API_URL = 'http://localhost:3003/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const signup = (data) => api.post('/auth/signup', data)
export const login = (data) => api.post('/auth/login', data)

// Resume
export const uploadResume = (formData) => api.post('/resume/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const uploadResumeText = (data) => api.post('/resume/upload-text', data)
export const getMyResumes = () => api.get('/resume/my-resumes')
export const getResume = (id) => api.get(`/resume/${id}`)
export const deleteResume = (id) => api.delete(`/resume/${id}`)

// Jobs
export const getJobsBySkills = (skills) => api.post('/jobs/recommend-by-skills', { skills })
export const getJobCategories = () => api.get('/jobs/categories')

// Chatbot
export const sendChatMessage = (data) => api.post('/chatbot/chat', data)
export const getInterviewQuestions = (resumeId) => api.post('/chatbot/interview-questions', { resumeId })
export const getConversations = () => api.get('/chatbot/conversations')
export const getConversation = (id) => api.get(`/chatbot/conversations/${id}`)
export const deleteConversation = (id) => api.delete(`/chatbot/conversations/${id}`)

// Skill Gap Analysis
export const analyzeSkillGap = (data) => api.post('/skill-gap/analyze', data)
export const getMyAnalyses = () => api.get('/skill-gap/my-analyses')
export const getAnalysis = (id) => api.get(`/skill-gap/${id}`)
export const deleteAnalysis = (id) => api.delete(`/skill-gap/${id}`)

export default api
