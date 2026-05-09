import { Navigate } from 'react-router-dom'
import { useUserStore } from '@/store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { token } = useUserStore()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
