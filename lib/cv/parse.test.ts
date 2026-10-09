import { describe, expect, it } from "vitest";
import { cvMentions, findDateRange, parseCv, redact, seniorityFromTitle, technologiesIn, yearsAsked } from "./parse";

const now = new Date("2026-10-08T12:00:00Z");

const CV = `Mara Okafor
Lisbon, Portugal · mara@example.com · +351 912 345 678 · github.com/mara-okafor

Summary
Frontend engineer who likes fast, accessible interfaces. Mentored three junior developers.

Experience
Senior Frontend Engineer, Parcel
Jan 2023 – Present
- Rebuilt the merchant dashboard in React and TypeScript with Next.js
- Moved CI to GitHub Actions; mentored two engineers

Lumen Labs | Frontend Developer | 03/2020 - 12/2022
- Built a design system in React with Storybook and Tailwind CSS
- Wrote end-to-end tests with Playwright

Junior Web Developer at Halcyon Health
2018 - 2020
Maintained Rails and PostgreSQL services.

Education
BSc Computer Science, University of Porto, 2014 - 2018

Skills
Languages: TypeScript, JavaScript, Go, Python
Tools: Docker, Kubernetes, GraphQL`;

describe("parseCv", () => {
    const cv = parseCv(CV, "mara.pdf", now);

    it("finds each role with its dates, ignoring education", () => {
        expect(cv.roles.map((r) => [r.title, r.company, r.start, r.end])).toEqual([
            ["Senior Frontend Engineer", "Parcel", "2023-01", null],
            ["Frontend Developer", "Lumen Labs", "2020-03", "2022-12"],
            ["Junior Web Developer", "Halcyon Health", "2018-06", "2020-06"],
        ]);
    });

    it("counts total experience with overlapping roles merged", () => {
        // Jun 2018 – Oct 2026; the 2020 overlap is counted once
        expect(cv.totalMonths).toBe(101);
        expect(cv.seniority).toBe("senior");
    });

    it("credits each technology with the time spent in roles that mention it", () => {
        const tech = (id: string) => cv.technologies.find((t) => t.id === id);
        expect(tech("react")?.months).toBe(46 + 34);
        expect(tech("react")?.roles).toEqual(["Senior Frontend Engineer", "Frontend Developer"]);
        expect(tech("postgres")?.months).toBe(25);
        // Listed under skills, but in no role
        expect(tech("kubernetes")).toMatchObject({ months: 0, roles: [] });
        expect(tech("go")).toBeDefined();
    });
});

describe("helpers", () => {
    it("reads common date range formats", () => {
        expect(findDateRange("Sept 2019 to June 2021", now)).toMatchObject({ start: { y: 2019, m: 9 }, end: { y: 2021, m: 6 } });
        expect(findDateRange("05/2021 – current", now)).toMatchObject({ start: { y: 2021, m: 5 }, end: null });
        expect(findDateRange("Shipped 3 products in 2 years", now)).toBeNull();
        expect(findDateRange("2030 - Present", now)).toBeNull();
    });

    it("only counts short names when they're listed", () => {
        expect(technologiesIn("Languages: Go, Rust")).toEqual(expect.arrayContaining(["go", "rust"]));
        expect(technologiesIn("Ready to go the extra mile")).not.toContain("go");
    });

    it("maps titles to seniority", () => {
        expect(["Software Engineering Intern", "Junior Developer", "Software Engineer", "Sr. Engineer", "Staff Engineer", "Engineering Manager", "Principal Engineer"].map(seniorityFromTitle)).toEqual([
            "intern",
            "junior",
            "mid",
            "senior",
            "staff",
            "lead",
            "principal",
        ]);
    });

    it("finds soft requirements in the CV text", () => {
        expect(cvMentions(CV, "Mentoring")).toMatch(/Mentored three junior developers/);
        expect(cvMentions(CV, "Degree in Computer Science")).toMatch(/Computer Science/);
        expect(cvMentions(CV, "Public speaking")).toBeNull();
    });

    it("reads years from a requirement", () => {
        expect(yearsAsked("5+ years building web applications")).toBe(5);
        expect(yearsAsked("3 or more years of TypeScript")).toBe(3);
        expect(yearsAsked("Experience with React")).toBeNull();
    });

    it("redacts what identifies the person, but keeps dates", () => {
        const out = redact(CV);
        expect(out).not.toMatch(/Mara Okafor|mara@example\.com|912 345 678|github\.com\/mara|Lisbon/);
        expect(out).toContain("[contact details]");
        expect(out).toMatch(/^\[name\]/);
        expect(out).toContain("2018 - 2020");
        expect(out).toContain("Senior Frontend Engineer, Parcel");
    });
});
