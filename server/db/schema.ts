import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { APPLICATION_STATUSES } from "@/lib/applications";

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

export const applicationsRelations = relations(applications, ({ many }) => ({
    events: many(applicationEvents),
}));

export const applicationEventsRelations = relations(applicationEvents, ({ one }) => ({
    application: one(applications, { fields: [applicationEvents.applicationId], references: [applications.id] }),
}));

export type ApplicationRow = typeof applications.$inferSelect;
export type ApplicationEventRow = typeof applicationEvents.$inferSelect;
