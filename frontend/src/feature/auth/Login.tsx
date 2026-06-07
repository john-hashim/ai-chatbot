import { Button, Divider, PasswordInput, TextInput } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { useUserStore } from '@/store'
import { type CredentialResponse } from '@react-oauth/google'
import { usePageTitle } from '@/hooks/usePageTitle'
import { showNotification } from '@/utils/notifications'
import { AuthShell } from './AuthShell'
import { GoogleButton } from './GoogleButton'

interface LoginFormData {
  email: string
  password: string
}

const Login: React.FC = () => {
  usePageTitle('Login')
  const navigate = useNavigate()
  const { googleSignIn, login, loading } = useUserStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
  })

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      showNotification('error', 'Failed to get Google credentials. Please try again.')
      return
    }
    try {
      await googleSignIn({ credential: credentialResponse.credential })
    } catch (err) {
      console.error('Google login failed:', err)
    }
  }

  const handleGoogleError = () => {
    showNotification('error', 'Google sign-in failed. Please try again.')
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      // On success the token guard in App.tsx redirects to the landing page.
      await login({ email: data.email, password: data.password })
    } catch (err) {
      // The interceptor already toasts for 5xx / network errors; only surface a
      // contextual message for 4xx (which it rejects silently).
      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      if (status && status >= 500) return
      const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined
      showNotification('error', message || 'Could not log you in. Please try again.')
    }
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <p className="text-3xl font-semibold text-center sm:text-left mb-2">Welcome back</p>
        <p className="text-[13px] font-light text-gray-500 text-center sm:text-left">
          Log in to access your Chatvio account
        </p>

        <div className="mt-10">
          <GoogleButton
            label="Continue with Google"
            loading={loading}
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>

        <Divider label="or" labelPosition="center" my="xl" />

        <div>
          <p className="text-text-secondary text-sm">Email</p>
          <TextInput
            {...register('email', {
              required: 'Please enter your email',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email',
              },
            })}
            className="mt-1"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
          />
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center">
            <p className="text-text-secondary text-sm">Password</p>
            <button
              type="button"
              className="text-[11px]! text-text-weak hover:text-icon-hover border-0 bg-transparent p-0 cursor-pointer"
              onClick={() => navigate('/forgot-password')}
            >
              Forgot password?
            </button>
          </div>
          <PasswordInput
            {...register('password', {
              required: 'Please enter your password',
            })}
            className="mt-1"
            placeholder="Enter your password"
            error={errors.password?.message}
          />
        </div>

        <div className="mt-10">
          <Button type="submit" variant="default" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>

        <p className="text-gray-500 text-[12px] text-center mt-6">
          By continuing, you agree to our{' '}
          <button
            type="button"
            className="text-gray-600 underline border-0 bg-transparent p-0 cursor-pointer"
            onClick={() => navigate('/terms')}
          >
            Terms of Service
          </button>{' '}
          and{' '}
          <button
            type="button"
            className="text-gray-600 underline border-0 bg-transparent p-0 cursor-pointer"
            onClick={() => navigate('/privacy')}
          >
            Privacy Policy
          </button>
          .
        </p>

        <p className="text-sm text-center mt-4 text-gray-500">
          Don't have an account?{' '}
          <button
            type="button"
            className="text-gray-700 font-bold underline border-0 bg-transparent p-0 cursor-pointer"
            onClick={() => navigate('/signup')}
          >
            Sign up
          </button>
        </p>
      </form>
    </AuthShell>
  )
}

export default Login
