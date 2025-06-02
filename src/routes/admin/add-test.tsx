import { createSignal, onMount, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { AdminLayout } from '~/components/admin'
import type { AuthUser, TestContent, TestQuestion } from '~/types'

export default function AddTest() {
  const [user, setUser] = createSignal<AuthUser | null>(null)
  const [isLoading, setIsLoading] = createSignal(true)
  const [isSaving, setIsSaving] = createSignal(false)
  const [name, setName] = createSignal('')
  const [version, setVersion] = createSignal('')
  const [questionsJson, setQuestionsJson] = createSignal('')
  const [error, setError] = createSignal('')
  const [jsonError, setJsonError] = createSignal('')
  const navigate = useNavigate()

  onMount(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
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

  const validateQuestionsJson = (jsonString: string): TestQuestion[] | null => {
    try {
      const parsed = JSON.parse(jsonString)
      
      // Check if it's an array
      if (!Array.isArray(parsed)) {
        setJsonError('Questions must be an array')
        return null
      }

      // Validate each question
      for (let i = 0; i < parsed.length; i++) {
        const question = parsed[i]
        
        if (typeof question.id !== 'number') {
          setJsonError(`Question ${i + 1}: 'id' must be a number`)
          return null
        }
        
        if (typeof question.question !== 'string' || !question.question.trim()) {
          setJsonError(`Question ${i + 1}: 'question' must be a non-empty string`)
          return null
        }
        
        if (!Array.isArray(question.options) || question.options.length !== 4) {
          setJsonError(`Question ${i + 1}: 'options' must be an array of exactly 4 strings`)
          return null
        }
        
        for (let j = 0; j < question.options.length; j++) {
          if (typeof question.options[j] !== 'string' || !question.options[j].trim()) {
            setJsonError(`Question ${i + 1}: option ${j + 1} must be a non-empty string`)
            return null
          }
        }
        
        if (typeof question.correctAnswer !== 'number' || 
            question.correctAnswer < 0 || 
            question.correctAnswer >= 4) {
          setJsonError(`Question ${i + 1}: 'correctAnswer' must be a number between 0 and 3`)
          return null
        }
      }

      setJsonError('')
      return parsed as TestQuestion[]
    } catch (e) {
      setJsonError('Invalid JSON format')
      return null
    }
  }

  const handleQuestionsChange = (value: string) => {
    setQuestionsJson(value)
    if (value.trim()) {
      validateQuestionsJson(value)
    } else {
      setJsonError('')
    }
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    // Validate form
    if (!name().trim()) {
      setError('Test name is required')
      setIsSaving(false)
      return
    }

    if (!version().trim()) {
      setError('Version is required')
      setIsSaving(false)
      return
    }

    if (!questionsJson().trim()) {
      setError('Questions are required')
      setIsSaving(false)
      return
    }

    // Validate JSON
    const questions = validateQuestionsJson(questionsJson())
    if (!questions) {
      setError('Please fix the JSON format errors')
      setIsSaving(false)
      return
    }

    if (questions.length === 0) {
      setError('At least one question is required')
      setIsSaving(false)
      return
    }

    try {
      const testContent: TestContent = {
        name: name().trim(),
        version: version().trim(),
        questions
      }

      const response = await fetch('/api/tests', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: testContent.name,
          version: testContent.version,
          content: testContent
        })
      })

      if (response.ok) {
        navigate('/admin')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create test')
      }
    } catch (error) {
      console.error('Error creating test:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const exampleJson = `[
  {
    "id": 1,
    "question": "What is JSX?",
    "options": [
      "JavaScript XML",
      "Java Syntax Extension",
      "JSON XML",
      "JavaScript Extension"
    ],
    "correctAnswer": 0
  },
  {
    "id": 2,
    "question": "Which hook is used for state management in React?",
    "options": [
      "useEffect",
      "useState",
      "useContext",
      "useReducer"
    ],
    "correctAnswer": 1
  }
]`

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
        title="Add New Test" 
        subtitle="Create a new knowledge test"
      >
        <div class="max-w-4xl mx-auto">
          <div class="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} class="p-6 space-y-6">
              
              {/* Error Display */}
              <Show when={error()}>
                <div class="bg-red-50 border border-red-200 rounded-md p-4">
                  <div class="text-red-800 text-sm">{error()}</div>
                </div>
              </Show>

              {/* Name Field */}
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)] text-gray-900"
                  placeholder="e.g., React Fundamentals"
                  required
                />
              </div>

              {/* Version Field */}
              <div>
                <label for="version" class="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <input
                  id="version"
                  type="text"
                  value={version()}
                  onInput={(e) => setVersion(e.currentTarget.value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)] text-gray-900"
                  placeholder="e.g., 1.0"
                  required
                />
              </div>

              {/* Questions Field */}
              <div>
                <label for="questions" class="block text-sm font-medium text-gray-700 mb-2">
                  Questions (JSON Format)
                </label>
                <textarea
                  id="questions"
                  value={questionsJson()}
                  onInput={(e) => handleQuestionsChange(e.currentTarget.value)}
                  rows="15"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)] font-mono text-sm text-gray-900"
                  placeholder={exampleJson}
                  required
                />
                
                {/* JSON Error Display */}
                <Show when={jsonError()}>
                  <div class="mt-2 text-red-600 text-sm">{jsonError()}</div>
                </Show>
                
                {/* Help Text */}
                <div class="mt-2 text-sm text-gray-500">
                  <p class="mb-2">Paste your questions in JSON format. Each question must have:</p>
                  <ul class="list-disc list-inside space-y-1 ml-4">
                    <li><code class="bg-gray-100 px-1 rounded">id</code>: unique number</li>
                    <li><code class="bg-gray-100 px-1 rounded">question</code>: question text</li>
                    <li><code class="bg-gray-100 px-1 rounded">options</code>: array of exactly 4 answer options</li>
                    <li><code class="bg-gray-100 px-1 rounded">correctAnswer</code>: index (0-3) of the correct option</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSaving() || !!jsonError()}
                  class="px-4 py-2 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] disabled:bg-gray-400 text-white rounded-md text-sm font-medium cursor-pointer transition-colors"
                >
                  {isSaving() ? 'Saving...' : 'Save Test'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </AdminLayout>
    </Show>
  )
} 