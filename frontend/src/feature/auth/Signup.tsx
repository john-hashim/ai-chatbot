import { Button, Checkbox, Divider, PasswordInput, Progress, TextInput } from '@mantine/core'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useUserStore } from '@/store'
import { type CredentialResponse } from '@react-oauth/google'
import { usePageTitle } from '@/hooks/usePageTitle'
import { showNotification } from '@/utils/notifications'
import { AuthShell } from './AuthShell'
import { GoogleButton } from './GoogleButton'

interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
}

const requirements = [
  { label: '8 characters or more', test: (v: string) => v.length >= 8 },
  { label: '1 uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: '1 lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: '1 number', test: (v: string) => /[0-9]/.test(v) },
  { label: '1 special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

// At least 3 passing requirements ("fair") is enough to submit.
const MIN_STRENGTH = 3

const getStrength = (passed: number, hasInput: boolean) => {
  if (!hasInput) return { label: 'Type a password', color: 'gray', value: 0 }
  if (passed >= 5) return { label: 'Strong', color: 'green', value: 100 }
  if (passed >= MIN_STRENGTH) return { label: 'Fair', color: 'yellow', value: 66 }
  return { label: 'Weak', color: 'red', value: 33 }
}

const Signup: React.FC = () => {
  usePageTitle('Sign up')
  const navigate = useNavigate()
  const { googleSignIn, loading } = useUserStore()

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting, isSubmitted, isValid },
  } = useForm<SignupFormData>({
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const [password, setPassword] = useState('')
  const checks = requirements.map(r => r.test(password))
  const passed = checks.filter(Boolean).length
  const strength = getStrength(passed, password.length > 0)
  const isStrongEnough = passed === requirements.length

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
              onChange: e => setPassword(e.currentTarget.value),
              validate: () => isStrongEnough || 'Password does not meet all requirements',
            })}
            className="mt-1"
            placeholder="Create a password"
            error={errors.password?.message}
          />
          <div className="flex items-center gap-3 mt-2">
            <Progress
              className="w-1/2"
              value={strength.value}
              color={strength.color}
              size="xs"
              radius="xl"
              transitionDuration={700}
            />
            <span
              className="w-1/2 text-[11px] font-medium transition-colors duration-700"
              style={{ color: `var(--mantine-color-${strength.color}-6)` }}
            >
              {strength.label}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
          {requirements.map((r, i) => (
            <Checkbox
              key={r.label}
              checked={checks[i]}
              readOnly
              tabIndex={-1}
              size="xs"
              color="green"
              label={r.label}
              styles={{
                root: { pointerEvents: 'none' },
                label: { fontSize: 12, color: checks[i] ? '#16a34a' : '#6b7280' },
              }}
            />
          ))}
        </div>

        <div className="mt-4">
          <p className="text-text-secondary text-sm">Confirm password</p>
          <PasswordInput
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: value => value === getValues('password') || 'Passwords do not match',
            })}
            className="mt-1"
            placeholder="Re-enter your password"
            error={errors.confirmPassword?.message}
          />
        </div>

        <div className="mt-6">
          <Button
            type="submit"
            variant="default"
            fullWidth
            disabled={isSubmitting || (isSubmitted && !isValid)}
          >
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
