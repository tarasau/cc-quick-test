import { JSX } from 'solid-js'
import AdminHeader from './AdminHeader'
import AdminFooter from './AdminFooter'
import type { AuthUser } from '~/types'

interface AdminLayoutProps {
  user: AuthUser | null
  children: JSX.Element
  title?: string
  subtitle?: string
}

export default function AdminLayout(props: AdminLayoutProps) {
  return (
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <AdminHeader user={props.user} />
      
      <main class="flex-1">
        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Page Header */}
          {(props.title || props.subtitle) && (
            <div class="px-4 py-6 sm:px-0 border-b border-gray-200 mb-6">
              {props.title && (
                <h1 class="text-2xl font-bold text-gray-900">
                  {props.title}
                </h1>
              )}
              {props.subtitle && (
                <p class="mt-1 text-sm text-gray-600">
                  {props.subtitle}
                </p>
              )}
            </div>
          )}
          
          {/* Page Content */}
          <div class="px-4 sm:px-0">
            {props.children}
          </div>
        </div>
      </main>
      
      <AdminFooter />
    </div>
  )
} 