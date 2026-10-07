import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptToken, encryptToken } from "./crypto";

describe("token encryption", () => {
    const originalKey = process.env.TOKEN_ENCRYPTION_KEY;

    beforeEach(() => {
        process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    });

    afterEach(() => {
        process.env.TOKEN_ENCRYPTION_KEY = originalKey;
    });

    it("round-trips a token", () => {
        const encrypted = encryptToken("gho_secret");
        expect(encrypted).toMatch(/^enc:v1:/);
        expect(encrypted).not.toContain("gho_secret");
        expect(decryptToken(encrypted)).toBe("gho_secret");
    });

    it("uses a fresh IV for every encryption", () => {
        expect(encryptToken("same")).not.toBe(encryptToken("same"));
    });

    it("passes legacy plaintext tokens through unchanged", () => {
        expect(decryptToken("gho_legacy_plaintext")).toBe("gho_legacy_plaintext");
    });

    it("rejects tampered ciphertext", () => {
        const [iv, tag, ciphertext] = encryptToken("gho_secret").slice("enc:v1:".length).split(".");
        const flipped = Buffer.from(ciphertext, "base64url");
        flipped[0] ^= 1;
        expect(() => decryptToken(`enc:v1:${iv}.${tag}.${flipped.toString("base64url")}`)).toThrow();
    });

    it("fails to decrypt with a different key", () => {
        const encrypted = encryptToken("gho_secret");
        process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
        expect(() => decryptToken(encrypted)).toThrow();
    });

    it("requires a 32-byte key", () => {
        delete process.env.TOKEN_ENCRYPTION_KEY;
        expect(() => encryptToken("x")).toThrow(/TOKEN_ENCRYPTION_KEY is not set/);
        process.env.TOKEN_ENCRYPTION_KEY = randomBytes(16).toString("base64");
        expect(() => encryptToken("x")).toThrow(/32 bytes/);
    });
});
