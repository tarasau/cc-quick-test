import { json } from '@solidjs/router'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET({ params }: { params: { token: string } }) {
  try {
    const { token } = params

    if (!token) {
      return json(
        { error: 'Token is required' },
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

    // Check if session has already been used
    if (session.used || session.result) {
      return json(
        { error: 'This test link has already been used' },
        { status: 410 }
      )
    }

    // Return test content
    return json({
      success: true,
      test: session.test.content,
      sessionId: session.id
    })
  } catch (error) {
    console.error('Error validating test session:', error)
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST({ request, params }: { request: Request, params: { token: string } }) {
  try {
    const { token } = params
    const body = await request.json()

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

    // Check if session has already been used
    if (session.used || session.result) {
      return json(
        { error: 'This test link has already been used' },
        { status: 410 }
      )
    }

    // Mark session as used immediately when user starts the test
    await prisma.testSession.update({
      where: { id: session.id },
      data: { used: true }
    })

    return json({
      success: true,
      message: 'Test started successfully'
    })
  } catch (error) {
    console.error('Error starting test session:', error)
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 