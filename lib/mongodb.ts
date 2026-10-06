import { MongoClient, ServerApiVersion } from 'mongodb'

const options = {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
}

function getUri(): string {
    const uri = process.env.MONGODB_URI ?? process.env.NEXT_PUBLIC_MONGODB_URI
    if (!uri) {
        throw new Error('Please add MONGODB_URI to .env.local')
    }
    if (!process.env.MONGODB_URI) {
        console.warn('NEXT_PUBLIC_MONGODB_URI is deprecated; rename it to MONGODB_URI')
    }
    return uri
}

// In development, keep the client on a global so it survives
// Hot Module Replacement instead of opening a new pool on every reload.
const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
}

let clientPromise: Promise<MongoClient> | undefined

function connect(): Promise<MongoClient> {
    const promise = new MongoClient(getUri(), options).connect()
    // Forget a failed connection so the next request can retry.
    promise.catch(() => {
        clientPromise = undefined
        globalWithMongo._mongoClientPromise = undefined
    })
    return promise
}

// Connects lazily, so importing this module (e.g. during `next build`)
// does not require a database connection string.
export function getMongoClient(): Promise<MongoClient> {
    if (process.env.NODE_ENV === 'development') {
        globalWithMongo._mongoClientPromise ??= connect()
        return globalWithMongo._mongoClientPromise
    }
    clientPromise ??= connect()
    return clientPromise
}
