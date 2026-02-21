import './App.css'

import '@mantine/core/styles.css'
import '@mantine/dropzone/styles.css'
import '@mantine/notifications/styles.css'
import './styles/mantine-overrides.css'
import 'react-quill-new/dist/quill.snow.css'
import classes from './theme.module.css'
import {
  createTheme,
  MantineProvider,
  Button,
  TextInput,
  ColorInput,
  Tooltip,
  Checkbox,
  Select,
  Tabs,
  NumberInput,
  Textarea,
} from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'

import Login from '@/feature/auth/Login'
import { Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Dropzone } from '@mantine/dropzone'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { useStore } from '@/store'
import { Landing } from '@/feature/Landing/Landing'
import { ChatbotBasicSetup } from './feature/create-chatbot/ChatbotBasicSetup'
import { ChatbotKnowledgeBaseSetup } from './feature/create-chatbot/ChatbotKnowledgeBaseSetup'
import { ChatbotDashboard } from './feature/chatbot/ChatbotDashboard'
import { Playground } from './feature/playground/Playground'
import { Customize } from './feature/customize/Customize'
import { KnowledgeBase } from './feature/knowledgebase/KnowledgeBase'
import { Chats } from './feature/chats/Chats'
import { Analytics } from './feature/analytics/Analytics'
import { Contacts } from './feature/contacts/Contacts'
import { Automations } from './feature/automations/Automations'
import { Deploy } from './feature/deploy/Deploy'
import { Bookings } from './feature/bookings/Bookings'

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
  radius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },

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
    NumberInput: NumberInput.extend({
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
    Tooltip: Tooltip.extend({
      defaultProps: {
        transitionProps: { transition: 'pop', duration: 300 },
      },
    }),
    Checkbox: Checkbox.extend({
      classNames: {
        input: classes.checkboxInput,
      },
    }),
    Select: Select.extend({
      classNames: {
        input: classes.selectInput,
      },
    }),
    Textarea: Textarea.extend({
      classNames: {
        input: classes.input,
      },
    }),
    Tabs: Tabs.extend({
      classNames: {
        tab: classes.tabsTab,
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
        <Notifications position="top-right" autoClose={4000} />
        <GoogleOAuthProvider clientId={googleClientId || ''}>
          <AppRoutes />
        </GoogleOAuthProvider>
      </ModalsProvider>
    </MantineProvider>
  )
}

function AppRoutes() {
  const token = useStore(state => state.token)

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/chatbot/landing" replace /> : <Login />}
      />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/chatbot/landing" element={<Landing />} />
        <Route path="/chatbot/new" element={<ChatbotBasicSetup />} />
        <Route
          path="/chatbot/:chatbotId/setup-knowledgebase"
          element={<ChatbotKnowledgeBaseSetup />}
        />
        <Route path="/chatbot/:chatbotId" element={<ChatbotDashboard />}>
          <Route index element={<Playground />} />
          <Route path="playground" element={<Playground />} />
          <Route path="customize" element={<Customize />} />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="chats" element={<Chats />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="deploy" element={<Deploy />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="deploy" element={<Deploy />} />
        </Route>
      </Route>
      <Route
        path="/"
        element={
          token ? <Navigate to="/chatbot/landing" replace /> : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
