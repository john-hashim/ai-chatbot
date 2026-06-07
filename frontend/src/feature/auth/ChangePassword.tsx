import { Button, Checkbox, PasswordInput, Progress } from '@mantine/core'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { AuthShell } from './AuthShell'

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

const ChangePassword: React.FC = () => {
  usePageTitle('Change password')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const checks = requirements.map(r => r.test(password))
  const passed = checks.filter(Boolean).length
  const strength = getStrength(passed, password.length > 0)
  const isStrongEnough = passed === requirements.length

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isStrongEnough || submitting || success) return
    // TODO: password reset has no backend yet — wire to authService once available.
    setSubmitting(true)
    console.log('password update submitted', password.length)
    // Simulate the request latency so the button loader is visible.
    await new Promise(resolve => setTimeout(resolve, 800))
    setSubmitting(false)
    setSuccess(true)
  }

  return (
    <AuthShell single>
      <form onSubmit={onSubmit} className="w-full">
        <div
          className={`grid transition-all duration-500 ease-out ${
            success ? 'grid-rows-[1fr] opacity-100 mb-6' : 'grid-rows-[0fr] opacity-0 mb-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[13px] leading-relaxed text-green-700">
              Your password has been updated successfully. You can now log in with your new
              password.
            </div>
          </div>
        </div>

        <p className="text-3xl font-semibold text-center sm:text-left mb-2">Change password</p>
        <p className="text-[13px] font-light text-gray-500 text-center sm:text-left">
          Create a new password to access your account.
        </p>

        <div className="mt-10">
          <p className="text-text-secondary text-sm mb-1">New password</p>
          <PasswordInput
            value={password}
            onChange={e => setPassword(e.currentTarget.value)}
            placeholder="Enter your new password"
            disabled={success}
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

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
          {requirements.map((r, i) => (
            <Checkbox
              key={r.label}
              checked={checks[i]}
              readOnly
              tabIndex={-1}
              size="xs"
              color="green"
              label={r.label}
              styles={{ label: { fontSize: 12, color: checks[i] ? '#16a34a' : '#6b7280' } }}
            />
          ))}
        </div>

        <div className="mt-10">
          {success ? (
            <Button variant="default" fullWidth onClick={() => navigate('/login')}>
              Go to login
            </Button>
          ) : (
            <Button
              type="submit"
              variant="default"
              fullWidth
              loading={submitting}
              disabled={!isStrongEnough}
            >
              Update password
            </Button>
          )}
        </div>

        <p className="text-sm text-center mt-6 text-gray-500">
          Remember your password?{' '}
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

export default ChangePassword
