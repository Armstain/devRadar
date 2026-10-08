import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/server/db/client";
import { createTestDb } from "@/server/db/test-db";
import { saveGithubConnection } from "@/server/services/github-connections";
import { syncGithubSnapshot } from "@/server/services/github-snapshots";
import { makeRepo, makeSnapshot } from "@/lib/skills/fixtures";
import type { JobExtraction } from "@/lib/job-posts";

// Route handlers run for real against an in-process Postgres; Clerk's session
// and the model call are replaced.
const session = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: session.userId }) }));

let db: Database;
vi.mock("@/server/db/client", () => ({ getDb: () => db }));

const extractor = vi.hoisted(() => ({ fn: vi.fn() }));
vi.mock("@/server/ai/extract-job-post", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/server/ai/extract-job-post")>()),
    getJobPostExtractor: () => extractor.fn,
}));

const { GET: list, POST: analyze } = await import("./route");
const { GET: getPost } = await import("./[id]/route");
const { POST: saveToPipeline } = await import("./[id]/application/route");
const { GET: getApplication } = await import("../applications/[id]/route");
const { GET: getInsights } = await import("../insights/route");

const POST_TEXT = `Lumen Labs is hiring a Senior Full-stack Engineer (remote, EU).
You'll build our customer dashboard end to end.
Requirements: 5+ years with TypeScript and React. Experience with PostgreSQL. Kubernetes in production.
Nice to have: GraphQL. Strong communication skills.`.padEnd(260, " ");

const extraction: JobExtraction = {
    company: "Lumen Labs",
    title: "Senior Full-stack Engineer",
    location: "EU",
    workplace: "remote",
    seniority: "senior",
    salary: null,
    summary: "Build the customer dashboard end to end.",
    requirements: [
        { skill: "TypeScript", importance: "required", quote: "5+ years with TypeScript and React" },
        { skill: "React", importance: "required", quote: "TypeScript and React" },
        { skill: "PostgreSQL", importance: "required", quote: "Experience with PostgreSQL" },
        { skill: "Kubernetes", importance: "required", quote: "Kubernetes in production" },
        { skill: "GraphQL", importance: "preferred", quote: "Nice to have: GraphQL" },
        { skill: "Communication", importance: "required", quote: "Strong communication skills" },
    ],
    responsibilities: ["Build the customer dashboard"],
};

const originalKey = process.env.TOKEN_ENCRYPTION_KEY;
beforeAll(async () => {
    process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    db = await createTestDb();
});
afterAll(() => {
    process.env.TOKEN_ENCRYPTION_KEY = originalKey;
});

beforeEach(() => {
    session.userId = `user_${randomUUID()}`;
    extractor.fn.mockReset().mockResolvedValue({ extraction, dropped: [], model: "test-model/job-extraction-v1" });
});

const noParams = { params: Promise.resolve({} as Record<string, never>) };
const withId = (id: string) => ({ params: Promise.resolve({ id }) });
const request = (body?: unknown) =>
    new Request("http://localhost/api/job-posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

async function connectGithub(userId: string) {
    await saveGithubConnection(db, userId, { token: "gho", username: "octocat", scopes: "" });
    await syncGithubSnapshot(db, userId, {
        fetchSnapshot: async () =>
            makeSnapshot([
                makeRepo({ name: "shop", deps: { npm: ["react", "typescript", "postgres"] } }),
                makeRepo({ name: "admin", deps: { npm: ["react", "typescript", "postgres"] } }),
            ]),
    });
}

describe("job posts API", () => {
    it("requires a session and a real post", async () => {
        session.userId = null;
        expect((await analyze(request({ text: POST_TEXT }), noParams)).status).toBe(401);
        session.userId = `user_${randomUUID()}`;
        expect((await analyze(request({ text: "too short" }), noParams)).status).toBe(400);
        expect(extractor.fn).not.toHaveBeenCalled();
    });

    it("extracts, stores and scores against the skill profile", async () => {
        await connectGithub(session.userId!);
        const response = await analyze(request({ text: POST_TEXT, url: "https://jobs.example.com/1" }), noParams);
        expect(response.status).toBe(201);
        const view = await response.json();

        expect(extractor.fn).toHaveBeenCalledWith(POST_TEXT.trim());
        expect(view.extraction.company).toBe("Lumen Labs");
        expect(view.fit.counts).toMatchObject({ strong: 3, gap: 2, unverifiable: 1 });
        expect(view.fit.score).toBeGreaterThan(40);
        expect(view.areas).toHaveLength(6);

        const again = await (await getPost(request(), withId(view.id))).json();
        expect(again.fit.score).toBe(view.fit.score);

        const listed = await (await list(new Request("http://localhost/api/job-posts"), noParams)).json();
        expect(listed).toEqual([expect.objectContaining({ id: view.id, title: "Senior Full-stack Engineer", score: view.fit.score })]);
    });

    it("explains instead of scoring when GitHub isn't connected", async () => {
        const view = await (await analyze(request({ text: POST_TEXT }), noParams)).json();
        expect(view.fit).toMatchObject({ score: null, summary: expect.stringMatching(/Connect GitHub/) });
    });

    it("answers 422 when the model output can't be used", async () => {
        const { ExtractionError } = await import("@/server/ai/extract-job-post");
        extractor.fn.mockRejectedValue(new ExtractionError("bad json"));
        expect((await analyze(request({ text: POST_TEXT }), noParams)).status).toBe(422);
    });

    it("saves to the pipeline once and links the application back", async () => {
        const view = await (await analyze(request({ text: POST_TEXT, url: "https://jobs.example.com/2" }), noParams)).json();

        const first = await saveToPipeline(request({}), withId(view.id));
        expect(first.status).toBe(201);
        const application = await first.json();
        expect(application).toMatchObject({ company: "Lumen Labs", position: "Senior Full-stack Engineer", link: "https://jobs.example.com/2", status: "applied" });

        const second = await saveToPipeline(request({}), withId(view.id));
        expect(second.status).toBe(200);
        expect((await second.json()).id).toBe(application.id);

        const detail = await (await getApplication(request(), withId(application.id))).json();
        expect(detail.jobPostId).toBe(view.id);
    });

    it("feeds the fit score of saved posts into the insights", async () => {
        await connectGithub(session.userId!);
        const view = await (await analyze(request({ text: POST_TEXT }), noParams)).json();
        await saveToPipeline(request({}), withId(view.id));

        const insights = await (await getInsights(request(), noParams)).json();
        expect(insights.total).toBe(1);
        const band = insights.byFit.find((b: { sent: number }) => b.sent === 1);
        expect(band.band).not.toBe("unscored");
    });

    it("never shows one user's post to another", async () => {
        const view = await (await analyze(request({ text: POST_TEXT }), noParams)).json();
        session.userId = `user_${randomUUID()}`;
        expect((await getPost(request(), withId(view.id))).status).toBe(404);
        expect((await saveToPipeline(request({}), withId(view.id))).status).toBe(404);
    });
});
