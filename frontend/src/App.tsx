import './App.css'
import 'react-tooltip/dist/react-tooltip.css'
import './styles/tooltip.css'
import Login from '@/feature/auth/Login'
import { Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { useUserStore } from '@/store/userStore'
import { Tooltip } from 'react-tooltip'
import { Landing } from '@/feature/Landing/Landing'
import { ChatbotBasicSetup } from './feature/create-chatbot/ChatbotBasicSetup'

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!googleClientId) {
    console.error('Google Client ID is not set in environment variables')
  }
  return (
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      <AppRoutes />
      <Tooltip id="global-tooltip" place="bottom" offset={10} delayShow={200} />
    </GoogleOAuthProvider>
  )
}

function AppRoutes() {
  const token = useUserStore(state => state.token)

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/Landing" replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/landing" element={<Landing />} />
        <Route path="/new" element={<ChatbotBasicSetup />} />
      </Route>
      <Route
        path="/"
        element={token ? <Navigate to="/landing" replace /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
