import { useState, useEffect } from 'react'
import { analyzeSkillGap, getMyResumes, getMyAnalyses, deleteAnalysis } from '../services/api'
import { Target, TrendingUp, BookOpen, Clock, AlertCircle, CheckCircle, XCircle, Trash2 } from 'lucide-react'

const SkillGapAnalysis = () => {
  const [resumes, setResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [targetJob, setTargetJob] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [pastAnalyses, setPastAnalyses] = useState([])
  const [showPast, setShowPast] = useState(false)

  useEffect(() => {
    loadResumes()
    loadPastAnalyses()
  }, [])

  const loadResumes = async () => {
    try {
      const response = await getMyResumes()
      setResumes(response.data.resumes)
      if (response.data.resumes.length > 0) {
        setSelectedResumeId(response.data.resumes[0]._id)
      }
    } catch (err) {
      console.error('Failed to load resumes:', err)
    }
  }

  const loadPastAnalyses = async () => {
    try {
      const response = await getMyAnalyses()
      setPastAnalyses(response.data.analyses)
    } catch (err) {
      console.error('Failed to load past analyses:', err)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedResumeId || !targetJob.trim()) {
      setError('Please select a resume and enter a target job title')
      return
    }

    setLoading(true)
    setError('')
    setAnalysis(null)

    try {
      const response = await analyzeSkillGap({
        resumeId: selectedResumeId,
        targetJobTitle: targetJob.trim(),
      })
      setAnalysis(response.data.analysis)
      loadPastAnalyses()
    } catch (err) {
      setError('Failed to analyze skill gap. Please try again.')
      console.error('Analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAnalysis = async (id) => {
    try {
      await deleteAnalysis(id)
      loadPastAnalyses()
      if (analysis && pastAnalyses.find(a => a._id === id)) {
        setAnalysis(null)
      }
    } catch (err) {
      console.error('Failed to delete analysis:', err)
    }
  }

  const getMatchColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPriorityColor = (priority) => {
    if (priority === 'High') return 'bg-red-100 text-red-800'
    if (priority === 'Medium') return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Target className="h-8 w-8 mr-3 text-blue-600" />
          Skill Gap Analysis
        </h1>
        <p className="text-gray-600">
          Analyze what skills you need to achieve your target job role
        </p>
      </div>

      {/* Analysis Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">New Analysis</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Resume Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Resume
            </label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {resumes.map((resume) => (
                <option key={resume._id} value={resume._id}>
                  {resume.fileName}
                </option>
              ))}
            </select>
          </div>

          {/* Target Job */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Job Title
            </label>
            <input
              type="text"
              value={targetJob}
              onChange={(e) => setTargetJob(e.target.value)}
              placeholder="e.g. Senior Full Stack Developer"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !selectedResumeId || !targetJob.trim()}
          className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <TrendingUp className="h-5 w-5" />
          <span>{loading ? 'Analyzing...' : 'Analyze Skill Gap'}</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Match Percentage */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Match Analysis</h2>
              <div className="text-right">
                <div className={`text-5xl font-bold ${getMatchColor(analysis.matchPercentage)}`}>
                  {analysis.matchPercentage}%
                </div>
                <div className="text-sm text-gray-500">Overall Match</div>
              </div>
            </div>
            <p className="text-gray-700">{analysis.summary}</p>
          </div>

          {/* Skills Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Matched Skills */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-900">You Have</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.matchedSkills && analysis.matchedSkills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="font-semibold text-red-900">You Need</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills && analysis.missingSkills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* All Required Skills */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Target className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-900">Required</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.requiredSkills && analysis.requiredSkills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Skills to Improve */}
          {analysis.skillsToImprove && analysis.skillsToImprove.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Skills to Improve</h2>
              <div className="space-y-3">
                {analysis.skillsToImprove.map((item, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{item.skill}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority} Priority
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Current: <span className="font-medium">{item.currentLevel}</span> →
                      Required: <span className="font-medium">{item.requiredLevel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Path */}
          {analysis.learningPath && analysis.learningPath.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-bold">Recommended Learning Path</h2>
              </div>
              <div className="space-y-4">
                {analysis.learningPath.map((item, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{item.skill}</h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {item.estimatedTime}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Difficulty: <span className="font-medium">{item.difficulty}</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {item.resources && item.resources.map((resource, ridx) => (
                        <li key={ridx}>{resource}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Recommendations</h2>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Past Analyses */}
      {pastAnalyses.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowPast(!showPast)}
            className="text-blue-600 hover:text-blue-700 font-semibold mb-4"
          >
            {showPast ? 'Hide' : 'Show'} Past Analyses ({pastAnalyses.length})
          </button>

          {showPast && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastAnalyses.map((item) => (
                <div key={item._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{item.targetJobTitle}</h3>
                    <button
                      onClick={() => handleDeleteAnalysis(item._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className={`text-2xl font-bold mb-2 ${getMatchColor(item.matchPercentage)}`}>
                    {item.matchPercentage}% Match
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-700">
                    {item.resumeId?.fileName || 'Unknown Resume'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SkillGapAnalysis
