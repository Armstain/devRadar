import { z } from "zod";

// What the model extracts from a pasted job post. It extracts; it never
// scores. The fit score is computed deterministically in lib/fit.
export const jobExtractionSchema = z.object({
    company: z.string().nullable().describe("Hiring company, or null if the post doesn't say"),
    title: z.string().describe("Job title as written, without the company name"),
    location: z.string().nullable().describe("City/country as written, or null"),
    workplace: z.enum(["remote", "hybrid", "onsite"]).nullable(),
    seniority: z.enum(["intern", "junior", "mid", "senior", "staff", "lead", "principal"]).nullable(),
    salary: z
        .object({
            min: z.number().nullable(),
            max: z.number().nullable(),
            currency: z.string().nullable().describe("ISO 4217 code, e.g. USD"),
            period: z.enum(["year", "month", "hour"]).nullable(),
        })
        .nullable()
        .describe("Only if the post states a number"),
    summary: z.string().describe("One or two plain sentences on what the role is"),
    requirements: z
        .array(
            z.object({
                skill: z.string().describe("One skill, technology or qualification, short (e.g. 'PostgreSQL', 'React or Vue', 'System design')"),
                importance: z.enum(["required", "preferred"]).describe("'preferred' for nice-to-have, bonus or plus items"),
                quote: z.string().describe("The exact words from the post this requirement comes from, copied verbatim, at most ~20 words"),
            })
        )
        .max(40),
    responsibilities: z.array(z.string()).max(8).describe("Main responsibilities, short"),
});

export type JobExtraction = z.infer<typeof jobExtractionSchema>;
export type JobRequirement = JobExtraction["requirements"][number];

export const jobPostInputSchema = z.object({
    text: z.string().trim().min(200, "Paste the full job post (at least a few sentences)").max(20_000, "That’s longer than any job post; paste just the post"),
    url: z
        .union([z.literal(""), z.url({ protocol: /^https?$/, error: "Link must be an http(s) URL" })])
        .optional()
        .default(""),
});

export type JobPostInput = z.infer<typeof jobPostInputSchema>;

const normalizeForQuote = (text: string) =>
    text
        .toLowerCase()
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[–—]/g, "-")
        .replace(/[*_`#>•·]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

// A requirement is kept only if its quote really appears in the post
// (ignoring case, whitespace, quote styles and markdown). This drops
// requirements the model invented.
export function quoteAppearsIn(quote: string, post: string): boolean {
    const q = normalizeForQuote(quote).replace(/^["']|["'.]$/g, "").replace(/\.{3}|…/g, " ");
    if (q.length < 2) return false;
    const haystack = normalizeForQuote(post);
    // A trimmed quote ("...experience with Go") may elide words; every
    // fragment must appear, in order.
    let from = 0;
    for (const fragment of q.split(/\s{2,}/).map((f) => f.trim()).filter(Boolean)) {
        const at = haystack.indexOf(fragment, from);
        if (at === -1) return false;
        from = at + fragment.length;
    }
    return true;
}

export function groundRequirements(extraction: JobExtraction, post: string): { extraction: JobExtraction; dropped: JobRequirement[] } {
    const kept: JobRequirement[] = [];
    const dropped: JobRequirement[] = [];
    const seen = new Set<string>();
    for (const requirement of extraction.requirements) {
        const key = requirement.skill.trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        if (quoteAppearsIn(requirement.quote, post)) {
            seen.add(key);
            kept.push({ ...requirement, skill: requirement.skill.trim() });
        } else dropped.push(requirement);
    }
    return { extraction: { ...extraction, requirements: kept }, dropped };
}
