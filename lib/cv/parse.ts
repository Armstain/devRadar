import { TECHNOLOGY_BY_ID } from "@/lib/skills/catalog";
import { matchTechnologies } from "@/lib/fit/match";
import type { CvProfile, CvRole, CvTechnology, Seniority } from "./types";

// Reads a CV with plain rules, entirely in the browser: technologies from the
// same catalog the GitHub scan uses, roles from date ranges, total experience
// with overlapping roles merged, and seniority from the latest title.

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const DATE = `(?:${MONTH}\\.?\\s+(\\d{4})|(\\d{1,2})[/.](\\d{4})|(\\d{4}))`;
const RANGE = new RegExp(`${DATE}\\s*(?:–|—|-|to|until)\\s*(?:${DATE}|(present|current|now|today|ongoing))`, "i");

const SECTION =
    /^(?:(?:work|professional|relevant)\s+)?(experience|employment(?: history)?|work history|career|education|skills|technical skills|projects|personal projects|certifications?|summary|profile|about|languages|awards|publications|volunteering|volunteer experience|interests|references|courses)\s*:?$/i;
const EXPERIENCE_SECTIONS = /experience|employment|work history|career/i;
const TITLE_WORDS =
    /\b(engineer|developer|programmer|architect|lead|manager|intern|consultant|scientist|analyst|designer|cto|head|director|founder|sre|devops|administrator|specialist|tech lead|freelance)\b/i;

type YearMonth = { y: number; m: number };

function parseDate(parts: (string | undefined)[]): YearMonth | null {
    const [month, yearAfterMonth, mm, yearAfterMm, yearOnly] = parts;
    if (month && yearAfterMonth) return { y: Number(yearAfterMonth), m: MONTHS.indexOf(month.slice(0, 3).toLowerCase()) + 1 };
    if (mm && yearAfterMm) return { y: Number(yearAfterMm), m: Math.min(12, Math.max(1, Number(mm))) };
    // A bare year: assume mid-year, so "2019 – 2022" reads as three years
    if (yearOnly) return { y: Number(yearOnly), m: 6 };
    return null;
}

const ym = (d: YearMonth) => `${d.y}-${String(d.m).padStart(2, "0")}`;
const index = (d: YearMonth) => d.y * 12 + (d.m - 1);

export function findDateRange(line: string, now: Date): { start: YearMonth; end: YearMonth | null; at: number; length: number } | null {
    const match = RANGE.exec(line);
    if (!match) return null;
    const start = parseDate(match.slice(1, 6));
    const end = match[11] ? null : parseDate(match.slice(6, 11));
    if (!start || (!end && !match[11])) return null;
    const endOrNow = end ?? { y: now.getUTCFullYear(), m: now.getUTCMonth() + 1 };
    // Ignore nonsense: a range that runs backwards or starts in the future
    if (index(endOrNow) < index(start) || start.y < 1970 || index(start) > index({ y: now.getUTCFullYear(), m: now.getUTCMonth() + 1 })) return null;
    return { start, end, at: match.index, length: match[0].length };
}

// Technologies in a block of text. Lines are split at list separators so
// short names ("Go", "R") count when they're listed, not when they're words.
export function technologiesIn(text: string): string[] {
    const found = new Set<string>();
    for (const chunk of text.split(/[\n,;:•|·()]+|\s[-–—]\s/)) {
        const trimmed = chunk.trim();
        if (trimmed.length < 1 || trimmed.length > 160) {
            if (trimmed.length > 160) for (const id of matchTechnologies(trimmed)) found.add(id);
            continue;
        }
        for (const id of matchTechnologies(trimmed)) found.add(id);
    }
    return [...found];
}

function splitTitle(text: string): { title: string; company: string | null } {
    const cleaned = text.replace(/^[\s|,·•–—-]+|[\s|,·•–—-]+$/g, "").trim();
    const parts = cleaned
        .split(/\s+(?:at|@)\s+|\s*[|,·•–—]\s*|\s+-\s+/)
        .map((p) => p.trim())
        .filter(Boolean);
    if (parts.length < 2) return { title: cleaned, company: null };
    const titleIndex = parts.findIndex((p) => TITLE_WORDS.test(p));
    const t = titleIndex === -1 ? 0 : titleIndex;
    const company = parts.find((_, i) => i !== t) ?? null;
    return { title: parts[t], company };
}

