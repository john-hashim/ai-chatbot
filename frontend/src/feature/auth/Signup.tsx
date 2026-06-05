import { Button, Divider, PasswordInput, TextInput } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useUserStore } from '@/store'
import { type CredentialResponse } from '@react-oauth/google'
import { usePageTitle } from '@/hooks/usePageTitle'
import { showNotification } from '@/utils/notifications'
import { AuthShell } from './AuthShell'
import { GoogleButton } from './GoogleButton'

interface SignupFormData {
  name: string
  email: string
  password: string
}

const Signup: React.FC = () => {
  usePageTitle('Sign up')
  const navigate = useNavigate()
  const { googleSignIn, loading } = useUserStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    defaultValues: { name: '', email: '', password: '' },
  })

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      showNotification('error', 'Failed to get Google credentials. Please try again.')
      return
    }
    try {
      await googleSignIn({ credential: credentialResponse.credential })
    } catch (err) {
      console.error('Google sign-up failed:', err)
    }
  }

  const handleGoogleError = () => {
    showNotification('error', 'Google sign-up failed. Please try again.')
  }

  const onSubmit = async (data: SignupFormData) => {
    // TODO: email/password auth has no backend yet — wire to authService once available.
    console.log('email/password signup submitted', data.email)
    showNotification('error', 'Email and password sign-up is coming soon. Please use Google.')
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <p className="text-3xl font-semibold text-center sm:text-left mb-2">Create your account</p>
        <p className="text-[13px] font-light text-gray-500 text-center sm:text-left">
          Sign up to get started with Chatvio
        </p>

        <div className="mt-6">
          <GoogleButton
            label="Sign up with Google"
            loading={loading}
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>

        <Divider label="or" labelPosition="center" my="md" />

        <div>
          <p className="text-text-secondary text-sm">Full name</p>
          <TextInput
            {...register('name', {
              required: 'Please enter your name',
              maxLength: { value: 60, message: 'Name must be less than 60 characters' },
            })}
            className="mt-1"
            type="text"
            placeholder="Jane Doe"
            error={errors.name?.message}
          />
        </div>

        <div className="mt-4">
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

        <div className="mt-4">
          <p className="text-text-secondary text-sm">Password</p>
          <PasswordInput
            {...register('password', {
              required: 'Please enter a password',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
            })}
            className="mt-1"
            placeholder="Create a password"
            error={errors.password?.message}
          />
        </div>

        <div className="mt-6">
          <Button type="submit" variant="default" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </div>

        <p className="text-gray-500 text-[12px] text-center mt-4">
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

        <p className="text-sm text-center mt-3 text-gray-500">
          Already have an account?{' '}
          <button
            type="button"
            className="text-gray-700 font-bold underline border-0 bg-transparent p-0 cursor-pointer"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </p>
      </form>
    </AuthShell>
  )
}

export default Signup
