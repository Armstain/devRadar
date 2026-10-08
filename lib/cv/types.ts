import type { JobExtraction } from "@/lib/job-posts";

export type Seniority = NonNullable<JobExtraction["seniority"]>;

export interface CvRole {
    title: string;
    company: string | null;
    // "YYYY-MM"; end is null for a current role
    start: string;
    end: string | null;
    months: number;
    // Catalog technology ids mentioned in this role
    technologies: string[];
}

export interface CvTechnology {
    id: string;
    name: string;
    // Time in roles that mention it (overlaps merged); 0 when it's only listed
    months: number;
    roles: string[];
}

// What DevRadar reads from a CV. Lives only in the browser (IndexedDB); the
// server never stores any of it.
export interface CvProfile {
    version: 1;
    fileName: string;
    readAt: string;
    // "ai" once the user has opted in to a Gemini read of the redacted text
    source: "local" | "ai";
    // Kept so soft requirements ("mentoring") can be looked up later
    text: string;
    roles: CvRole[];
    totalMonths: number;
    seniority: Seniority | null;
    technologies: CvTechnology[];
}
