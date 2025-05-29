import { json } from '@solidjs/router'
import { PrismaClient } from '@prisma/client'
import { getCurrentUser } from '~/lib/session'
import type { TestContent, CreateTestRequest } from '~/types'

const prisma = new PrismaClient()

export async function GET({ request }: { request: Request }) {
  try {
    // Check authentication
    const user = getCurrentUser(request)
    if (!user) {
      return json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch all tests
    const tests = await prisma.test.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform tests to include calculated fields
    const testsWithMetadata = tests.map(test => {
      const content = test.content as unknown as TestContent
      const questionCount = content.questions?.length || 0
      // Estimate 1 minute per question + 2 minutes for instructions
      const estimatedTime = questionCount + 2

      return {
        id: test.id,
        name: test.name,
        version: test.version,
        questionCount,
        estimatedTime,
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
    const user = getCurrentUser(request)
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
    const user = getCurrentUser(request)
    if (!user) {
      return json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const testId = url.searchParams.get('id')

    if (!testId) {
      return json(
        { error: 'Test ID is required' },
        { status: 400 }
      )
    }

    // Delete the test (this will cascade delete sessions and results)
    await prisma.test.delete({
      where: {
        id: parseInt(testId)
      }
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