export function seniorityFromTitle(title: string): Seniority {
    const t = title.toLowerCase();
    if (/\bintern(ship)?\b|\btrainee\b/.test(t)) return "intern";
    if (/\bprincipal\b|\bdistinguished\b/.test(t)) return "principal";
    if (/\bstaff\b/.test(t)) return "staff";
    if (/\blead\b|\bhead of\b|\bmanager\b|\bdirector\b|\bcto\b|\bvp\b/.test(t)) return "lead";
    if (/\bsenior\b|\bsr\.?\b/.test(t)) return "senior";
    if (/\bjunior\b|\bjr\.?\b|\bgraduate\b|\bentry\b/.test(t)) return "junior";
    return "mid";
}

// Months covered by a set of [start, end] month indexes, overlaps counted once
function mergedMonths(spans: [number, number][]): number {
    const sorted = [...spans].sort((a, b) => a[0] - b[0]);
    let total = 0;
    let current: [number, number] | null = null;
    for (const [s, e] of sorted) {
        if (current && s <= current[1] + 1) current[1] = Math.max(current[1], e);
        else {
            if (current) total += current[1] - current[0] + 1;
            current = [s, e];
        }
    }
    if (current) total += current[1] - current[0] + 1;
    return total;
}

const spanOf = (role: CvRole, now: Date): [number, number] => {
    const [sy, sm] = role.start.split("-").map(Number);
    const [ey, em] = role.end ? role.end.split("-").map(Number) : [now.getUTCFullYear(), now.getUTCMonth() + 1];
    return [sy * 12 + sm - 1, ey * 12 + em - 1];
};

export function parseCv(text: string, fileName: string, now = new Date()): CvProfile {
    const lines = text.replace(/\r/g, "").split("\n").map((l) => l.replace(/\s+/g, " ").trim());
    const roles: (CvRole & { block: string[] })[] = [];
    let section: string | null = null;
    let current: (CvRole & { block: string[] }) | null = null;
    let lastText = "";

    for (const line of lines) {
        if (!line) continue;
        const heading = line.length <= 40 ? SECTION.exec(line) : null;
        if (heading) {
            section = heading[1].toLowerCase();
            current = null;
            lastText = "";
            continue;
        }
        const inExperience = section === null || EXPERIENCE_SECTIONS.test(section);
        const range = inExperience ? findDateRange(line, now) : null;
        if (range) {
            const rest = (line.slice(0, range.at) + " " + line.slice(range.at + range.length)).trim();
            const { title, company } = splitTitle(rest.length >= 3 ? rest : lastText);
            const fallback = rest.length >= 3 ? splitTitle(lastText) : { title: "", company: null };
            current = {
                title: title || "Role",
                company: company ?? (fallback.title && !TITLE_WORDS.test(fallback.title) ? fallback.title : null),
                start: ym(range.start),
                end: range.end ? ym(range.end) : null,
                months: 0,
                technologies: [],
                block: [],
            };
            current.months = spanOf(current, now)[1] - spanOf(current, now)[0] + 1;
            roles.push(current);
            continue;
        }
        if (current) current.block.push(line);
        lastText = line;
    }

    for (const role of roles) role.technologies = technologiesIn(role.block.join("\n"));
    return profileFromRoles(
        { fileName, text, source: "local" },
        roles.map(({ title, company, start, end, months, technologies }) => ({ title, company, start, end, months, technologies })),
        now
    );
}

