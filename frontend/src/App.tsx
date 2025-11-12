import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryProvider } from './providers/QueryProvider'
import { AuthProvider } from './contexts/AuthContext'
import { VoterAuthProvider } from './contexts/VoterAuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import VoterProtectedRoute from './components/VoterProtectedRoute'

import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Elections from './pages/Elections'
import Candidates from './pages/Candidates'
import Voters from './pages/Voters'
import Hero from './pages/Hero'
import VoterLogin from './pages/VoterLogin'
import VoterRegister from './pages/VoterRegister'
import VoterSearch from './pages/VoterSearch'
import ElectionCandidates from './pages/ElectionCandidates'
import VoterHome from './pages/VoterHome'
import VoterProfile from './pages/VoterProfile'
import VoterElectionCandidates from './pages/VoterElectionCandidates'

function App() {
  return (
    <QueryProvider>
      <Router>
        <AuthProvider>
          <VoterAuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Hero />} />
              <Route path="/voter-search" element={<VoterSearch />} />
              <Route path="/election-candidates" element={<ElectionCandidates />} />
              
              {/* Admin Routes */}
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/elections"
                element={
                  <ProtectedRoute>
                    <Elections />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/elections/:electionId/candidates"
                element={
                  <ProtectedRoute>
                    <Candidates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidates"
                element={
                  <ProtectedRoute>
                    <Candidates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/voters"
                element={
                  <ProtectedRoute>
                    <Voters />
                  </ProtectedRoute>
                }
              />
              
              {/* Voter Routes */}
              <Route path="/voter/login" element={<VoterLogin />} />
              <Route path="/voter/register" element={<VoterRegister />} />
              <Route
                path="/voter/home"
                element={
                  <VoterProtectedRoute>
                    <VoterHome />
                  </VoterProtectedRoute>
                }
              />
              <Route
                path="/voter/election/:electionId/candidates"
                element={
                  <VoterProtectedRoute>
                    <VoterElectionCandidates />
                  </VoterProtectedRoute>
                }
              />
              <Route
                path="/voter/profile"
                element={
                  <VoterProtectedRoute>
                    <VoterProfile />
                  </VoterProtectedRoute>
                }
              />
            </Routes>
          </VoterAuthProvider>
        </AuthProvider>
      </Router>
    </QueryProvider>
  )
}

export default App
