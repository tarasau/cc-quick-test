import { json } from '@solidjs/router'
import { PrismaClient } from '@prisma/client'
import type { TestContent, TestQuestion } from '~/types'

const prisma = new PrismaClient()

interface SubmitTestRequest {
  userName: string
  answers: Record<number, number>
}

export async function POST({ request, params }: { request: Request, params: { token: string } }) {
  try {
    const { token } = params
    const body: SubmitTestRequest = await request.json()

    if (!token) {
      return json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    if (!body.userName?.trim()) {
      return json(
        { error: 'User name is required' },
        { status: 400 }
      )
    }

    if (!body.answers || typeof body.answers !== 'object') {
      return json(
        { error: 'Answers are required' },
        { status: 400 }
      )
    }

    // Find the test session
    const session = await prisma.testSession.findUnique({
      where: { token },
      include: {
        test: true,
        result: true
      }
    })

    if (!session) {
      return json(
        { error: 'Invalid test link' },
        { status: 404 }
      )
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      return json(
        { error: 'Test link has expired' },
        { status: 410 }
      )
    }

    // Check if test result already exists (test already completed)
    if (session.result) {
      return json(
        { error: 'This test has already been completed' },
        { status: 410 }
      )
    }

    // Session should be marked as used when test started, but we can still submit results
    if (!session.used) {
      return json(
        { error: 'Test session was not properly started' },
        { status: 400 }
      )
    }

    // Parse test content
    const testContent = session.test.content as unknown as TestContent
    const questions = testContent.questions

    // Validate that all questions are answered
    const questionIds = questions.map(q => q.id)
    const answeredQuestionIds = Object.keys(body.answers).map(Number)
    const missingAnswers = questionIds.filter(id => !answeredQuestionIds.includes(id))

    if (missingAnswers.length > 0) {
      return json(
        { error: `Missing answers for questions: ${missingAnswers.join(', ')}` },
        { status: 400 }
      )
    }

    // Calculate score
    let correctAnswers = 0
    const totalQuestions = questions.length

    for (const question of questions) {
      const userAnswer = body.answers[question.id]
      if (userAnswer === question.correctAnswer) {
        correctAnswers++
      }
    }

    // Create test result
    const result = await prisma.testResult.create({
      data: {
        sessionId: session.id,
        userName: body.userName.trim(),
        testName: testContent.name,
        testVersion: testContent.version,
        answers: body.answers,
        score: correctAnswers,
        totalQuestions: totalQuestions
      }
    })

    return json({
      success: true,
      result: {
        id: result.id,
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage: Math.round((result.score / result.totalQuestions) * 100),
        completedAt: result.completedAt
      }
    })
  } catch (error) {
    console.error('Error submitting test:', error)
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 