import { createSignal, onMount, Show, For } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import AdminLayout from '~/components/admin/AdminLayout'
import { formatDate } from '~/utils'
import type { AuthUser } from '~/types'

interface TestResult {
  id: string
  candidateName: string
  testName: string
  testVersion: string
  score: number
  totalQuestions: number
  completedAt: string
}

export default function AdminResults() {
  const navigate = useNavigate()
  const [user, setUser] = createSignal<AuthUser | null>(null)
  const [results, setResults] = createSignal<TestResult[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal('')

  onMount(async () => {
    await checkAuth()
    await loadResults()
  })

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        navigate('/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      navigate('/login')
    }
  }

  const loadResults = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/results', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data)
      } else {
        setError('Failed to load test results')
      }
    } catch (error) {
      console.error('Error loading results:', error)
      setError('Failed to load test results')
    } finally {
      setLoading(false)
    }
  }

  const getScorePercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100)
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = getScorePercentage(score, total)
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <AdminLayout user={user()}>
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Test Results</h1>
            <p class="text-gray-600">View all candidate test results</p>
          </div>
        </div>

        <Show when={error()}>
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="text-red-800">{error()}</div>
          </div>
        </Show>

        <div class="bg-white shadow rounded-lg overflow-hidden">
          <Show 
            when={!loading()}
            fallback={
              <div class="p-8 text-center">
                <div class="text-gray-500">Loading results...</div>
              </div>
            }
          >
            <Show 
              when={results().length > 0}
              fallback={
                <div class="p-8 text-center">
                  <div class="text-gray-500">No test results found</div>
                </div>
              }
            >
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Name
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Name
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Version
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Questions
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed At
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <For each={results()}>
                    {(result) => (
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.candidateName}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.testName}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.testVersion}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          <span class={`font-medium ${getScoreColor(result.score, result.totalQuestions)}`}>
                            {result.score}/{result.totalQuestions} ({getScorePercentage(result.score, result.totalQuestions)}%)
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.totalQuestions}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(result.completedAt)}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Show>
          </Show>
        </div>
      </div>
    </AdminLayout>
  )
} 