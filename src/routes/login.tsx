import { createSignal, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import type { LoginRequest } from '~/types'
import logoSvg from '~/assets/largeLogo.svg'

export default function Login() {
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [isLoading, setIsLoading] = createSignal(false)
  const [error, setError] = createSignal('')
  
  const navigate = useNavigate()

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const loginData: LoginRequest = {
        email: email(),
        password: password()
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(loginData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        navigate('/admin')
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full">
        <div class="bg-white rounded-lg shadow-lg py-10 px-10">
          {/* Logo */}
          <div class="flex justify-center mb-8">
            <img src={logoSvg} alt="Software Engineering Laboratory" class="h-8" />
          </div>
          
          {/* Header */}
          <div class="text-center mb-8">
            <h4 class="text-2xl font-extrabold text-gray-800">
              Login
            </h4>
            <p class="mt-2 text-sm text-gray-600">
              Knowledge Test Administration
            </p>
          </div>
          
          {/* Form */}
          <form class="space-y-6" onSubmit={handleSubmit}>
            <div class="space-y-4">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-600 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email"
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                />
              </div>
              <div>
                <label for="password" class="block text-sm font-medium text-gray-600 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                />
              </div>
            </div>

            <Show when={error()}>
              <div class="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md">
                {error()}
              </div>
            </Show>

            <div>
              <button
                type="submit"
                disabled={isLoading()}
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-brand-primary)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
              >
                {isLoading() ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
            
            {/* Demo credentials */}
            <div class="bg-gray-50 border border-gray-200 rounded-md p-4">
              <p class="text-center text-sm text-gray-600 font-medium mb-2">Demo credentials:</p>
              <div class="text-center text-sm text-gray-600 space-y-1">
                <p><span class="font-medium">Email:</span> admin@test.com</p>
                <p><span class="font-medium">Password:</span> admin123</p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 