import { createSignal, Show, onMount, onCleanup } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import type { AuthUser } from '~/types'
import whiteLogo from '~/assets/whiteLogo.svg'

interface AdminHeaderProps {
  user: AuthUser | null
}

export default function AdminHeader(props: AdminHeaderProps) {
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = createSignal(false)
  let dropdownRef: HTMLDivElement | undefined

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      setIsDropdownOpen(false)
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  return (
    <header class="bg-[var(--color-brand-dark)] shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center space-x-8">
            <div class="flex items-center cursor-pointer" onClick={() => navigate('/admin')}>
              <img src={whiteLogo} alt="Software Engineering Laboratory" class="h-7" />
            </div>
            <nav class="flex items-center space-x-6">
              <a
                href="/admin"
                class="text-white hover:text-gray-200 font-medium text-sm transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/admin')
                }}
              >
                Dashboard
              </a>
              <a
                href="/admin/results"
                class="text-white hover:text-gray-200 font-medium text-sm transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/admin/results')
                }}
              >
                Results
              </a>
            </nav>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen())}
                class="flex items-center space-x-3 text-white hover:text-gray-200 transition-colors"
              >
                <span class="text-sm font-medium">
                  {props.user?.email}
                </span>
                <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm font-medium">
                    {props.user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <svg 
                  class={`w-4 h-4 transition-transform ${isDropdownOpen() ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <Show when={isDropdownOpen()}>
                <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={handleLogout}
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 