import { TECHNOLOGIES } from "@/lib/skills/catalog";

// Maps a requirement as a job post words it ("Experience with React or Vue",
// "Postgres", "CI/CD") to catalog technologies. Anything that doesn't map
// ("system design", "mentoring") can't be read from code and isn't scored.

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const TERMS: { pattern: RegExp; id: string; length: number }[] = [];
const seen = new Set<string>();
for (const tech of TECHNOLOGIES) {
    for (const raw of [tech.name, tech.id, ...(tech.aliases ?? [])]) {
        const term = raw.toLowerCase();
        if (seen.has(term)) continue;
        seen.add(term);
        TERMS.push({
            // Not inside a longer word ("go" must not match "good" or
            // "mongo"), but plurals are fine ("REST APIs")
            pattern: new RegExp(`(?<![a-z0-9])${escape(term)}s?(?![a-z0-9+#])`, "i"),
            id: tech.id,
            length: term.length,
        });
    }
}
// Longest first, so "react native" wins over "react"
TERMS.sort((a, b) => b.length - a.length);

// Words too ambiguous to match inside a longer phrase
const STANDALONE_ONLY = new Set(["r", "c", "go", "rest", "ci", "ai", "js", "ts", "3d", "search", "auth", "orm", "next"]);

export function matchTechnologies(skill: string): string[] {
    let text = ` ${skill.toLowerCase()} `;
    const found: string[] = [];
    for (const { pattern, id } of TERMS) {
        const match = pattern.exec(text);
        if (!match) continue;
        const term = match[0].toLowerCase();
        const end = match.index + term.length;
        if (STANDALONE_ONLY.has(term) && text.trim() !== term && !isListItem(text, match.index, end)) continue;
        if (!found.includes(id)) found.push(id);
        // Consume the match so "react native" doesn't also count as "react"
        text = text.slice(0, match.index) + " ".repeat(term.length) + text.slice(end);
    }
    return found;
}

// "Go, Rust or Java": a short term counts when it's an item in a list of
// technologies rather than an ordinary word in a sentence.
function isListItem(text: string, start: number, end: number): boolean {
    const before = text.slice(0, start).trimEnd();
    const after = text.slice(end).trimStart();
    const separatorBefore = before === "" || /[,/(]$|\b(or|and)$/.test(before);
    const separatorAfter = after === "" || /^[,/)]|^(or|and)\b/.test(after);
    return separatorBefore && separatorAfter;
}
