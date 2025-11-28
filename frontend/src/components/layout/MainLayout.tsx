import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'

export function MainLayout() {
  const location = useLocation()
  const hideHeader = location.pathname === '/chatbot/new'

  return (
    <div>
      {!hideHeader && <Header />}
      <Outlet />
    </div>
  )
}
