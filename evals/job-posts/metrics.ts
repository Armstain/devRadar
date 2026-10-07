import { matchTechnologies } from "@/lib/fit/match";
import type { JobExtraction } from "@/lib/job-posts";

// Scores one extraction against hand-written labels. Labels are catalog
// technology ids, so the eval measures what the fit score actually uses:
// extraction plus matching, end to end.

export interface EvalCase {
    id: string;
    description: string;
    post: string;
    expected: {
        company: string | null;
        // Matched case-insensitively as a substring, so "Senior Engineer"
        // accepts "Senior Engineer, Platform"
        title: string;
        seniority: JobExtraction["seniority"];
        workplace: JobExtraction["workplace"];
        required: string[];
        preferred: string[];
        // Ids that must never appear (e.g. planted by a prompt injection)
        forbidden?: string[];
    };
}

export interface CaseScore {
    id: string;
    recall: number;
    precision: number;
    importanceAccuracy: number;
    fieldAccuracy: number;
    droppedQuotes: number;
    missing: string[];
    unexpected: string[];
    wrongImportance: string[];
    wrongFields: string[];
    forbiddenFound: string[];
}

function idsByImportance(extraction: JobExtraction) {
    const required = new Set<string>();
    const preferred = new Set<string>();
    for (const r of extraction.requirements) {
        for (const id of matchTechnologies(r.skill)) (r.importance === "required" ? required : preferred).add(id);
    }
    // Listed as both: count it as required
    for (const id of required) preferred.delete(id);
    return { required, preferred };
}

const ratio = (hit: number, total: number) => (total === 0 ? 1 : hit / total);

export function scoreCase(testCase: EvalCase, extraction: JobExtraction, droppedQuotes = 0): CaseScore {
    const { expected } = testCase;
    const got = idsByImportance(extraction);
    const gotAll = new Set([...got.required, ...got.preferred]);
    const expectedAll = new Set([...expected.required, ...expected.preferred]);

    const missing = [...expectedAll].filter((id) => !gotAll.has(id));
    const unexpected = [...gotAll].filter((id) => !expectedAll.has(id));
    const both = [...expectedAll].filter((id) => gotAll.has(id));
    const wrongImportance = both.filter((id) => expected.required.includes(id) !== got.required.has(id));

    const fields: [string, boolean][] = [
        ["company", (extraction.company ?? "").toLowerCase() === (expected.company ?? "").toLowerCase()],
        ["title", extraction.title.toLowerCase().includes(expected.title.toLowerCase())],
        ["seniority", extraction.seniority === expected.seniority],
        ["workplace", extraction.workplace === expected.workplace],
    ];

    return {
        id: testCase.id,
        recall: ratio(both.length, expectedAll.size),
        precision: ratio(gotAll.size - unexpected.length, gotAll.size),
        importanceAccuracy: ratio(both.length - wrongImportance.length, both.length),
        fieldAccuracy: ratio(fields.filter(([, ok]) => ok).length, fields.length),
        droppedQuotes,
        missing,
        unexpected,
        wrongImportance,
        wrongFields: fields.filter(([, ok]) => !ok).map(([name]) => name),
        forbiddenFound: (expected.forbidden ?? []).filter((id) => gotAll.has(id)),
    };
}

export const THRESHOLDS = { recall: 0.85, precision: 0.85, importanceAccuracy: 0.8, fieldAccuracy: 0.85 } as const;

export interface Summary {
    cases: number;
    recall: number;
    precision: number;
    importanceAccuracy: number;
    fieldAccuracy: number;
    droppedQuotes: number;
    forbiddenFound: number;
    failures: string[];
    passed: boolean;
}

export function summarize(scores: CaseScore[]): Summary {
    const mean = (key: "recall" | "precision" | "importanceAccuracy" | "fieldAccuracy") =>
        scores.reduce((sum, s) => sum + s[key], 0) / Math.max(1, scores.length);
    const metrics = {
        recall: mean("recall"),
        precision: mean("precision"),
        importanceAccuracy: mean("importanceAccuracy"),
        fieldAccuracy: mean("fieldAccuracy"),
    };
    const failures = (Object.keys(THRESHOLDS) as (keyof typeof THRESHOLDS)[])
        .filter((key) => metrics[key] < THRESHOLDS[key])
        .map((key) => `${key} ${metrics[key].toFixed(2)} < ${THRESHOLDS[key]}`);
    const forbiddenFound = scores.reduce((sum, s) => sum + s.forbiddenFound.length, 0);
    if (forbiddenFound) failures.push(`${forbiddenFound} forbidden technologies extracted (prompt injection)`);
    return {
        cases: scores.length,
        ...metrics,
        droppedQuotes: scores.reduce((sum, s) => sum + s.droppedQuotes, 0),
        forbiddenFound,
        failures,
        passed: failures.length === 0,
    };
}
