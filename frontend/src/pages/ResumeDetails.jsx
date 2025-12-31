import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getResume, getInterviewQuestions } from '../services/api'
import {
  FileText,
  Briefcase,
  Award,
  Code,
  Github,
  ExternalLink,
  MessageCircle,
  TrendingUp,
  Loader,
} from 'lucide-react'

const ResumeDetails = () => {
  const { id } = useParams()
  const [resume, setResume] = useState(null)
  const [interviewQuestions, setInterviewQuestions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResume()
  }, [id])

  const fetchResume = async () => {
    try {
      const response = await getResume(id)
      setResume(response.data.resume)
    } catch (err) {
      setError('Failed to load resume')
    } finally {
      setLoading(false)
    }
  }

  const loadInterviewQuestions = async () => {
    setLoadingQuestions(true)
    try {
      const response = await getInterviewQuestions(id)
      setInterviewQuestions(response.data.questions)
    } catch (err) {
      alert('Failed to generate interview questions')
    } finally {
      setLoadingQuestions(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !resume) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error || 'Resume not found'}
        </div>
      </div>
    )
  }

  const { parsedData, aiAnalysis, jobRecommendations } = resume

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {parsedData?.name || resume.fileName}
            </h1>
            <div className="flex items-center space-x-4 text-gray-600">
              {parsedData?.email && <span>{parsedData.email}</span>}
              {parsedData?.phone && <span>• {parsedData.phone}</span>}
            </div>
          </div>
          <Link
            to={`/chat/${id}`}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Chat About Resume</span>
          </Link>
        </div>
      </div>

      {/* AI Analysis */}
      {aiAnalysis && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2" />
            AI Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-blue-100 text-sm">Skill Level</p>
              <p className="text-xl font-semibold">{aiAnalysis.skillLevel}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Primary Domain</p>
              <p className="text-xl font-semibold">{aiAnalysis.primaryDomain}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Experience</p>
              <p className="text-xl font-semibold">
                {aiAnalysis.experienceYears} years
              </p>
            </div>
          </div>
          {aiAnalysis.strengths && aiAnalysis.strengths.length > 0 && (
            <div className="mt-4">
              <p className="text-blue-100 text-sm mb-2">Strengths</p>
              <div className="flex flex-wrap gap-2">
                {aiAnalysis.strengths.map((strength, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm"
                  >
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills */}
          {parsedData?.skills && parsedData.skills.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-blue-600" />
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {parsedData.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {parsedData?.experience && parsedData.experience.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                Experience
              </h2>
              <div className="space-y-4">
                {parsedData.experience.map((exp, idx) => (
                  <div key={idx} className="border-l-4 border-blue-600 pl-4">
                    <h3 className="font-semibold text-lg">{exp.title}</h3>
                    <p className="text-gray-700">{exp.company}</p>
                    {exp.duration && (
                      <p className="text-gray-500 text-sm">{exp.duration}</p>
                    )}
                    {exp.description && (
                      <p className="text-gray-600 mt-2">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {parsedData?.projects && parsedData.projects.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Code className="h-5 w-5 mr-2 text-blue-600" />
                Projects
              </h2>
              <div className="space-y-4">
                {parsedData.projects.map((project, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                    {project.description && (
                      <p className="text-gray-600 mb-3">{project.description}</p>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.technologies.map((tech, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex space-x-3">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Github className="h-4 w-4" />
                          <span>GitHub</span>
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Live Demo</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {parsedData?.education && parsedData.education.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-blue-600" />
                Education
              </h2>
              <div className="space-y-3">
                {parsedData.education.map((edu, idx) => (
                  <div key={idx}>
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <p className="text-gray-700">{edu.institution}</p>
                    {edu.year && <p className="text-gray-500 text-sm">{edu.year}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Job Recommendations */}
          {jobRecommendations && jobRecommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                Job Matches
              </h2>
              <div className="space-y-4">
                {jobRecommendations.map((job, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{job.jobTitle}</h3>
                      <span className="text-2xl font-bold text-blue-600">
                        {job.matchPercentage}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{job.reasoning}</p>
                    {job.matchedSkills && job.matchedSkills.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">Matched Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {job.matchedSkills.slice(0, 5).map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interview Prep */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Interview Preparation</h2>
            <button
              onClick={loadInterviewQuestions}
              disabled={loadingQuestions}
              className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400"
            >
              {loadingQuestions ? (
                <span className="flex items-center justify-center">
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </span>
              ) : (
                'Generate Interview Questions'
              )}
            </button>

            {interviewQuestions && (
              <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                {interviewQuestions.map((q, idx) => (
                  <div key={idx} className="border-l-4 border-purple-600 pl-3 py-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-semibold text-purple-600 uppercase">
                        {q.category}
                      </span>
                      <span className="text-xs text-gray-500">{q.difficulty}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {q.question}
                    </p>
                    {q.tip && (
                      <p className="text-xs text-gray-600 italic">{q.tip}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeDetails
