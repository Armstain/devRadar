import { describe, expect, it } from "vitest";
import { parseApplicationsCsv } from "./csv-import";

describe("parseApplicationsCsv", () => {
    it("maps common header spellings to application fields", () => {
        const csv = [
            "Company Name,Job Title,Status,URL,Comments",
            "Acme,Frontend Engineer,Interviewing,https://acme.dev/jobs/1,Referral",
        ].join("\n");

        expect(parseApplicationsCsv(csv)).toEqual({
            applications: [
                {
                    company: "Acme",
                    position: "Frontend Engineer",
                    status: "in-progress",
                    link: "https://acme.dev/jobs/1",
                    notes: "Referral",
                },
            ],
            totalRows: 1,
            skippedRows: [],
        });
    });

    it("defaults optional columns that are missing from the file", () => {
        const { applications } = parseApplicationsCsv("company,position\nAcme,Dev");
        expect(applications).toEqual([
            { company: "Acme", position: "Dev", status: "applied", link: "", notes: "" },
        ]);
    });

    it("reports missing required columns", () => {
        expect(parseApplicationsCsv("company,notes\nAcme,hi").error).toBe("Missing required columns: position");
    });

    it("skips invalid rows and reports their row numbers", () => {
        const csv = [
            "company,position,link",
            "Acme,Dev,https://acme.dev",
            ",Dev,",
            "Globex,Engineer,javascript:alert(1)",
            "Initech,SRE,",
        ].join("\n");

        const result = parseApplicationsCsv(csv);
        expect(result.applications.map((app) => app.company)).toEqual(["Acme", "Initech"]);
        expect(result.skippedRows).toEqual([2, 3]);
        expect(result.totalRows).toBe(4);
    });

    it("ignores blank lines", () => {
        const result = parseApplicationsCsv("company,position\n\nAcme,Dev\n   \n");
        expect(result.totalRows).toBe(1);
    });
});
