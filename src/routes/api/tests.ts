import { json } from '@solidjs/router'
import { prismaGetter } from '~/lib/prisma'
import { getCurrentUser } from '~/lib/session'
import type { TestContent, CreateTestRequest } from '~/types'

export async function GET({ request }: { request: Request }) {
  try {
    // Check authentication
    const user = await getCurrentUser(request)
    if (!user) {
      return json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch all tests with metadata
    const prisma = await prismaGetter();
    const tests = await prisma.test.findMany({
      select: {
        id: true,
        name: true,
        version: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            testSessions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform tests to include question count and estimated time
    const testsWithMetadata = tests.map((test: any) => {
      const content = test.content as any
      const questionCount = content?.questions?.length || 0
      const estimatedTime = Math.max(questionCount * 2, 5) // 2 minutes per question, minimum 5 minutes

      return {
        id: test.id,
        name: test.name,
        version: test.version,
        questionCount,
        estimatedTime,
        sessionsCount: test._count.testSessions,
        createdAt: test.createdAt,
        updatedAt: test.updatedAt
      }
    })

    return json({
      success: true,
      tests: testsWithMetadata
    })
  } catch (error) {
    console.error('Error fetching tests:', error)
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST({ request }: { request: Request }) {
  try {
    // Check authentication
    const user = await getCurrentUser(request)
    if (!user) {
      return json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json() as CreateTestRequest
    const { name, version, content } = body

    // Validate input
    if (!name || !version || !content) {
      return json(
        { error: 'Name, version, and content are required' },
        { status: 400 }
      )
    }

    if (!content.questions || !Array.isArray(content.questions) || content.questions.length === 0) {
      return json(
        { error: 'At least one question is required' },
        { status: 400 }
      )
    }

    // Check if test with same name and version already exists
    const prisma = await prismaGetter();
    const existingTest = await prisma.test.findFirst({
      where: {
        name,
        version
      }
    })

    if (existingTest) {
      return json(
        { error: 'A test with this name and version already exists' },
        { status: 409 }
      )
    }

    // Create the test
    
    const test = await prisma.test.create({
      data: {
        name,
        version,
        content: content as any // Prisma Json type
      }
    })

    return json({
      success: true,
      test: {
        id: test.id,
        name: test.name,
        version: test.version,
        createdAt: test.createdAt
      }
    })
  } catch (error) {
    console.error('Error creating test:', error)
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE({ request }: { request: Request }) {
  try {
    // Check authentication
    const user = await getCurrentUser(request)
    if (!user) {
      return json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get test ID from query parameters
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return json(
        { error: 'Test ID is required' },
        { status: 400 }
      )
    }

    const testId = parseInt(id)
    if (isNaN(testId)) {
      return json(
        { error: 'Invalid test ID' },
        { status: 400 }
      )
    }

    // Check if test exists
    const prisma = await prismaGetter();

    const test = await prisma.test.findUnique({
      where: { id: testId }
    })

    if (!test) {
      return json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    // Delete the test (this will cascade delete sessions and results)
    await prisma.test.delete({
      where: { id: testId }
    })

    return json({
      success: true,
      message: 'Test deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting test:', error)
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 