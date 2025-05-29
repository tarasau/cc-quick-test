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

export function getCurrentUser(request: Request): AuthUser | null {
  const cookieHeader = request.headers.get('Cookie')
  
  const sessionToken = getSessionFromCookie(cookieHeader)
  
  if (!sessionToken) {
    console.log('No session token found')
    return null
  }
  
  const user = getSession(sessionToken)
  return user
}

export function requireCurrentUser(request: Request): AuthUser {
  const user = getCurrentUser(request)
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
} 