import { cvMentions, yearsAsked } from "@/lib/cv/parse";
import type { CvProfile, Seniority } from "@/lib/cv/types";
import { credit, verdictFor, WEIGHT, type FitResult, type RequirementFit } from "./score";

// The fit report with a CV alongside the code. Runs in the browser, because
// the CV never leaves it. Code evidence is never lowered: each requirement
// takes the better of what the code shows and what the CV says, and a CV
// claim earns less than code that proves it.

// Credit for a technology the CV mentions: more when it was used in roles,
// most when that covers the years the post asks for
const CV_LISTED = 0.4;
const CV_IN_ROLES = 0.55;
const CV_YEARS_MET = 0.7;
// Requirements code can never show (mentoring, a degree) count at half
// weight, and only when the CV covers them, so adding a CV never lowers the
// score
const SOFT_WEIGHT = 0.5;

export type CvStatus = "both" | "code" | "cv" | "neither";

export interface CvEvidence {
    found: boolean;
    detail: string;
    months: number;
    yearsAsked: number | null;
}

export interface CombinedRequirement extends RequirementFit {
    cv: CvEvidence;
    // Where the evidence comes from once the CV is counted
    source: CvStatus;
}

export interface CombinedFit {
    score: number | null;
    codeScore: number | null;
    verdict: FitResult["verdict"];
    requirements: CombinedRequirement[];
    cvOnly: number;
    experience: {
        totalMonths: number;
        seniority: Seniority | null;
        asked: Seniority | null;
        // How the CV's latest title compares with the post
        match: "meets" | "below" | "above" | null;
    };
}

const SENIORITY_ORDER: Seniority[] = ["intern", "junior", "mid", "senior", "staff", "lead", "principal"];

export const years = (months: number) => {
    const y = months / 12;
    return y < 1 ? `${Math.max(1, Math.round(months))} months` : `${Math.round(y * 2) / 2} year${y >= 1.25 ? "s" : ""}`;
};

function evidenceFor(r: RequirementFit, cv: CvProfile): CvEvidence {
    const asked = yearsAsked(`${r.skill} ${r.quote}`);
    if (r.technology) {
        const tech = cv.technologies.find((t) => t.id === r.technology!.id);
        if (!tech) return { found: false, detail: "Not on your CV", months: 0, yearsAsked: asked };
        const where = tech.roles.length ? ` in ${tech.roles.length === 1 ? tech.roles[0] : `${tech.roles.length} roles`}` : " in your skills";
        return { found: true, detail: `${tech.name}${tech.months ? `, about ${years(tech.months)}` : ""}${where}`, months: tech.months, yearsAsked: asked };
    }
    // Years of general experience ("5+ years of professional experience")
    if (asked !== null && /experience|professional|industry|engineering|development/i.test(`${r.skill} ${r.quote}`) && cv.totalMonths) {
        return { found: cv.totalMonths >= asked * 12, detail: `About ${years(cv.totalMonths)} of experience on your CV`, months: cv.totalMonths, yearsAsked: asked };
    }
    const line = cvMentions(cv.text, r.skill);
    return line ? { found: true, detail: `“${line}”`, months: 0, yearsAsked: asked } : { found: false, detail: "Not on your CV", months: 0, yearsAsked: asked };
}

function cvCredit(r: RequirementFit, e: CvEvidence): number {
    if (!e.found) return 0;
    if (!r.technology) return 1;
    if (e.yearsAsked !== null && e.months >= e.yearsAsked * 12) return CV_YEARS_MET;
    return e.months > 0 ? CV_IN_ROLES : CV_LISTED;
}

export function combineWithCv(fit: FitResult, cv: CvProfile, asked: Seniority | null): CombinedFit {
    let earned = 0;
    let possible = 0;
    let cvOnly = 0;

    const requirements = fit.requirements.map((r): CombinedRequirement => {
        const e = evidenceFor(r, cv);
        const code = r.status === "unverifiable" ? 0 : credit(r);
        const fromCv = cvCredit(r, e);
        const weight = r.status === "unverifiable" ? (e.found ? WEIGHT[r.importance] * SOFT_WEIGHT : 0) : WEIGHT[r.importance];
        possible += weight;
        earned += weight * Math.max(code, fromCv);

        const inCode = r.status === "strong" || r.status === "some";
        const source: CvStatus = inCode && e.found ? "both" : inCode ? "code" : e.found ? "cv" : "neither";
        if (source === "cv") cvOnly++;
        return { ...r, cv: e, source };
    });

    const score = possible > 0 ? Math.round((100 * earned) / possible) : null;
    const mine = cv.seniority;
    const match = !mine || !asked ? null : SENIORITY_ORDER.indexOf(mine) === SENIORITY_ORDER.indexOf(asked) ? "meets" : SENIORITY_ORDER.indexOf(mine) < SENIORITY_ORDER.indexOf(asked) ? "below" : "above";

    return {
        // A CV only ever adds evidence, so the combined score never drops below the code score
        score: score === null ? fit.score : Math.max(score, fit.score ?? 0),
        codeScore: fit.score,
        verdict: verdictFor(score === null ? fit.score : Math.max(score, fit.score ?? 0)),
        requirements,
        cvOnly,
        experience: { totalMonths: cv.totalMonths, seniority: mine, asked, match },
    };
}
