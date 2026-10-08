import { beforeEach, describe, expect, it, vi } from "vitest";

// Clerk's session and the model call are replaced.
const session = vi.hoisted(() => ({ userId: "user_cv" as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: session.userId }) }));

// This route never touches the database; the route wrapper just hands one over
vi.mock("@/server/db/client", () => ({ getDb: () => ({}) }));

const reader = vi.hoisted(() => ({ fn: vi.fn() as ReturnType<typeof vi.fn> | null }));
vi.mock("@/server/ai/read-cv", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/server/ai/read-cv")>()),
    getCvReader: () => reader.fn,
}));

const { CvReadFailed } = await import("@/server/ai/read-cv");
const { POST: read } = await import("./read/route");

const CV = `Mara Okafor
mara@example.com · +351 912 345 678 · linkedin.com/in/mara
Experience
Senior Frontend Engineer, Parcel, Jan 2023 – Present. React, TypeScript and Next.js.`;

const request = (body: unknown) =>
    new Request("http://localhost/api/cv/read", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const noParams = { params: Promise.resolve({} as Record<string, never>) };

beforeEach(() => {
    session.userId = `user_${Math.random()}`;
    reader.fn = vi.fn().mockResolvedValue({ roles: [{ title: "Senior Frontend Engineer", company: "Parcel", start: "2023-01", end: null, technologies: ["React"] }] });
});

describe("CV read API", () => {
    it("requires a session and a CV-sized text", async () => {
        session.userId = null;
        expect((await read(request({ text: CV }), noParams)).status).toBe(401);
        session.userId = "user_x";
        expect((await read(request({ text: "too short" }), noParams)).status).toBe(400);
    });

    it("strips contact details before the model sees anything", async () => {
        const response = await read(request({ text: CV }), noParams);
        expect(response.status).toBe(200);
        expect((await response.json()).roles).toHaveLength(1);
        const sent = (reader.fn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(sent).not.toMatch(/Mara Okafor|mara@example\.com|912 345 678|linkedin\.com/);
        expect(sent).toContain("Senior Frontend Engineer, Parcel");
    });

    it("answers 422 when the model's answer can't be used, and 503 without a key", async () => {
        (reader.fn as ReturnType<typeof vi.fn>).mockRejectedValue(new CvReadFailed("bad json"));
        expect((await read(request({ text: CV }), noParams)).status).toBe(422);
        reader.fn = null;
        expect((await read(request({ text: CV }), noParams)).status).toBe(503);
    });
});
