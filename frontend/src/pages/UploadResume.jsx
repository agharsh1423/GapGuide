import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadResume, uploadResumeText } from '../services/api'
import { Upload, FileText, Loader } from 'lucide-react'

const UploadResume = () => {
  const navigate = useNavigate()
  const [uploadType, setUploadType] = useState('file') // 'file' or 'text'
  const [file, setFile] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
    }
  }

  const handleFileUpload = async (e) => {
    e.preventDefault()

    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')
    setProgress('Uploading file...')

    try {
      const formData = new FormData()
      formData.append('resume', file)

      setProgress('Analyzing resume...')
      const response = await uploadResume(formData)

      setProgress('Complete!')
      navigate(`/resume/${response.data.resumeId}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload resume')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  const handleTextUpload = async (e) => {
    e.preventDefault()

    if (!resumeText.trim()) {
      setError('Please enter resume text')
      return
    }

    setLoading(true)
    setError('')
    setProgress('Analyzing resume...')

    try {
      const response = await uploadResumeText({
        resumeText,
        fileName: 'text-resume.txt',
      })

      setProgress('Complete!')
      navigate(`/resume/${response.data.resumeId}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process resume')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Resume</h1>
        <p className="text-gray-600">
          Upload your resume to get AI-powered job recommendations
        </p>
      </div>

      {/* Toggle Upload Type */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setUploadType('file')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
            uploadType === 'file'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Upload className="inline-block h-5 w-5 mr-2" />
          Upload File
        </button>
        <button
          onClick={() => setUploadType('text')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
            uploadType === 'text'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <FileText className="inline-block h-5 w-5 mr-2" />
          Paste Text
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {progress && (
        <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded mb-6 flex items-center">
          <Loader className="h-5 w-5 mr-2 animate-spin" />
          {progress}
        </div>
      )}

      {/* File Upload Form */}
      {uploadType === 'file' && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleFileUpload}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Resume File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop your resume or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports PDF, Word (.doc, .docx), TXT, LaTeX (.tex)
                </p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.tex"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer"
                />
              </div>
              {file && (
                <div className="mt-4 p-3 bg-gray-50 rounded flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-red-600 text-sm hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Upload and Analyze'}
            </button>
          </form>
        </div>
      )}

      {/* Text Upload Form */}
      {uploadType === 'text' && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleTextUpload}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste Resume Text
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows="15"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste your resume text here..."
              />
              <p className="text-sm text-gray-500 mt-2">
                Copy and paste your entire resume content
              </p>
            </div>

            <button
              type="submit"
              disabled={!resumeText.trim() || loading}
              className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Analyze Resume'}
            </button>
          </form>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• AI analyzes your resume to extract skills and experience</li>
          <li>• GitHub repositories are analyzed if URLs are found</li>
          <li>• Live project websites are checked if links are provided</li>
          <li>• You receive personalized job recommendations with match percentages</li>
          <li>• Chat with AI about your resume and get interview prep questions</li>
        </ul>
      </div>
    </div>
  )
}

export default UploadResume
