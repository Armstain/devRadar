import { Db } from 'mongodb'
import { getMongoClient } from './mongodb'

let dbPromise: Promise<Db> | undefined

async function ensureIndexes(db: Db) {
    try {
        await Promise.all([
            db.collection('applications').createIndex({ userId: 1, createdAt: -1 }),
            db.collection('users').createIndex({ userId: 1 }),
            db.collection('rate_limits').createIndex({ key: 1, windowStart: 1 }, { unique: true }),
            db.collection('rate_limits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        ])
    } catch (error) {
        // Missing indexes only cost performance; don't take the app down over it.
        console.error('[DB_INDEXES]', error)
    }
}

export function getDb(): Promise<Db> {
    if (!dbPromise) {
        dbPromise = getMongoClient().then(async (client) => {
            const db = client.db('devradar')
            await ensureIndexes(db)
            return db
        })
        // Allow a retry on the next request if the connection failed.
        dbPromise.catch(() => {
            dbPromise = undefined
        })
    }
    return dbPromise
}

// Helper function to get a collection
export async function getCollection(collectionName: string) {
    const db = await getDb()
    return db.collection(collectionName)
}
