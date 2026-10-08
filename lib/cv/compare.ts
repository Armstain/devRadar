import type { SkillProfile } from "@/lib/skills/types";
import type { CvProfile } from "./types";

// Code below this strength is too faint to tell someone to put on their CV
const CODE_WORTH_LISTING = 40;

export interface CvCodeComparison {
    // On the CV and shown in code
    both: { id: string; name: string; strength: number; months: number }[];
    // Claimed on the CV, no repository shows it
    cvOnly: { id: string; name: string; months: number }[];
    // Established in code, missing from the CV
    codeOnly: { id: string; name: string; strength: number; repoCount: number }[];
}

export function compareCvWithCode(cv: CvProfile, profile: SkillProfile | null): CvCodeComparison {
    const code = new Map((profile?.technologies ?? []).map((t) => [t.id, t]));
    const onCv = new Set(cv.technologies.map((t) => t.id));
    return {
        both: cv.technologies
            .filter((t) => code.has(t.id))
            .map((t) => ({ id: t.id, name: t.name, strength: code.get(t.id)!.strength, months: t.months }))
            .sort((a, b) => b.strength - a.strength),
        cvOnly: cv.technologies.filter((t) => !code.has(t.id)).map((t) => ({ id: t.id, name: t.name, months: t.months })),
        codeOnly: (profile?.technologies ?? [])
            .filter((t) => !onCv.has(t.id) && t.strength >= CODE_WORTH_LISTING)
            .sort((a, b) => b.strength - a.strength)
            .map((t) => ({ id: t.id, name: t.name, strength: t.strength, repoCount: t.repoCount })),
    };
}
