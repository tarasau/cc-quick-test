import { json } from '@solidjs/router'
import { authenticateAdmin, createSession } from '~/lib/auth'
import type { LoginRequest } from '~/types'

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json() as LoginRequest
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Authenticate admin
    const user = await authenticateAdmin(email, password)
    
    if (!user) {
      return json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session
    const sessionToken = await createSession(user)

    // Set session cookie
    const response = json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    })

    // Set HTTP-only cookie for security
    response.headers.set(
      'Set-Cookie',
      `session=${sessionToken}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict`
    )

    return response
  } catch (error) {
    console.error('Login error:', error)
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 