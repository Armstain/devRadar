import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-3.8-flash";

let client: GoogleGenAI | undefined;

// Returns null when GEMINI_API_KEY isn't configured, so routes can answer
// with a clear 503 instead of failing inside the SDK.
export function getGemini(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return null;
    }
    client ??= new GoogleGenAI({ apiKey });
    return client;
}

export function getGeminiModel(): string {
    return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}
