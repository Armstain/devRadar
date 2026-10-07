import { relations } from "drizzle-orm";
import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { APPLICATION_STATUSES } from "@/lib/applications";
import type { JobExtraction } from "@/lib/job-posts";
import type { GithubSnapshot } from "@/lib/skills/types";

const timestamps = {
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const applicationStatus = pgEnum("application_status", APPLICATION_STATUSES);

export const applicationEventType = pgEnum("application_event_type", ["created", "status_changed"]);

// One row per Clerk user, created on first use. Deleting it cascades to all
// of the user's data (see the Clerk webhook).
export const users = pgTable("users", {
    id: text("id").primaryKey(),
    createdAt: timestamps.createdAt,
});

export const githubConnections = pgTable("github_connections", {
    userId: text("user_id")
        .primaryKey()
        .references(() => users.id, { onDelete: "cascade" }),
    username: text("username").notNull(),
    // AES-256-GCM encrypted, see lib/crypto.ts
    accessToken: text("access_token").notNull(),
    scopes: text("scopes").notNull().default(""),
    ...timestamps,
});

export const githubSyncStatus = pgEnum("github_sync_status", ["queued", "syncing", "ready", "failed"]);

// The latest GitHub sync for a connected account. Page views read this row
// and never call GitHub; a background job refreshes it. Disconnecting GitHub
// deletes it, since it may include private repositories.
export const githubSnapshots = pgTable("github_snapshots", {
    userId: text("user_id")
        .primaryKey()
        .references(() => githubConnections.userId, { onDelete: "cascade" }),
    status: githubSyncStatus("status").notNull().default("queued"),
    data: jsonb("data").$type<GithubSnapshot>(),
    error: text("error"),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    ...timestamps,
});

// Public-repository scans of any GitHub username (the landing page), cached
// so repeat visits and shared links don't spend GitHub rate limit.
export const githubScans = pgTable(
    "github_scans",
    {
        // Lowercase GitHub login
        login: text("login").primaryKey(),
        data: jsonb("data").$type<GithubSnapshot>().notNull(),
        scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [index("github_scans_scanned_idx").on(t.scannedAt)]
);

export const applications = pgTable(
    "applications",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        company: text("company").notNull(),
        position: text("position").notNull(),
        status: applicationStatus("status").notNull().default("applied"),
        link: text("link").notNull().default(""),
        notes: text("notes").notNull().default(""),
        ...timestamps,
    },
    (t) => [index("applications_user_updated_idx").on(t.userId, t.updatedAt.desc())]
);

// Append-only history of each application, used for its timeline and for
// stage analytics.
export const applicationEvents = pgTable(
    "application_events",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        applicationId: uuid("application_id")
            .notNull()
            .references(() => applications.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: applicationEventType("type").notNull(),
        fromStatus: applicationStatus("from_status"),
        toStatus: applicationStatus("to_status"),
        createdAt: timestamps.createdAt,
    },
    (t) => [index("application_events_application_idx").on(t.applicationId, t.createdAt)]
);

// A pasted job post and what the model extracted from it. The fit score
// isn't stored: it's computed from the extraction and the current skill
// profile on every read, so it follows the profile as it changes.
export const jobPosts = pgTable(
    "job_posts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        // Set once the post is saved to the pipeline
        applicationId: uuid("application_id")
            .unique()
            .references(() => applications.id, { onDelete: "set null" }),
        url: text("url").notNull().default(""),
        text: text("text").notNull(),
        extraction: jsonb("extraction").$type<JobExtraction>().notNull(),
        model: text("model").notNull(),
        // Generated interview prep for this role (markdown), kept so it isn't
        // regenerated on every visit
        prep: text("prep"),
        createdAt: timestamps.createdAt,
    },
    (t) => [index("job_posts_user_created_idx").on(t.userId, t.createdAt.desc())]
);

export const applicationsRelations = relations(applications, ({ many }) => ({
    events: many(applicationEvents),
}));

export const applicationEventsRelations = relations(applicationEvents, ({ one }) => ({
    application: one(applications, { fields: [applicationEvents.applicationId], references: [applications.id] }),
}));

export type ApplicationRow = typeof applications.$inferSelect;
export type ApplicationEventRow = typeof applicationEvents.$inferSelect;
export type JobPostRow = typeof jobPosts.$inferSelect;
export type GithubSnapshotRow = typeof githubSnapshots.$inferSelect;
