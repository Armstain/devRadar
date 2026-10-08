"use client";

import type { CvProfile } from "./types";

// The CV lives in this browser's IndexedDB, keyed by the signed-in user so a
// shared computer never shows one person's CV to another. Every call fails
// soft: private windows and blocked storage just mean "no CV saved".

const DB = "devradar";
const STORE = "cv";

function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T | undefined> {
    try {
        const db = await open();
        return await new Promise<T>((resolve, reject) => {
            const request = action(db.transaction(STORE, mode).objectStore(STORE));
            request.onsuccess = () => resolve(request.result as T);
            request.onerror = () => reject(request.error);
        }).finally(() => db.close());
    } catch {
        return undefined;
    }
}

export async function loadCv(userId: string): Promise<CvProfile | null> {
    const cv = await run<CvProfile>("readonly", (s) => s.get(userId));
    return cv?.version === 1 ? cv : null;
}

export async function saveCv(userId: string, cv: CvProfile): Promise<void> {
    await run("readwrite", (s) => s.put(cv, userId));
}

export async function forgetCv(userId: string): Promise<void> {
    await run("readwrite", (s) => s.delete(userId));
}

// On sign-out: nothing of anyone's CV stays in the browser
export async function forgetAllCvs(): Promise<void> {
    await run("readwrite", (s) => s.clear());
}
