import { LoadingOverlay } from '@mantine/core'
import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUserStore } from '@/store'
import { showNotification } from '@/utils/notifications'

/**
 * Lands here from the verification link in the signup email. Verifies the token
 * (creating a session), then drops the user straight onto the landing page with
 * a success toast. No UI of its own — just a brief loader while it works.
 */
const VerifyEmail: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { verifyEmail } = useUserStore()

  // React 18 StrictMode mounts effects twice in dev; guard so we verify once.
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const token = searchParams.get('token')
    if (!token) {
      showNotification('error', 'This verification link is invalid or has expired.')
      navigate('/signup', { replace: true })
      return
    }

    verifyEmail(token)
      .then(() => {
        showNotification('success', 'Signup completed successfully. Welcome to Chatvio!')
        navigate('/chatbot/landing', { replace: true })
      })
      .catch(() => {
        showNotification('error', 'This verification link is invalid or has expired.')
        navigate('/signup', { replace: true })
      })
  }, [searchParams, verifyEmail, navigate])

  return <LoadingOverlay visible zIndex={1000} overlayProps={{ blur: 2 }} />
}

export default VerifyEmail
