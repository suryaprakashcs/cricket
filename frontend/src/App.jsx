import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Squad from './pages/Squad'
import Matches from './pages/Matches'
import MatchForm from './pages/MatchForm'
import MatchDetail from './pages/MatchDetail'
import Notifications from './pages/Notifications'
import Stats from './pages/Stats'
import PlayerDetail from './pages/PlayerDetail'
import Profile from './pages/Profile'
import Manage from './pages/Manage'

function Footer() {
  return (
    <footer className="mt-12 border-t border-white/10 py-6 text-center text-xs text-royal-100/50">
      👑 ROYAL KINGS • React + Redux Toolkit + Tailwind •
      Backend: <code className="text-crown-400">/api/auth</code> + <code className="text-crown-400">/api/players</code> + <code className="text-crown-400">/api/matches</code> + <code className="text-crown-400">/api/notifications</code>
    </footer>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/squad" element={<ProtectedRoute><Squad /></ProtectedRoute>} />
          <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/matches/new" element={<ProtectedRoute roles={['admin', 'captain']}><MatchForm /></ProtectedRoute>} />
          <Route path="/matches/:id" element={<ProtectedRoute><MatchDetail /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
          <Route path="/players/:id" element={<ProtectedRoute><PlayerDetail /></ProtectedRoute>} />
          <Route path="/me" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/manage" element={<ProtectedRoute roles={['admin']}><Manage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
