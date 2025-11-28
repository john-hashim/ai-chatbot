import { Navigate } from 'react-router-dom'
import { useStore } from '@/store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = useStore(state => state.token)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
