export interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export interface AuthResponseData {
  user: User
  token: string
  isNewUser: boolean
}

export interface AuthResponse {
  status: 'success' | 'failure'
  message: string
  data: AuthResponseData
}

export interface GoogleAuthResponse {
  success: boolean
  authUrl: string
  message: string
}

export interface GoogleSignInRequest {
  credential: string
}
