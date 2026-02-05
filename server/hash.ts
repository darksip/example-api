/**
 * Token hashing utilities
 */

import { createHash } from 'crypto'

/**
 * Generate a SHA-256 hash from a token
 * This hash is stored client-side and used to identify tokens
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
