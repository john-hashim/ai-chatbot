import type React from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'

export const Billing: React.FC = () => {
  usePageTitle('Billing')

  return (
    <div className="flex h-full">
      <div className="flex-1 h-full flex items-center justify-center">
        <p className="text-text-secondary">Billing - Manage your subscription and payments</p>
      </div>
    </div>
  )
}
