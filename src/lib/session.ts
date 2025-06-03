import { getSession } from './auth'
import type { AuthUser } from '~/types'

export function getSessionFromCookie(cookieHeader: string | null): string | null {
  
  if (!cookieHeader) return null
  
  const sessionCookie = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('session='))
    ?.split('=')[1]
    
  return sessionCookie || null
}

export async function getCurrentUser(request: Request): Promise<AuthUser | null> {
  const cookieHeader = request.headers.get('Cookie')
  
  const sessionToken = getSessionFromCookie(cookieHeader)
  
  if (!sessionToken) {
    console.log('No session token found')
    return null
  }
  
  const user = await getSession(sessionToken)
  return user
}

export async function requireCurrentUser(request: Request): Promise<AuthUser> {
  const user = await getCurrentUser(request)
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
} 