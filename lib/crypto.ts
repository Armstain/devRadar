import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Third-party OAuth tokens are encrypted at rest with AES-256-GCM.
// Format: enc:v1:<iv>.<auth tag>.<ciphertext>, each part base64url.
const PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
    const raw = process.env.TOKEN_ENCRYPTION_KEY;
    if (!raw) {
        throw new Error("TOKEN_ENCRYPTION_KEY is not set");
    }
    const key = Buffer.from(raw, "base64");
    if (key.length !== 32) {
        throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
    }
    return key;
}

export function encryptToken(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, getKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return PREFIX + [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptToken(stored: string): string {
    // Tokens saved before encryption was introduced are plaintext; they are
    // re-encrypted the next time the user reconnects the account.
    if (!stored.startsWith(PREFIX)) {
        return stored;
    }

    const [iv, tag, ciphertext] = stored
        .slice(PREFIX.length)
        .split(".")
        .map((part) => Buffer.from(part, "base64url"));
    if (!iv || !tag || !ciphertext) {
        throw new Error("Malformed encrypted token");
    }

    const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
