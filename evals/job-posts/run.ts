// Runs the job-post extraction eval against the real model.
//   npm run eval            (needs GEMINI_API_KEY; skips without it)
// Exits non-zero when a metric drops below its threshold, so CI catches
// prompt or model changes that make extraction worse.
import { appendFileSync } from "node:fs";
import { getJobPostExtractor } from "@/server/ai/extract-job-post";
import { CASES } from "./cases";
import { scoreCase, summarize, THRESHOLDS, type CaseScore } from "./metrics";

const pct = (n: number) => `${Math.round(n * 100)}%`;

async function main() {
    const extract = getJobPostExtractor();
    if (!extract) {
        console.log("GEMINI_API_KEY isn't set; skipping the extraction eval.");
        return;
    }

    const scores: CaseScore[] = [];
    let model = "";
    for (const testCase of CASES) {
        const started = performance.now();
        let result;
        try {
            result = await extract(testCase.post);
        } catch (error) {
            // One retry for transient API errors; a second failure counts as a zero
            console.warn(`${testCase.id}: ${(error as Error).message}; retrying once`);
            result = await extract(testCase.post).catch(() => null);
        }
        if (!result) {
            scores.push({ id: testCase.id, recall: 0, precision: 0, importanceAccuracy: 0, fieldAccuracy: 0, droppedQuotes: 0, missing: [], unexpected: [], wrongImportance: [], wrongFields: ["(extraction failed)"], forbiddenFound: [] });
            continue;
        }
        model = result.model;
        const score = scoreCase(testCase, result.extraction, result.dropped.length);
        scores.push(score);
        const notes = [
            score.missing.length && `missing ${score.missing.join(", ")}`,
            score.unexpected.length && `extra ${score.unexpected.join(", ")}`,
            score.wrongImportance.length && `importance ${score.wrongImportance.join(", ")}`,
            score.wrongFields.length && `fields ${score.wrongFields.join(", ")}`,
            score.droppedQuotes && `${score.droppedQuotes} ungrounded quote(s) dropped`,
            score.forbiddenFound.length && `INJECTED ${score.forbiddenFound.join(", ")}`,
        ].filter(Boolean);
        console.log(
            `${testCase.id.padEnd(26)} recall ${pct(score.recall).padStart(4)}  precision ${pct(score.precision).padStart(4)}  ` +
                `importance ${pct(score.importanceAccuracy).padStart(4)}  fields ${pct(score.fieldAccuracy).padStart(4)}  ` +
                `${Math.round(performance.now() - started)}ms${notes.length ? `  · ${notes.join("; ")}` : ""}`
        );
    }

    const summary = summarize(scores);
    const rows = (["recall", "precision", "importanceAccuracy", "fieldAccuracy"] as const).map(
        (key) => `| ${key} | ${pct(summary[key])} | ${pct(THRESHOLDS[key])} | ${summary[key] >= THRESHOLDS[key] ? "pass" : "FAIL"} |`
    );
    const report = [
        `### Job post extraction eval (${model || "no model"})`,
        `${summary.cases} cases · ${summary.droppedQuotes} ungrounded quotes dropped · ${summary.forbiddenFound} injected skills`,
        "",
        "| Metric | Score | Threshold | |",
        "| --- | --- | --- | --- |",
        ...rows,
    ].join("\n");
    console.log(`\n${report}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);

    if (!summary.passed) {
        console.error(`Eval failed: ${summary.failures.join("; ")}`);
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
