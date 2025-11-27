import './App.css'
import 'react-tooltip/dist/react-tooltip.css'
import './styles/tooltip.css'

import '@mantine/core/styles.css'
import '@mantine/dropzone/styles.css'
import '@mantine/notifications/styles.css'
import './styles/mantine-overrides.css'
import classes from './theme.module.css'
import { createTheme, MantineProvider, Button, TextInput, ColorInput } from '@mantine/core'
import { Notifications } from '@mantine/notifications'

import Login from '@/feature/auth/Login'
import { Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Dropzone } from '@mantine/dropzone'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { useUserStore } from '@/store/userStore'
import { Tooltip } from 'react-tooltip'
import { Landing } from '@/feature/Landing/Landing'
import { ChatbotBasicSetup } from './feature/create-chatbot/ChatbotBasicSetup'
import { ModalsProvider } from '@mantine/modals'

const theme = createTheme({
  colors: {
    brand: [
      '#ffd1cd', // 1
      '#ffb3ad', // 2
      '#ff968e', // 3
      '#ff786e', // 4
      '#fe5e51', // 5 - your color
      '#ffe8e6', // 0 - lightest
      '#fe5e51', // 6 - slightly darker (primary shade)
      '#cc3d32', // 7
      '#b32e24', // 8
      '#991f16', // 9 - darkest
    ],
  },
  primaryColor: 'brand',
  fontFamily: 'Inter, sans-serif',
  defaultRadius: 'md',

  components: {
    Button: Button.extend({
      classNames: {
        root: classes.buttonRoot,
        label: classes.buttonLabel,
        section: classes.buttonSection,
      },
    }),
    TextInput: TextInput.extend({
      classNames: {
        input: classes.input,
      },
    }),
    ColorInput: ColorInput.extend({
      classNames: {
        wrapper: classes.colorInputWrapper,
        input: classes.colorInput,
      },
    }),
    Dropzone: Dropzone.extend({
      classNames: {
        root: classes.dropzoneRoot,
      },
    }),
  },
})

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!googleClientId) {
    console.error('Google Client ID is not set in environment variables')
  }
  return (
    <MantineProvider theme={theme}>
      <ModalsProvider>
        <Notifications position="top-right" autoClose={5000} />
        <GoogleOAuthProvider clientId={googleClientId || ''}>
          <AppRoutes />
          <Tooltip id="global-tooltip" place="bottom" offset={10} delayShow={200} />
        </GoogleOAuthProvider>
      </ModalsProvider>
    </MantineProvider>
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
