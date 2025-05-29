import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { AuthUser } from '~/types'

// Session management
const sessions = new Map<string, { userId: number; email: string; expiresAt: Date }>()

export function generateSessionToken(): string {
  return crypto.randomUUID()
}

export function createSession(user: AuthUser): string {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  
  sessions.set(token, {
    userId: user.id,
    email: user.email,
    expiresAt
  })
  
  return token
}

export function getSession(token: string): AuthUser | null {
  
  const session = sessions.get(token)
  
  if (!session) {
    console.log('No session found for token')
    return null
  }
  
  if (session.expiresAt < new Date()) {
    console.log('Session expired, removing')
    sessions.delete(token)
    return null
  }
  
  return {
    id: session.userId,
    email: session.email
  }
}

export function deleteSession(token: string): void {
  sessions.delete(token)
}

// Clean up expired sessions periodically
setInterval(() => {
  const now = new Date()
  let cleaned = 0
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token)
      cleaned++
    }
  }
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired sessions`)
  }
}, 60 * 60 * 1000) // Clean up every hour

// Authentication functions
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function authenticateAdmin(email: string, password: string): Promise<AuthUser | null> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email }
    })
    
    if (!admin) {
      return null
    }
    
    const isValidPassword = await verifyPassword(password, admin.password)
    
    if (!isValidPassword) {
      return null
    }
    
    return {
      id: admin.id,
      email: admin.email
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

// Middleware helper for protected routes
export function requireAuth(sessionToken?: string): AuthUser {
  if (!sessionToken) {
    throw new Error('No session token provided')
  }
  
  const user = getSession(sessionToken)
  
  if (!user) {
    throw new Error('Invalid or expired session')
  }
  
  return user
} 