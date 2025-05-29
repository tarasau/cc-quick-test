// Database model types (imported and re-exported from Prisma)
import type { Admin, Test, TestSession, TestResult } from '@prisma/client'
export type { Admin, Test, TestSession, TestResult }

// Test content structure types
export interface TestQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
}

export interface TestContent {
  name: string
  version: string
  questions: TestQuestion[]
}

// Test metadata for dashboard table
export interface TestMetadata {
  id: number
  name: string
  version: string
  questionCount: number
  estimatedTime: number
  createdAt: Date
  updatedAt: Date
}

// API request/response types
export interface CreateTestRequest {
  name: string
  version: string
  content: TestContent
}

export interface GenerateLinkRequest {
  testId: number
}

export interface GenerateLinkResponse {
  link: string
  token: string
  expiresAt: string
}

export interface StartTestRequest {
  userName: string
}

export interface SubmitAnswerRequest {
  questionId: number
  selectedAnswer: number
}

export interface CompleteTestRequest {
  answers: UserAnswer[]
}

export interface UserAnswer {
  questionId: number
  selectedAnswer: number
}

export interface TestResultResponse {
  score: number
  totalQuestions: number
  completedAt: string
}

// Component props types
export interface TestListProps {
  tests: Test[]
  onGenerateLink: (testId: number) => void
  onDownloadTest: (test: Test) => void
}

export interface TestFormProps {
  test: TestContent
  onSubmitAnswer: (answer: UserAnswer) => void
  onCompleteTest: () => void
  currentQuestionIndex: number
}

export interface QuestionProps {
  question: TestQuestion
  onSelectAnswer: (answer: number) => void
  selectedAnswer?: number
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface AuthUser {
  id: number
  email: string
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
} 