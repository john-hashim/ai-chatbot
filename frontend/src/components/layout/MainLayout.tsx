import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'

export function MainLayout() {
  const location = useLocation()
  const hideHeader =
    location.pathname === '/chatbot/new' ||
    location.pathname.includes('setup-knowledgebase') ||
    location.pathname.includes('tune-agent')

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {!hideHeader && <Header />}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Outlet />
      </div>
    </div>
  )
}
