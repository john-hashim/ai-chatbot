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

export interface GoogleSignInRequest {
  credential: string
}
