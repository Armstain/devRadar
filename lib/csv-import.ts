import Papa from "papaparse";
import { applicationCreateSchema, type ApplicationInput } from "@/lib/applications";

// Accepted header spellings for each field, compared after lowercasing and
// removing spaces, dashes and underscores.
const COLUMN_ALIASES: Record<keyof ApplicationInput, string[]> = {
    company: ["company", "companyname", "employer"],
    position: ["position", "jobtitle", "title", "role"],
    status: ["status", "stage"],
    link: ["link", "url", "joblink", "joburl"],
    notes: ["notes", "comments", "note"],
};

export interface CsvImportResult {
    applications: ApplicationInput[];
    totalRows: number;
    // 1-based row numbers (excluding the header) that failed validation
    skippedRows: number[];
    error?: string;
}

function normalizeHeader(header: string) {
    return header.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export function parseApplicationsCsv(text: string): CsvImportResult {
    const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: normalizeHeader,
    });

    const headers = parsed.meta.fields ?? [];
    const columns = Object.fromEntries(
        Object.entries(COLUMN_ALIASES).map(([field, aliases]) => [
            field,
            headers.find((header) => aliases.includes(header)),
        ])
    ) as Record<keyof ApplicationInput, string | undefined>;

    const missing = (["company", "position"] as const).filter((field) => !columns[field]);
    if (missing.length > 0) {
        return {
            applications: [],
            totalRows: parsed.data.length,
            skippedRows: [],
            error: `Missing required columns: ${missing.join(", ")}`,
        };
    }

    const applications: ApplicationInput[] = [];
    const skippedRows: number[] = [];

    parsed.data.forEach((row, index) => {
        const candidate = Object.fromEntries(
            Object.entries(columns)
                .filter(([, column]) => column !== undefined)
                .map(([field, column]) => [field, row[column!] ?? ""])
        );
        const result = applicationCreateSchema.safeParse(candidate);
        if (result.success) {
            applications.push(result.data);
        } else {
            skippedRows.push(index + 1);
        }
    });

    return { applications, totalRows: parsed.data.length, skippedRows };
}
