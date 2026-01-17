import { useUserStore } from '@/store'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { usePageTitle } from '@/hooks/usePageTitle'

const Login: React.FC = () => {
  usePageTitle('Login')
  const { googleSignIn, loading } = useUserStore()

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      console.log('Failed to get Google credentials')
      return
    }
    try {
      await googleSignIn({
        credential: credentialResponse.credential,
      })
    } catch (err) {
      console.error('Google login failed:', err)
    }
  }

  const handleGoogleError = () => {
    console.log('Google sign-in failed. Please try again.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome</h1>
            <p className="text-sm text-gray-600">Sign in to continue</p>
          </div>

          <div className="flex justify-center">
            {/* Disable button while loading */}
            {loading ? (
              <div className="text-gray-600">Signing in...</div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                width={320}
                shape="rectangular"
                useOneTap
                auto_select={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
