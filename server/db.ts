/**
 * SQLite database setup for token storage
 */

import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

const DB_PATH = process.env.DB_PATH || './data/tokens.db'

// Ensure data directory exists
const dbDir = dirname(DB_PATH)
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

export const db = new Database(DB_PATH)

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS tokens (
    hash TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    api_url TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  )
`)

// Prepared statements for performance
export const statements = {
  insertToken: db.prepare('INSERT OR REPLACE INTO tokens (hash, token, api_url) VALUES (?, ?, ?)'),
  getToken: db.prepare('SELECT token, api_url FROM tokens WHERE hash = ?'),
  deleteToken: db.prepare('DELETE FROM tokens WHERE hash = ?'),
  getAllTokens: db.prepare('SELECT hash, api_url, created_at FROM tokens ORDER BY created_at DESC'),
}

export interface TokenRow {
  token: string
  api_url: string
}

export interface TokenListRow {
  hash: string
  api_url: string
  created_at: number
}
