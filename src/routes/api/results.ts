import { APIEvent } from '@solidjs/start/server'
import { prismaGetter } from '~/lib/prisma'
import { getCurrentUser } from '~/lib/session'

export async function GET(event: APIEvent) {
  try {
    // Check authentication
    const user = await getCurrentUser(event.request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Fetch all test results with related test information
    const prisma = await prismaGetter();
    const results = await prisma.testResult.findMany({
      include: {
        session: {
          include: {
            test: {
              select: {
                name: true,
                version: true,
                content: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Transform the data for the frontend
    const transformedResults = results.map((result: any) => {
      const testContent = result.session.test.content as any
      const totalQuestions = testContent.questions?.length || 0
      
      // Calculate score by counting correct answers
      let score = 0
      if (result.answers && testContent.questions) {
        const answers = result.answers as Record<string, number | null>
        testContent.questions.forEach((question: any) => {
          const userAnswer = answers[question.id.toString()]
          if (userAnswer !== null && userAnswer === question.correctAnswer) {
            score++
          }
        })
      }

      return {
        id: result.id,
        candidateName: result.userName,
        testName: result.session.test.name,
        testVersion: result.session.test.version,
        score: score,
        totalQuestions: totalQuestions,
        completedAt: result.completedAt.toISOString()
      }
    })

    return new Response(JSON.stringify(transformedResults), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error fetching test results:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 