export interface User {
  id: string
  email: string
  name: string | null
  avatar?: string
}

export interface AuthResponseData {
  user: User
  token: string
  isNewUser: boolean
}

export interface GoogleSignInRequest {
  credential: string
}

export interface SignupRequest {
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}
