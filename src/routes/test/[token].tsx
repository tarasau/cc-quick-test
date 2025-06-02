import { createSignal, onMount, onCleanup, Show, For, createEffect } from 'solid-js'
import { useParams, useNavigate } from '@solidjs/router'
import type { TestContent, TestQuestion } from '~/types'
import { TEST_CONFIG } from '~/config/test'

type TestState = 'loading' | 'name-entry' | 'taking-test' | 'completed' | 'error'

export default function TestPage() {
  const params = useParams()
  const navigate = useNavigate()
  
  const [state, setState] = createSignal<TestState>('loading')
  const [error, setError] = createSignal('')
  const [testContent, setTestContent] = createSignal<TestContent | null>(null)
  const [userName, setUserName] = createSignal('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = createSignal(0)
  const [answers, setAnswers] = createSignal<Record<number, number>>({})
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [isStartingTest, setIsStartingTest] = createSignal(false)
  const [timeLeft, setTimeLeft] = createSignal<number>(TEST_CONFIG.QUESTION_TIME_LIMIT)
  const [timerInterval, setTimerInterval] = createSignal<NodeJS.Timeout | null>(null)
  const [timerStarted, setTimerStarted] = createSignal(false)

  onMount(async () => {
    await validateTokenAndLoadTest()
  })

  onCleanup(() => {
    const interval = timerInterval()
    if (interval) {
      clearInterval(interval)
    }
  })

  // Only start timer when test begins, and handle question changes manually
  createEffect(() => {
    if (state() === 'taking-test' && !timerStarted()) {
      startQuestionTimer()
      setTimerStarted(true)
    } else if (state() !== 'taking-test') {
      stopQuestionTimer()
      setTimerStarted(false)
    }
  })

  const startQuestionTimer = () => {
    
    // Always stop any existing timer first
    const existingInterval = timerInterval()
    if (existingInterval) {
      clearInterval(existingInterval)
      setTimerInterval(null)
    }

    // Set initial time
    setTimeLeft(TEST_CONFIG.QUESTION_TIME_LIMIT)

    // Start new timer
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - move to next question
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setTimerInterval(interval)
  }

  const stopQuestionTimer = () => {
    const interval = timerInterval()
    if (interval) {
      clearInterval(interval)
      setTimerInterval(null)
    }
  }

  const handleTimeUp = () => {
    stopQuestionTimer()
    
    // Move to next question or submit test if it's the last question
    const test = testContent()
    if (!test) return

    if (currentQuestionIndex() < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      // Start fresh timer for next question after a small delay
      setTimeout(() => {
        startQuestionTimer()
      }, 100)
    } else {
      // Last question - submit the test
      handleSubmitTest()
    }
  }

  const validateTokenAndLoadTest = async () => {
    try {
      const response = await fetch(`/api/test-session/${params.token}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTestContent(data.test)
        setState('name-entry')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Invalid or expired test link')
        setState('error')
      }
    } catch (error) {
      console.error('Error validating test session:', error)
      setError('Failed to load test. Please try again.')
      setState('error')
    }
  }

  const handleNameSubmit = async (e: Event) => {
    e.preventDefault()
    if (!userName().trim()) {
      setError('Please enter your full name')
      return
    }

    setIsStartingTest(true)
    setError('')

    try {
      // Mark session as used when user starts the test
      const response = await fetch(`/api/test-session/${params.token}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userName: userName().trim()
        })
      })

      if (response.ok) {
        setState('taking-test')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to start test')
      }
    } catch (error) {
      console.error('Error starting test:', error)
      setError('Failed to start test. Please try again.')
    } finally {
      setIsStartingTest(false)
    }
  }

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))
  }

  const handleNextQuestion = () => {
    const test = testContent()
    if (!test) return

    stopQuestionTimer()

    if (currentQuestionIndex() < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      // Start fresh timer for next question after a small delay
      setTimeout(() => {
        startQuestionTimer()
      }, 100)
    }
  }

  const handleSubmitTest = async () => {
    const test = testContent()
    if (!test) return

    stopQuestionTimer()

    setIsSubmitting(true)
    setError('')

    try {
      // Create answers object with null for unanswered questions
      const completeAnswers: Record<number, number | null> = {}
      test.questions.forEach(question => {
        completeAnswers[question.id] = answers()[question.id] ?? null
      })


      const response = await fetch(`/api/test-session/${params.token}/submit`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userName: userName().trim(),
          answers: completeAnswers
        })
      })

      if (response.ok) {
        setState('completed')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit test')
      }
    } catch (error) {
      console.error('Error submitting test:', error)
      setError('Failed to submit test. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCurrentQuestion = (): TestQuestion | null => {
    const test = testContent()
    if (!test) return null
    return test.questions[currentQuestionIndex()] || null
  }

  const getProgress = (): { current: number; total: number; percentage: number } => {
    const test = testContent()
    if (!test) return { current: 0, total: 0, percentage: 0 }
    
    const current = currentQuestionIndex() + 1
    const total = test.questions.length
    const percentage = Math.round((current / total) * 100)
    
    return { current, total, percentage }
  }

  const isCurrentQuestionAnswered = (): boolean => {
    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion) return false
    return currentQuestion.id in answers()
  }

  const isLastQuestion = (): boolean => {
    const test = testContent()
    if (!test) return false
    return currentQuestionIndex() === test.questions.length - 1
  }

  const getTimerColor = (): string => {
    if (timeLeft() <= 5) return 'text-red-600'
    if (timeLeft() <= 10) return 'text-orange-600'
    return 'text-gray-600'
  }

  const getTimerBgColor = (): string => {
    if (timeLeft() <= 5) return 'bg-red-600'
    if (timeLeft() <= 10) return 'bg-orange-600'
    return 'bg-[var(--color-brand-primary)]'
  }

  return (
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-4xl mx-auto py-8 px-4">
        
        {/* Loading State */}
        <Show when={state() === 'loading'}>
          <div class="text-center py-20">
            <div class="text-xl text-gray-600">Loading test...</div>
          </div>
        </Show>

        {/* Error State */}
        <Show when={state() === 'error'}>
          <div class="text-center py-20">
            <div class="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <div class="text-red-800 text-lg font-medium mb-2">Test Unavailable</div>
              <div class="text-red-600">{error()}</div>
              <div class="mt-4 text-sm text-red-500">
                This link may have expired, been used already, or is invalid.
              </div>
            </div>
          </div>
        </Show>

        {/* Name Entry State */}
        <Show when={state() === 'name-entry'}>
          <div class="max-w-md mx-auto">
            <div class="bg-white shadow rounded-lg p-8">
              <h1 class="text-2xl font-bold text-gray-900 mb-2">
                {testContent()?.name}
              </h1>
              <p class="text-gray-600 mb-6">
                Version {testContent()?.version}
              </p>
              
              <form onSubmit={handleNameSubmit}>
                <div class="mb-6">
                  <label for="userName" class="block text-sm font-medium text-gray-700 mb-2">
                    Please enter your full name to begin the test
                  </label>
                  <input
                    id="userName"
                    type="text"
                    value={userName()}
                    onInput={(e) => setUserName(e.currentTarget.value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)] text-gray-900"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <Show when={error()}>
                  <div class="mb-4 text-red-600 text-sm">{error()}</div>
                </Show>

                <button
                  type="submit"
                  disabled={isStartingTest()}
                  class="w-full bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium cursor-pointer transition-colors"
                >
                  {isStartingTest() ? 'Starting Test...' : 'Start Test'}
                </button>
              </form>
            </div>
          </div>
        </Show>

        {/* Taking Test State */}
        <Show when={state() === 'taking-test'}>
          <div class="bg-white shadow rounded-lg">
            {/* Header */}
            <div class="border-b border-gray-200 px-6 py-4">
              <div class="flex justify-between items-center">
                <div>
                  <h1 class="text-xl font-bold text-gray-900">
                    {testContent()?.name}
                  </h1>
                  <p class="text-sm text-gray-600">
                    Welcome, {userName()}
                  </p>
                </div>
                <div class="text-right">
                  <div class="text-sm text-gray-600 mb-2">
                    Question {getProgress().current} of {getProgress().total}
                  </div>
                  <div class="w-32 bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      class="bg-[var(--color-brand-primary)] h-2 rounded-full transition-all duration-300"
                      style={`width: ${getProgress().percentage}%`}
                    ></div>
                  </div>
                  {/* Timer */}
                  <div class={`text-lg font-bold ${getTimerColor()}`}>
                    {timeLeft()}s
                  </div>
                  <div class="w-32 bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      class={`h-1 rounded-full transition-all duration-1000 ${getTimerBgColor()}`}
                      style={`width: ${(timeLeft() / TEST_CONFIG.QUESTION_TIME_LIMIT) * 100}%`}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Content */}
            <div class="p-6">
              <Show when={getCurrentQuestion()}>
                {(question) => (
                  <div>
                    <h2 class="text-lg font-medium text-gray-900 mb-6 select-none pointer-events-none">
                      {question().question}
                    </h2>

                    <div class="space-y-3">
                      <For each={question().options}>
                        {(option, index) => (
                          <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name={`question-${question().id}`}
                              value={index()}
                              checked={answers()[question().id] === index()}
                              onChange={() => handleAnswerSelect(question().id, index())}
                              class="mr-3 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                            />
                            <span class="text-gray-900 select-none">{option}</span>
                          </label>
                        )}
                      </For>
                    </div>
                  </div>
                )}
              </Show>

              <Show when={error()}>
                <div class="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <div class="text-red-800 text-sm">{error()}</div>
                </div>
              </Show>
            </div>

            {/* Navigation */}
            <div class="border-t border-gray-200 px-6 py-4 flex justify-end">
              <Show when={isCurrentQuestionAnswered()}>
                <Show 
                  when={isLastQuestion()}
                  fallback={
                    <button
                      onClick={handleNextQuestion}
                      class="px-4 py-2 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white rounded-md text-sm font-medium cursor-pointer transition-colors"
                    >
                      Next
                    </button>
                  }
                >
                  <button
                    onClick={handleSubmitTest}
                    disabled={isSubmitting()}
                    class="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md text-sm font-medium cursor-pointer transition-colors"
                  >
                    <span class="text-white">
                      {isSubmitting() ? 'Submitting...' : 'Submit Test'}
                    </span>
                  </button>
                </Show>
              </Show>
            </div>
          </div>
        </Show>

        {/* Completed State */}
        <Show when={state() === 'completed'}>
          <div class="text-center py-20">
            <div class="bg-green-50 border border-green-200 rounded-lg p-8 max-w-md mx-auto">
              <div class="text-green-800 text-2xl font-bold mb-4">
                <span class="text-gray-900">Test Completed!</span>
              </div>
              <div class="text-green-700 mb-4">
                <span class="text-gray-700">Thank you, {userName()}, for completing the test.</span>
              </div>
              <div class="text-green-600 text-sm">
                <span class="text-gray-600">Your results have been recorded successfully.</span>
              </div>
            </div>
          </div>
        </Show>

      </div>
    </div>
  )
} 