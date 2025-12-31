import { useState } from 'react'
import { getJobsBySkills } from '../services/api'
import { Search, Briefcase, Plus, X } from 'lucide-react'

const COMMON_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'Java', 'TypeScript',
  'HTML', 'CSS', 'SQL', 'MongoDB', 'AWS', 'Docker',
  'Git', 'REST API', 'GraphQL', 'Express', 'Django', 'Flask',
  'Vue.js', 'Angular', 'Machine Learning', 'Data Analysis',
  'Kubernetes', 'CI/CD', 'Agile', 'TDD'
]

const SkillsMatch = () => {
  const [selectedSkills, setSelectedSkills] = useState([])
  const [customSkill, setCustomSkill] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addSkill = (skill) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const removeSkill = (skill) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill))
  }

  const addCustomSkill = () => {
    const trimmed = customSkill.trim()
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed])
      setCustomSkill('')
    }
  }

  const handleSearch = async () => {
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await getJobsBySkills(selectedSkills)
      setRecommendations(response.data.recommendations)
    } catch (err) {
      setError('Failed to get job recommendations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Find Jobs by Skills
        </h1>
        <p className="text-gray-600">
          Select your skills to get personalized job recommendations
        </p>
      </div>

      {/* Skills Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Select Your Skills</h2>

        {/* Selected Skills */}
        {selectedSkills.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Selected ({selectedSkills.length}):</p>
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium flex items-center space-x-1"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSkill(skill)}
                    className="hover:bg-blue-700 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Common Skills */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Common Skills:</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_SKILLS.filter(s => !selectedSkills.includes(s)).map((skill, idx) => (
              <button
                key={idx}
                onClick={() => addSkill(skill)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Skill Input */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Add Custom Skill:</p>
          <div className="flex space-x-2">
            <input
              type="text"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
              placeholder="Enter a skill and press Add"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addCustomSkill}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={selectedSkills.length === 0 || loading}
          className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Search className="h-5 w-5" />
          <span>{loading ? 'Searching...' : 'Find Matching Jobs'}</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Job Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Briefcase className="h-6 w-6 mr-2 text-blue-600" />
            Job Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((job, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {job.jobTitle}
                  </h3>
                  <div className="text-right ml-3">
                    <div className="text-3xl font-bold text-blue-600">
                      {job.matchPercentage}%
                    </div>
                    <div className="text-xs text-gray-500">Match</div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{job.reasoning}</p>

                {/* Matched Skills */}
                {job.matchedSkills && job.matchedSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Your Skills:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {job.matchedSkills.map((skill, i) => (
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

                {/* Missing Skills */}
                {job.missingSkills && job.missingSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Skills to Learn:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {job.missingSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded"
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
    </div>
  )
}

export default SkillsMatch
