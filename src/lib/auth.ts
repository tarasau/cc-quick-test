import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto'
import { prismaGetter } from './prisma'
import type { AuthUser } from '~/types'

// Constants for password hashing
const SALT_LENGTH = 32
const HASH_LENGTH = 64
const ITERATIONS = 100000
const DIGEST = 'sha512'

export function generateSessionToken(): string {
  return crypto.randomUUID()
}

export async function createSession(user: AuthUser): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  
  try {
    const prisma = await prismaGetter();
    
    // Clean up expired sessions for this user first
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lt: new Date()
        }
      }
    })
    
    // Create new session in database
    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    })
    
    return token
  } catch (error) {
    console.error('Error creating session:', error)
    throw new Error('Failed to create session')
  }
}

export async function getSession(token: string): Promise<AuthUser | null> {
  try {
    const prisma = await prismaGetter();
    
    // Find session and include user data
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        admin: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })
    
    if (!session) {
      console.log('No session found for token')
      return null
    }
    
    // Check if session has expired
    if (session.expiresAt < new Date()) {
      console.log('Session expired, removing')
      // Delete expired session
      await prisma.session.delete({
        where: { token }
      })
      return null
    }
    
    return {
      id: session.admin.id,
      email: session.admin.email
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export async function deleteSession(token: string): Promise<void> {
  try {
    const prisma = await prismaGetter();
    await prisma.session.delete({
      where: { token }
    })
  } catch (error) {
    console.error('Error deleting session:', error)
    // Don't throw error for session deletion failures
  }
}

// Clean up expired sessions (can be called periodically)
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const prisma = await prismaGetter();
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
    if (result.count > 0) {
      console.log(`Cleaned up ${result.count} expired sessions`)
    }
  } catch (error) {
    console.error('Error cleaning up sessions:', error)
  }
}

// Detect hash type based on format
function isBcryptHash(hash: string): boolean {
  // bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$
  return /^\$2[abxy]\$/.test(hash)
}

function isPBKDF2Hash(hash: string): boolean {
  try {
    // Our PBKDF2 hashes are base64 encoded and should decode to SALT_LENGTH + HASH_LENGTH bytes
    const decoded = Buffer.from(hash, 'base64')
    return decoded.length === SALT_LENGTH + HASH_LENGTH
  } catch {
    return false
  }
}

// Password hashing functions using Node.js crypto
export function hashPassword(password: string): string {
  try {
    // Generate a random salt
    const salt = randomBytes(SALT_LENGTH)
    
    // Hash the password with PBKDF2
    const hash = pbkdf2Sync(password, salt, ITERATIONS, HASH_LENGTH, DIGEST)
    
    // Combine salt and hash, then encode as base64
    const combined = Buffer.concat([salt, hash])
    return combined.toString('base64')
  } catch (error) {
    console.error('Error hashing password:', error)
    throw new Error('Failed to hash password')
  }
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    if (isBcryptHash(hashedPassword)) {
      return false
    }
    
    // Check if it's our PBKDF2 hash
    if (isPBKDF2Hash(hashedPassword)) {
      // Decode the stored hash
      const combined = Buffer.from(hashedPassword, 'base64')
      
      // Validate the combined buffer length
      if (combined.length !== SALT_LENGTH + HASH_LENGTH) {
        console.error('Invalid hash length:', combined.length, 'expected:', SALT_LENGTH + HASH_LENGTH)
        return false
      }
      
      // Extract salt and hash
      const salt = combined.subarray(0, SALT_LENGTH)
      const storedHash = combined.subarray(SALT_LENGTH)
      
      // Hash the provided password with the same salt
      const hash = pbkdf2Sync(password, salt, ITERATIONS, HASH_LENGTH, DIGEST)
      
      // Validate hash lengths before comparison
      if (hash.length !== storedHash.length) {
        console.error('Hash length mismatch:', hash.length, 'vs', storedHash.length)
        return false
      }
      
      // Use timing-safe comparison to prevent timing attacks
      return timingSafeEqual(hash, storedHash)
    }
    
    // Unknown hash format
    console.error('Unknown hash format for hash starting with:', hashedPassword.substring(0, 20))
    return false
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}

// Async wrapper functions for compatibility with existing code
export async function hashPasswordAsync(password: string): Promise<string> {
  return hashPassword(password)
}

export async function verifyPasswordAsync(password: string, hashedPassword: string): Promise<boolean> {
  return verifyPassword(password, hashedPassword)
}

export async function authenticateAdmin(email: string, password: string): Promise<AuthUser | null> {
  try {
    const prisma = await prismaGetter();
    const admin = await prisma.admin.findUnique({
      where: { email }
    })
    
    if (!admin) {
      return null
    }
    
    const isValidPassword = verifyPassword(password, admin.password)
    
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
export async function requireAuth(sessionToken?: string): Promise<AuthUser> {
  if (!sessionToken) {
    throw new Error('No session token provided')
  }
  
  const user = await getSession(sessionToken)
  
  if (!user) {
    throw new Error('Invalid or expired session')
  }
  
  return user
}

// Utility function to generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

// Utility function to create SHA-256 hash
export function createSHA256Hash(data: string): string {
  return createHash('sha256').update(data).digest('hex')
} 