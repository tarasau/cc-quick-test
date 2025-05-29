import { json } from '@solidjs/router'
import { PrismaClient } from '@prisma/client'
import { getCurrentUser } from '~/lib/session'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST({ request, params }: { request: Request, params: { id: string } }) {
  try {
    // Check authentication
    const user = getCurrentUser(request)
    if (!user) {
      return json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const testId = parseInt(params.id)
    
    if (isNaN(testId)) {
      return json(
        { error: 'Invalid test ID' },
        { status: 400 }
      )
    }

    // Check if test exists
    const test = await prisma.test.findUnique({
      where: { id: testId }
    })

    if (!test) {
      return json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    // Generate unique token
    const token = crypto.randomUUID()
    
    // Set expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create test session
    const session = await prisma.testSession.create({
      data: {
        token,
        testId,
        expiresAt
      }
    })

    // Generate the test link
    const baseUrl = new URL(request.url).origin
    const testLink = `${baseUrl}/test/${token}`

    return json({
      success: true,
      link: testLink,
      token: session.token,
      expiresAt: session.expiresAt.toISOString()
    })
  } catch (error) {
    console.error('Error generating test link:', error)
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 