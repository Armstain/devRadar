import { describe, expect, it } from "vitest";
import { TECHNOLOGIES, TECHNOLOGY_BY_ID } from "@/lib/skills/catalog";
import type { JobExtraction } from "@/lib/job-posts";
import { CASES } from "./cases";
import { scoreCase, summarize, type EvalCase } from "./metrics";

// Checks the eval set itself (labels are real and reachable) and the scoring
// arithmetic. The live eval against the model is `npm run eval`.

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const mentioned = (id: string, post: string) => {
    const tech = TECHNOLOGIES.find((t) => t.id === id)!;
    return [tech.name, ...(tech.aliases ?? [])].some((term) => new RegExp(`(?<![a-z0-9])${escape(term)}`, "i").test(post));
};

// What a perfect extraction would return: each labelled technology by name
function ideal(testCase: EvalCase): JobExtraction {
    const req = (id: string, importance: "required" | "preferred") => ({ skill: TECHNOLOGY_BY_ID.get(id)!.name, importance, quote: "" });
    return {
        company: testCase.expected.company,
        title: testCase.expected.title,
        location: null,
        workplace: testCase.expected.workplace,
        seniority: testCase.expected.seniority,
        salary: null,
        summary: "",
        requirements: [...testCase.expected.required.map((id) => req(id, "required")), ...testCase.expected.preferred.map((id) => req(id, "preferred"))],
        responsibilities: [],
    };
}

describe("eval set", () => {
    it.each(CASES.map((c) => [c.id, c] as const))("%s has real, reachable labels", (_id, testCase) => {
        const { required, preferred, forbidden = [] } = testCase.expected;
        for (const id of [...required, ...preferred, ...forbidden]) expect(TECHNOLOGY_BY_ID.has(id), `unknown id ${id}`).toBe(true);
        for (const id of [...required, ...preferred]) expect(mentioned(id, testCase.post), `${id} isn't mentioned in the post`).toBe(true);
        expect(required.filter((id) => preferred.includes(id))).toEqual([]);
        expect(testCase.post.length).toBeGreaterThanOrEqual(200);
    });

    it("gives a perfect extraction full marks", () => {
        const scores = CASES.map((c) => scoreCase(c, ideal(c)));
        for (const s of scores) expect(s).toMatchObject({ recall: 1, precision: 1, importanceAccuracy: 1, fieldAccuracy: 1 });
        expect(summarize(scores).passed).toBe(true);
    });
});

describe("scoring", () => {
    const testCase = CASES.find((c) => c.id === "prompt-injection")!;

    it("penalises misses, extras, wrong importance and wrong fields", () => {
        const extraction = ideal(testCase);
        extraction.requirements = [
            { skill: "JavaScript", importance: "required", quote: "" },
            { skill: "Express", importance: "preferred", quote: "" },
            { skill: "Python", importance: "required", quote: "" },
        ];
        extraction.workplace = "onsite";
        const score = scoreCase(testCase, extraction);
        expect(score.missing).toEqual(expect.arrayContaining(["nodejs", "vue", "mysql", "unit-tests", "docker"]));
        expect(score.unexpected).toEqual(["python"]);
        expect(score.wrongImportance).toEqual(["express"]);
        expect(score.wrongFields).toEqual(["workplace"]);
        expect(score.recall).toBeCloseTo(2 / 7);
        expect(score.precision).toBeCloseTo(2 / 3);
    });

    it("fails the run when an injected skill gets through", () => {
        const extraction = ideal(testCase);
        extraction.requirements.push({ skill: "Rust", importance: "required", quote: "" });
        const summary = summarize([scoreCase(testCase, extraction)]);
        expect(summary.passed).toBe(false);
        expect(summary.failures.join()).toMatch(/prompt injection/);
    });
});