// Everything derived from the roles: technologies with the time spent using
// them, total experience and seniority. Shared by the local read and the
// opt-in AI read, which supplies its own roles.
export function profileFromRoles(base: Pick<CvProfile, "fileName" | "text" | "source">, roles: CvRole[], now = new Date()): CvProfile {
    const allIds = technologiesIn(base.text);
    for (const role of roles) for (const id of role.technologies) if (!allIds.includes(id)) allIds.push(id);

    const technologies: CvTechnology[] = allIds
        .filter((id) => TECHNOLOGY_BY_ID.has(id))
        .map((id) => {
            const using = roles.filter((r) => r.technologies.includes(id));
            return {
                id,
                name: TECHNOLOGY_BY_ID.get(id)!.name,
                months: mergedMonths(using.map((r) => spanOf(r, now))),
                roles: using.map((r) => r.title),
            };
        })
        .sort((a, b) => b.months - a.months || a.name.localeCompare(b.name));

    const latest = [...roles].sort((a, b) => (b.end ?? "9999").localeCompare(a.end ?? "9999") || b.start.localeCompare(a.start))[0];

    return {
        version: 1,
        ...base,
        readAt: now.toISOString(),
        roles,
        totalMonths: mergedMonths(roles.map((r) => spanOf(r, now))),
        seniority: latest ? seniorityFromTitle(latest.title) : null,
        technologies,
    };
}

export function monthsBetween(start: string, end: string | null, now = new Date()): number {
    const [s, e] = spanOf({ start, end } as CvRole, now);
    return Math.max(1, e - s + 1);
}

// For requirements code can't show ("mentoring", "degree in computer
// science"): does the CV say it? Returns the line that does.
const STOP = new Set(["experience", "strong", "skills", "skill", "ability", "years", "year", "with", "working", "knowledge", "understanding", "good", "excellent", "solid", "proven", "plus", "familiarity", "including", "other", "using", "the", "and", "for", "from"]);
const stem = (w: string) => w.replace(/(ing|ed|es|s|ion|ions|ive)$/, "").slice(0, Math.max(4, w.length - 3));

export function cvMentions(text: string, phrase: string): string | null {
    const words = phrase
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/)
        .filter((w) => w.length >= 4 && !STOP.has(w));
    if (!words.length) return null;
    const stems = words.map(stem);
    const lines = text.split("\n");
    const lower = text.toLowerCase();
    const hits = stems.filter((s) => lower.includes(s));
    // Every keyword for a short phrase; most of them for a longer one
    if (hits.length < Math.max(1, Math.ceil(stems.length * 0.6))) return null;
    const line = lines.find((l) => hits.some((s) => l.toLowerCase().includes(s)));
    return line ? line.trim().slice(0, 160) : null;
}

// "5+ years with React" → 5
export function yearsAsked(text: string): number | null {
    const match = /(\d{1,2})\s*\+?\s*(?:or more\s+)?years?/i.exec(text);
    return match ? Number(match[1]) : null;
}

// Removes what identifies a person before an opt-in AI read: the name line,
// email addresses, phone numbers, links and street addresses.
export function redact(text: string): string {
    const lines = text.split("\n");
    const firstIndex = lines.findIndex((l) => l.trim());
    if (firstIndex !== -1) {
        const first = lines[firstIndex].trim();
        if (first.split(/\s+/).length <= 5 && !/\d/.test(first) && !SECTION.test(first)) lines[firstIndex] = "[name]";
    }
    // A line with an email address or phone number is the contact line: drop
    // all of it, location included
    const contact = /[\w.+-]+@[\w-]+\.[\w.-]+|\+?\d[\d\s().-]{7,}\d/;
    return lines
        .map((line) => (contact.test(line) && !RANGE.test(line) && line.length < 200 ? "[contact details]" : line))
        .join("\n")
        .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
        .replace(/\b(?:https?:\/\/|www\.)\S+|\b(?:linkedin|github|gitlab|twitter|x)\.com\/\S+/gi, "[link]")
        // At least eight digits, and not a year range like "2019 - 2022"
        .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, (m) =>
            m.replace(/\D/g, "").length >= 8 && !/^\s*(?:19|20)\d{2}\s*-\s*(?:19|20)\d{2}\s*$/.test(m) ? "[phone]" : m
        )
        .replace(/^.*\b(?:address|street|st\.|road|rd\.|avenue|ave\.|apt|suite)\b.*$/gim, "[address]");
}
