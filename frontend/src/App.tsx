import './App.css'

import '@mantine/core/styles.css'
import '@mantine/dropzone/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import './styles/mantine-overrides.css'
import './styles/tune-agent.css'
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
  LoadingOverlay,
} from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Dropzone } from '@mantine/dropzone'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { useUserStore } from '@/store'

const Login = lazy(() => import('@/feature/auth/Login'))
const Landing = lazy(() => import('@/feature/Landing/Landing').then(m => ({ default: m.Landing })))
const ChatbotBasicSetup = lazy(() => import('./feature/create-chatbot/ChatbotBasicSetup').then(m => ({ default: m.ChatbotBasicSetup })))
const ChatbotKnowledgeBaseSetup = lazy(() => import('./feature/create-chatbot/ChatbotKnowledgeBaseSetup').then(m => ({ default: m.ChatbotKnowledgeBaseSetup })))
const TuneAgent = lazy(() => import('./feature/tune-agent/TuneAgent').then(m => ({ default: m.TuneAgent })))
const ChatbotDashboard = lazy(() => import('./feature/chatbot/ChatbotDashboard').then(m => ({ default: m.ChatbotDashboard })))
const Playground = lazy(() => import('./feature/playground/Playground').then(m => ({ default: m.Playground })))
const Customize = lazy(() => import('./feature/customize/Customize').then(m => ({ default: m.Customize })))
const KnowledgeBase = lazy(() => import('./feature/knowledgebase/KnowledgeBase').then(m => ({ default: m.KnowledgeBase })))
const Chats = lazy(() => import('./feature/chats/Chats').then(m => ({ default: m.Chats })))
const Analytics = lazy(() => import('./feature/analytics/Analytics').then(m => ({ default: m.Analytics })))
const Contacts = lazy(() => import('./feature/contacts/Contacts').then(m => ({ default: m.Contacts })))
const Automations = lazy(() => import('./feature/automations/Automations').then(m => ({ default: m.Automations })))
const Deploy = lazy(() => import('./feature/deploy/Deploy').then(m => ({ default: m.Deploy })))
const Bookings = lazy(() => import('./feature/bookings/Bookings').then(m => ({ default: m.Bookings })))
const AccountSettings = lazy(() => import('./feature/account/AccountSettings').then(m => ({ default: m.AccountSettings })))
const Billing = lazy(() => import('./feature/billing/Billing').then(m => ({ default: m.Billing })))

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
  const { token } = useUserStore()

  return (
    <Suspense fallback={<LoadingOverlay visible zIndex={1000} overlayProps={{ blur: 2 }} />}>
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
          <Route path="/landing" element={<Navigate to="/chatbot/landing" replace />} />
          <Route path="/chatbot/landing" element={<Landing />} />
          <Route path="/account" element={<AccountSettings />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/chatbot/new" element={<ChatbotBasicSetup />} />
          <Route
            path="/chatbot/:chatbotId/setup-knowledgebase"
            element={<ChatbotKnowledgeBaseSetup />}
          />
          <Route path="/chatbot/:chatbotId/tune-agent" element={<TuneAgent />} />
          <Route path="/chatbot/:chatbotId" element={<ChatbotDashboard />}>
            <Route index element={<Playground />} />
            <Route path="playground" element={<Playground />} />
            <Route path="customize" element={<Customize />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            <Route path="chats" element={<Chats />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="automations" element={<Automations />} />
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
    </Suspense>
  )
}

export default App
