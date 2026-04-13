/**
 * Migration 003: Drop legacy username index from users collection
 *
 * The User model no longer has a `username` field, but MongoDB may still
 * have a unique index on it from an older schema version. When multiple
 * users have no `username` (null), the unique constraint causes
 * "duplicate key error" on insert.
 */

import mongoose from 'mongoose'

export async function up(): Promise<void> {
  const db = mongoose.connection.db
  if (!db) throw new Error('Database connection not available')

  const collection = db.collection('users')

  // List current indexes and drop any that reference `username`
  const indexes = await collection.indexes()
  const usernameIndexes = indexes.filter(
    (idx) => idx.key && 'username' in idx.key
  )

  for (const idx of usernameIndexes) {
    if (idx.name) {
      console.log(`Dropping legacy index: ${idx.name}`)
      await collection.dropIndex(idx.name)
      console.log(`Dropped index: ${idx.name}`)
    }
  }

  if (usernameIndexes.length === 0) {
    console.log('No legacy username index found — nothing to drop')
  }
}

export async function down(): Promise<void> {
  // No rollback — the username field is permanently removed
}
