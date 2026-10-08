import { z } from "zod";

export const APPLICATION_STATUSES = ["applied", "in-progress", "offer", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
    applied: "Applied",
    "in-progress": "In progress",
    offer: "Offer",
    rejected: "Rejected",
};

// Older records and CSV files use other spellings for the same statuses.
const STATUS_ALIASES: Record<string, ApplicationStatus> = {
    "": "applied",
    interviewing: "in-progress",
    interview: "in-progress",
    "in progress": "in-progress",
    offered: "offer",
};

export function normalizeStatus(value: unknown): unknown {
    if (typeof value !== "string") return value;
    const normalized = value.trim().toLowerCase();
    return STATUS_ALIASES[normalized] ?? normalized;
}

const statusSchema = z.preprocess(normalizeStatus, z.enum(APPLICATION_STATUSES));

// Only http(s) links, so a stored link can never become a javascript: URL.
const linkSchema = z.union([
    z.literal(""),
    z.url({ protocol: /^https?$/, error: "Link must be an http(s) URL" }),
]);

const fields = {
    company: z.string().trim().min(1, "Company is required").max(200),
    position: z.string().trim().min(1, "Role is required").max(200),
    status: statusSchema,
    link: z.string().trim().pipe(linkSchema),
    notes: z.string().max(5000),
};

export const applicationCreateSchema = z.object({
    ...fields,
    status: fields.status.default("applied"),
    link: fields.link.default(""),
    notes: fields.notes.default(""),
});

export const applicationUpdateSchema = z
    .object(fields)
    .partial()
    .refine((data) => Object.keys(data).length > 0, "Nothing to update");

export const applicationImportSchema = z.object({
    applications: z.array(applicationCreateSchema).min(1).max(500),
});

export const uuidSchema = z.uuid({ error: "Invalid id" });

export const SNOOZE_DAYS = [3, 7, 14] as const;

// "I followed up" restarts the quiet clock; a snooze holds the reminder back
// for a few days without pretending anything happened.
export const followUpActionSchema = z.discriminatedUnion("action", [
    z.object({ action: z.literal("followed-up") }),
    z.object({
        action: z.literal("snooze"),
        days: z.literal(SNOOZE_DAYS),
    }),
]);

export type FollowUpAction = z.infer<typeof followUpActionSchema>;

export type ApplicationInput = z.infer<typeof applicationCreateSchema>;
export type ApplicationUpdate = z.infer<typeof applicationUpdateSchema>;

export interface Application extends ApplicationInput {
    id: string;
    followedUpAt: string | null;
    snoozedUntil: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ApplicationEvent {
    id: string;
    type: "created" | "status_changed" | "followed_up" | "snoozed";
    fromStatus: ApplicationStatus | null;
    toStatus: ApplicationStatus | null;
    createdAt: string;
}

export interface ApplicationWithEvents extends Application {
    events: ApplicationEvent[];
    // The analysed job post it was created from, if any
    jobPostId: string | null;
}
