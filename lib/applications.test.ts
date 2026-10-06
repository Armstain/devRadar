import { describe, expect, it } from "vitest";
import {
    applicationCreateSchema,
    applicationImportSchema,
    applicationUpdateSchema,
    objectIdSchema,
} from "./applications";

describe("applicationCreateSchema", () => {
    it("fills in defaults for optional fields", () => {
        expect(applicationCreateSchema.parse({ company: "Acme", position: "Engineer" })).toEqual({
            company: "Acme",
            position: "Engineer",
            status: "applied",
            link: "",
            notes: "",
        });
    });

    it("trims and requires company and position", () => {
        expect(applicationCreateSchema.safeParse({ company: "  ", position: "Engineer" }).success).toBe(false);
        expect(applicationCreateSchema.parse({ company: " Acme ", position: "Dev" }).company).toBe("Acme");
    });

    it("maps legacy status spellings to the current ones", () => {
        const parse = (status: string) =>
            applicationCreateSchema.parse({ company: "Acme", position: "Dev", status }).status;
        expect(parse("Interviewing")).toBe("in-progress");
        expect(parse("offered")).toBe("offer");
        expect(parse("")).toBe("applied");
        expect(parse("REJECTED")).toBe("rejected");
    });

    it("rejects unknown statuses", () => {
        expect(
            applicationCreateSchema.safeParse({ company: "Acme", position: "Dev", status: "ghosted" }).success
        ).toBe(false);
    });

    it("only accepts http(s) links", () => {
        const withLink = (link: string) =>
            applicationCreateSchema.safeParse({ company: "Acme", position: "Dev", link }).success;
        expect(withLink("https://jobs.example.com/123")).toBe(true);
        expect(withLink("")).toBe(true);
        expect(withLink("javascript:alert(1)")).toBe(false);
        expect(withLink("not a url")).toBe(false);
    });

    it("drops fields that are not part of an application", () => {
        const parsed = applicationCreateSchema.parse({
            company: "Acme",
            position: "Dev",
            userId: "someone-else",
            _id: "507f1f77bcf86cd799439011",
        });
        expect(parsed).not.toHaveProperty("userId");
        expect(parsed).not.toHaveProperty("_id");
    });
});

describe("applicationUpdateSchema", () => {
    it("accepts partial updates without applying create defaults", () => {
        expect(applicationUpdateSchema.parse({ notes: "Followed up" })).toEqual({ notes: "Followed up" });
    });

    it("strips fields a client must not change", () => {
        const parsed = applicationUpdateSchema.parse({ status: "offer", userId: "attacker", createdAt: "x" });
        expect(parsed).toEqual({ status: "offer" });
    });

    it("rejects an empty update", () => {
        expect(applicationUpdateSchema.safeParse({}).success).toBe(false);
        expect(applicationUpdateSchema.safeParse({ userId: "attacker" }).success).toBe(false);
    });
});

describe("applicationImportSchema", () => {
    it("rejects an empty list and more than 500 rows", () => {
        const row = { company: "Acme", position: "Dev" };
        expect(applicationImportSchema.safeParse({ applications: [] }).success).toBe(false);
        expect(applicationImportSchema.safeParse({ applications: Array(501).fill(row) }).success).toBe(false);
        expect(applicationImportSchema.safeParse({ applications: [row] }).success).toBe(true);
    });
});

describe("objectIdSchema", () => {
    it("accepts 24-character hex ids only", () => {
        expect(objectIdSchema.safeParse("507f1f77bcf86cd799439011").success).toBe(true);
        expect(objectIdSchema.safeParse("123").success).toBe(false);
        expect(objectIdSchema.safeParse("zzzzzzzzzzzzzzzzzzzzzzzz").success).toBe(false);
    });
});
