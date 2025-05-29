import { json } from '@solidjs/router'
import { deleteSession } from '~/lib/auth'

export async function POST({ request }: { request: Request }) {
  try {
    // Get session token from cookie
    const cookieHeader = request.headers.get('Cookie')
    const sessionToken = cookieHeader
      ?.split(';')
      .find(c => c.trim().startsWith('session='))
      ?.split('=')[1]

    if (sessionToken) {
      deleteSession(sessionToken)
    }

    // Clear session cookie
    const response = json({ success: true })
    response.headers.set(
      'Set-Cookie',
      'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
    )

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 