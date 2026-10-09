import { describe, expect, it } from "vitest";
import { makeRepo, makeSnapshot } from "@/lib/skills/fixtures";
import { buildSkillProfile } from "@/lib/skills/profile";
import { compareCvWithCode } from "./compare";
import { parseCv } from "./parse";

const now = new Date("2026-10-08T12:00:00Z");

describe("compareCvWithCode", () => {
    const profile = buildSkillProfile(
        makeSnapshot([
            makeRepo({ name: "shop", deps: { npm: ["react", "typescript", "postgres"] } }),
            makeRepo({ name: "admin", deps: { npm: ["react", "typescript", "postgres"] } }),
        ]),
        now
    );
    const cv = parseCv("Experience\nEngineer, Parcel\n2021 – Present\nReact and Kubernetes", "cv.pdf", now);

    it("splits technologies into backed up, claimed and missing from the CV", () => {
        const result = compareCvWithCode(cv, profile);
        expect(result.both.map((t) => t.id)).toEqual(["react"]);
        expect(result.cvOnly.map((t) => t.id)).toEqual(["kubernetes"]);
        expect(result.codeOnly.map((t) => t.id)).toEqual(expect.arrayContaining(["typescript", "postgres"]));
        expect(result.codeOnly.map((t) => t.id)).not.toContain("react");
    });

    it("treats everything as a claim without a GitHub profile", () => {
        const result = compareCvWithCode(cv, null);
        expect(result.both).toEqual([]);
        expect(result.cvOnly).toHaveLength(2);
        expect(result.codeOnly).toEqual([]);
    });
});
