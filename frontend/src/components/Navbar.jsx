import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Home, Upload, LayoutDashboard, Brain, Target } from 'lucide-react'

const Navbar = ({ isAuthenticated, user, onLogout }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">GapGuide</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/upload"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                >
                  <Upload className="h-5 w-5" />
                  <span>Upload Resume</span>
                </Link>
                <Link
                  to="/skills-match"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                >
                  <Brain className="h-5 w-5" />
                  <span>Skills Match</span>
                </Link>
                <Link
                  to="/skill-gap"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                >
                  <Target className="h-5 w-5" />
                  <span>Skill Gap</span>
                </Link>
                <div className="flex items-center space-x-3 pl-3 border-l">
                  <span className="text-gray-700">Hi, {user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
