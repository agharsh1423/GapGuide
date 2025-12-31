import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import UploadResume from './pages/UploadResume'
import ResumeDetails from './pages/ResumeDetails'
import SkillsMatch from './pages/SkillsMatch'
import Chat from './pages/Chat'
import SkillGapAnalysis from './pages/SkillGapAnalysis'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (token && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setIsAuthenticated(true)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar isAuthenticated={isAuthenticated} user={user} onLogout={logout} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={login} />
            }
          />
          <Route
            path="/signup"
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <Signup onLogin={login} />
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/upload"
            element={
              isAuthenticated ? <UploadResume /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/resume/:id"
            element={
              isAuthenticated ? <ResumeDetails /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/skills-match"
            element={
              isAuthenticated ? <SkillsMatch /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/chat/:id"
            element={
              isAuthenticated ? <Chat /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/skill-gap"
            element={
              isAuthenticated ? <SkillGapAnalysis /> : <Navigate to="/login" />
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
