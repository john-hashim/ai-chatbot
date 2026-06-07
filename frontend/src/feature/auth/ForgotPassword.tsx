import { Button, TextInput } from '@mantine/core'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { usePageTitle } from '@/hooks/usePageTitle'
import { authService } from '@/api/services/auth'
import { showNotification } from '@/utils/notifications'
import { AuthShell } from './AuthShell'

interface ForgotPasswordFormData {
  email: string
}

const ForgotPassword: React.FC = () => {
  usePageTitle('Reset password')
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ForgotPasswordFormData>({
    mode: 'onTouched',
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      // The server always replies with a generic success (no account enumeration),
      // so a resolved request just means "email accepted".
      await authService.forgotPassword({ email: data.email })
      setSubmitted(true)
    } catch (err) {
      // The interceptor toasts 5xx / network; surface a contextual message only
      // for 4xx (which it rejects silently).
      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      if (status && status >= 500) return
      const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined
      showNotification('error', message || 'Could not send the reset email. Please try again.')
    }
  }

  return (
    <AuthShell single>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <p className="text-3xl font-semibold text-center sm:text-left mb-2">Reset Password</p>
        <p className="text-[13px] font-light text-gray-500 text-center sm:text-left">
          Enter your email to receive instructions to reset your password.
        </p>

        <div className="mt-10">
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

        <div
          className={`grid transition-all duration-500 ease-out ${
            submitted ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="rounded-lg border border-border-week bg-gray-50 px-4 py-3 text-[13px] leading-relaxed text-gray-600">
              If an account with that email exists, a password reset link will be sent to your
              email. Please note that the link expires in 15 minutes. If you don't see it, check
              your spam folder.
            </div>
          </div>
        </div>

        <div className="mt-10">
          <Button
            type="submit"
            variant="default"
            fullWidth
            disabled={isSubmitting || !isValid || submitted}
          >
            {submitted ? 'Email sent' : isSubmitting ? 'Sending...' : 'Reset password'}
          </Button>
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

export default ForgotPassword
