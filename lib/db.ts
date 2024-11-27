import { Db } from 'mongodb'
import clientPromise from './mongodb'

let db: Db

export async function getDb() {
    if (!db) {
        const client = await clientPromise
        db = client.db('devradar')
    }
    return db
}

// Helper function to get a collection
export async function getCollection(collectionName: string) {
    const db = await getDb()
    return db.collection(collectionName)
}