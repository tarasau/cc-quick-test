import { createSignal, onMount, Show, For } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { AdminLayout } from '~/components/admin'
import type { AuthUser, TestMetadata } from '~/types'

export default function Admin() {
  const [user, setUser] = createSignal<AuthUser | null>(null)
  const [tests, setTests] = createSignal<TestMetadata[]>([])
  const [isLoading, setIsLoading] = createSignal(true)
  const [tooltipVisible, setTooltipVisible] = createSignal<number | null>(null)
  const navigate = useNavigate()

  onMount(async () => {
    try {
      // Check if user is authenticated
      const authResponse = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (authResponse.ok) {
        const userData = await authResponse.json()
        setUser(userData.user)
        
        // Fetch tests
        await loadTests()
      } else {
        navigate('/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      navigate('/login')
    } finally {
      setIsLoading(false)
    }
  })

  const loadTests = async () => {
    try {
      const response = await fetch('/api/tests', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTests(data.tests)
      } else {
        console.error('Failed to load tests')
      }
    } catch (error) {
      console.error('Error loading tests:', error)
    }
  }

  const handleShareTest = async (testId: number) => {
    try {
      const response = await fetch(`/api/tests/${testId}/generate-link`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Copy link to clipboard
        await navigator.clipboard.writeText(data.link)
        
        // Show tooltip for 2 seconds
        setTooltipVisible(testId)
        setTimeout(() => {
          setTooltipVisible(null)
        }, 2000)
      } else {
        const error = await response.json()
        alert(`Failed to generate link: ${error.error}`)
      }
    } catch (error) {
      console.error('Error generating link:', error)
      alert('Failed to generate test link')
    }
  }

  const handleRemoveTest = async (testId: number, testName: string) => {
    if (!confirm(`Are you sure you want to delete the test "${testName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/tests?id=${testId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Reload tests after deletion
        await loadTests()
        alert('Test deleted successfully')
      } else {
        const error = await response.json()
        alert(`Failed to delete test: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting test:', error)
      alert('Failed to delete test')
    }
  }

  return (
    <Show 
      when={!isLoading()} 
      fallback={
        <div class="min-h-screen flex items-center justify-center">
          <div class="text-lg">Loading...</div>
        </div>
      }
    >
      <AdminLayout 
        user={user()} 
        title="Tests Dashboard" 
        subtitle="Manage your knowledge tests"
      >
        {/* Add Test Button */}
        <div class="mb-6 flex justify-end">
          <button
            onClick={() => navigate('/admin/add-test')}
            class="bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors"
          >
            Add New
          </button>
        </div>

        <div class="bg-white shadow rounded-lg overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Name
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Version
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                  Questions
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                  Time Needed
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <Show 
                when={tests().length > 0}
                fallback={
                  <tr>
                    <td colspan="5" class="px-4 py-4 text-center text-gray-500">
                      No tests found. Create your first test to get started.
                    </td>
                  </tr>
                }
              >
                <For each={tests()}>
                  {(test) => (
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">
                          {test.name}
                        </div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                          {test.version}
                        </div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                          {test.questionCount}
                        </div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                          ~{test.estimatedTime} min
                        </div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <div class="relative inline-block">
                          <button
                            onClick={() => handleShareTest(test.id)}
                            disabled={tooltipVisible() === test.id}
                            class="bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm cursor-pointer transition-colors w-20"
                          >
                            Share
                          </button>
                          <Show when={tooltipVisible() === test.id}>
                            <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-10">
                              Test link copied to clipboard
                              <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </Show>
                        </div>
                        <button
                          onClick={() => handleRemoveTest(test.id, test.name)}
                          class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm cursor-pointer transition-colors w-20"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </Show>
            </tbody>
          </table>
        </div>
      </AdminLayout>
    </Show>
  )
} 