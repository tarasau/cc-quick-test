import { json } from '@solidjs/router'
import { prismaGetter } from '~/lib/prisma'
import type { TestContent, TestQuestion } from '~/types'

interface SubmitTestRequest {
  userName: string
  answers: Record<number, number | null>
}

export async function POST({ request, params }: { request: Request, params: { token: string } }) {
  try {
    const { token } = params
    const body = await request.json() as SubmitTestRequest

    if (!token) {
      return json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const { userName, answers } = body

    if (!userName?.trim()) {
      return json(
        { error: 'User name is required' },
        { status: 400 }
      )
    }

    if (!answers || typeof answers !== 'object') {
      return json(
        { error: 'Answers must be an object' },
        { status: 400 }
      )
    }

    // Find the test session
    const prisma = await prismaGetter();

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

    // Check if test has already been submitted
    if (session.result) {
      return json(
        { error: 'Test has already been submitted' },
        { status: 409 }
      )
    }

    // Calculate score
    const testContent = session.test.content as TestContent
    const questions = testContent.questions || []
    let score = 0

    // Iterate through questions and check answers
    questions.forEach((question: TestQuestion) => {
      const userAnswer = answers[question.id]
      if (userAnswer !== null && userAnswer !== undefined && userAnswer === question.correctAnswer) {
        score++
      }
    })

    // Save the result
    const result = await prisma.testResult.create({
      data: {
        sessionId: session.id,
        userName: userName.trim(),
        testName: session.test.name,
        testVersion: session.test.version,
        answers: answers,
        score: score,
        totalQuestions: questions.length
      }
    })

    return json({
      success: true,
      result: {
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage: Math.round((result.score / result.totalQuestions) * 100)
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