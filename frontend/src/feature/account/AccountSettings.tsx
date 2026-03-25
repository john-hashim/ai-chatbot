import type React from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'

export const AccountSettings: React.FC = () => {
  usePageTitle('Account Settings')

  return (
    <div className="flex h-full">
      <div className="flex-1 h-full flex items-center justify-center">
        <p className="text-text-secondary">Account Settings - Manage your account preferences</p>
      </div>
    </div>
  )
}
