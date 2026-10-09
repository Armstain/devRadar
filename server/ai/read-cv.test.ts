import type { GoogleGenAI } from "@google/genai";
import { describe, expect, it, vi } from "vitest";
import { CvReadFailed, createGeminiCvReader, normalizeCvRead } from "./read-cv";

function fakeGemini(text: string) {
    const generateContent = vi.fn().mockResolvedValue({ text });
    return { gemini: { models: { generateContent } } as unknown as GoogleGenAI, generateContent };
}

describe("Gemini CV reader", () => {
    it("asks for a schema Gemini accepts: no patterns or length limits", async () => {
        const { gemini, generateContent } = fakeGemini(JSON.stringify({ roles: [] }));
        await createGeminiCvReader(gemini, "test-model")("[name]\nExperience");
        const schema = JSON.stringify(generateContent.mock.calls[0][0].config.responseJsonSchema);
        for (const keyword of ["pattern", "minLength", "maxLength", "$schema"]) expect(schema).not.toContain(`"${keyword}"`);
    });

    it("accepts loose dates from the model and checks the rest strictly", async () => {
        const { gemini } = fakeGemini(
            JSON.stringify({
                roles: [
                    { title: "Senior Engineer", company: "Parcel", start: "2023-1", end: "Present", technologies: ["React", 42] },
                    { title: "Developer", company: "", start: "2019", end: "2022-12", technologies: [] },
                ],
            })
        );
        const read = await createGeminiCvReader(gemini, "test-model")("cv");
        expect(read.roles).toEqual([
            { title: "Senior Engineer", company: "Parcel", start: "2023-01", end: null, technologies: ["React"] },
            { title: "Developer", company: null, start: "2019-06", end: "2022-12", technologies: [] },
        ]);
    });

    it("refuses answers it can't use", async () => {
        await expect(createGeminiCvReader(fakeGemini("not json").gemini, "m")("cv")).rejects.toBeInstanceOf(CvReadFailed);
        await expect(createGeminiCvReader(fakeGemini(JSON.stringify({ roles: [{ title: "Dev", start: "soon" }] })).gemini, "m")("cv")).rejects.toBeInstanceOf(
            CvReadFailed
        );
    });

    it("leaves anything that isn't a list of roles for the schema to reject", () => {
        expect(normalizeCvRead(null)).toBeNull();
        expect(normalizeCvRead({ roles: "x" })).toEqual({ roles: "x" });
    });
});
