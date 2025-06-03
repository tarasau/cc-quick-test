import { json } from '@solidjs/router'
import { getCurrentUser } from '~/lib/session'

export async function GET({ request }: { request: Request }) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 