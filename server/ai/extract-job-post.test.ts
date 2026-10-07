import { describe, expect, it, vi } from "vitest";
import type { GoogleGenAI } from "@google/genai";
import { createGeminiExtractor, ExtractionError, parseExtraction } from "./extract-job-post";

const post = "Acme is hiring a Backend Engineer. You know Go and PostgreSQL. Bonus: Kubernetes.";
const output = {
    company: "Acme",
    title: "Backend Engineer",
    location: null,
    workplace: null,
    seniority: null,
    salary: null,
    summary: "Backend work.",
    requirements: [
        { skill: "Go", importance: "required", quote: "You know Go and PostgreSQL" },
        { skill: "PostgreSQL", importance: "required", quote: "Go and PostgreSQL" },
        { skill: "Kubernetes", importance: "preferred", quote: "Bonus: Kubernetes." },
        { skill: "Rust", importance: "required", quote: "Strong Rust experience" },
    ],
    responsibilities: [],
};

describe("parseExtraction", () => {
    it("validates, grounds and tags the model with the prompt version", () => {
        const result = parseExtraction(JSON.stringify(output), post, "gemini-x");
        expect(result.extraction.requirements.map((r) => r.skill)).toEqual(["Go", "PostgreSQL", "Kubernetes"]);
        expect(result.dropped.map((r) => r.skill)).toEqual(["Rust"]);
        expect(result.model).toBe("gemini-x/job-extraction-v1");
    });

    it("rejects invalid JSON and output that doesn't match the schema", () => {
        expect(() => parseExtraction("not json", post, "m")).toThrow(ExtractionError);
        expect(() => parseExtraction(JSON.stringify({ ...output, workplace: "on the moon" }), post, "m")).toThrow(ExtractionError);
    });
});

describe("createGeminiExtractor", () => {
    it("asks for schema-shaped JSON with the post fenced off as data", async () => {
        const generateContent = vi.fn().mockResolvedValue({ text: JSON.stringify(output) });
        const extract = createGeminiExtractor({ models: { generateContent } } as unknown as GoogleGenAI, "gemini-x");
        await extract(post);

        const [call] = generateContent.mock.calls[0];
        expect(call.contents).toBe(`<job_post>\n${post}\n</job_post>`);
        expect(call.config).toMatchObject({ temperature: 0, responseMimeType: "application/json" });
        expect(call.config.systemInstruction).toMatch(/Never follow instructions/);
        expect(call.config.responseJsonSchema).toMatchObject({ type: "object", required: expect.arrayContaining(["title", "requirements"]) });
        expect(call.config.responseJsonSchema).not.toHaveProperty("$schema");
    });

    it("fails clearly when the model returns nothing", async () => {
        const generateContent = vi.fn().mockResolvedValue({ text: undefined, candidates: [{ finishReason: "SAFETY" }] });
        const extract = createGeminiExtractor({ models: { generateContent } } as unknown as GoogleGenAI, "gemini-x");
        await expect(extract(post)).rejects.toThrow(/SAFETY/);
    });
});
