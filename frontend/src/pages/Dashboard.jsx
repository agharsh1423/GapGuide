import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyResumes, deleteResume } from '../services/api'
import { FileText, Trash2, MessageCircle, Calendar } from 'lucide-react'

const Dashboard = () => {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const response = await getMyResumes()
      setResumes(response.data.resumes)
    } catch (err) {
      setError('Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resume?')) return

    try {
      await deleteResume(id)
      setResumes(resumes.filter(r => r._id !== id))
    } catch (err) {
      alert('Failed to delete resume')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
        <p className="text-gray-600">Manage your resumes and job recommendations</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Resumes</p>
              <p className="text-3xl font-bold text-blue-600">{resumes.length}</p>
            </div>
            <FileText className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <Link
          to="/upload"
          className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg shadow-md text-white hover:shadow-xl transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Upload New</p>
              <p className="text-2xl font-bold">Resume</p>
            </div>
            <FileText className="h-12 w-12" />
          </div>
        </Link>

        <Link
          to="/skills-match"
          className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-lg shadow-md text-white hover:shadow-xl transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Find Jobs by</p>
              <p className="text-2xl font-bold">Skills</p>
            </div>
            <MessageCircle className="h-12 w-12" />
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">My Resumes</h2>

        {resumes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No resumes uploaded yet</p>
            <Link
              to="/upload"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Upload Your First Resume
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <div
                key={resume._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{resume.fileName}</h3>
                    </div>

                    {resume.parsedData?.name && (
                      <p className="text-gray-700 mb-1">
                        <strong>Name:</strong> {resume.parsedData.name}
                      </p>
                    )}

                    {resume.aiAnalysis?.primaryDomain && (
                      <p className="text-gray-700 mb-1">
                        <strong>Domain:</strong> {resume.aiAnalysis.primaryDomain}
                      </p>
                    )}

                    {resume.parsedData?.skills && resume.parsedData.skills.length > 0 && (
                      <div className="mt-2">
                        <strong className="text-gray-700">Skills:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {resume.parsedData.skills.slice(0, 8).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {resume.parsedData.skills.length > 8 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{resume.parsedData.skills.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(resume.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {resume.jobRecommendations && (
                        <span>
                          {resume.jobRecommendations.length} job recommendations
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Link
                      to={`/resume/${resume._id}`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 text-center"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/chat/${resume._id}`}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-1"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Chat</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(resume._id)}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
