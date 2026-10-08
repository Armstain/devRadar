import { z } from "zod";
import { matchTechnologies } from "@/lib/fit/match";
import { monthsBetween, profileFromRoles, seniorityFromTitle } from "./parse";
import type { CvProfile, CvRole } from "./types";

// The opt-in AI read: roles as the model reads them from the redacted CV.
// Shared by the route (to validate the model's answer) and the browser (to
// rebuild the local profile from it).

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "YYYY-MM");

export const cvReadSchema = z.object({
    roles: z
        .array(
            z.object({
                title: z.string().min(1).max(120),
                company: z.string().max(120).nullable(),
                start: month,
                end: month.nullable(),
                technologies: z.array(z.string().max(60)).max(40),
            })
        )
        .max(25),
});

export type CvRead = z.infer<typeof cvReadSchema>;

export const cvReadRequestSchema = z.object({
    text: z.string().trim().min(80, "That CV is too short to read").max(30_000, "That CV is too long to read"),
});

export function applyAiRead(cv: CvProfile, read: CvRead, now = new Date()): CvProfile {
    const roles: CvRole[] = read.roles.map((r) => ({
        title: r.title,
        company: r.company,
        start: r.start,
        end: r.end,
        months: monthsBetween(r.start, r.end, now),
        technologies: [...new Set(r.technologies.flatMap((t) => matchTechnologies(t)))],
    }));
    const profile = profileFromRoles({ fileName: cv.fileName, text: cv.text, source: "ai" }, roles, now);
    const latest = [...roles].sort((a, b) => (b.end ?? "9999").localeCompare(a.end ?? "9999"))[0];
    return { ...profile, seniority: latest ? seniorityFromTitle(latest.title) : cv.seniority };
}
