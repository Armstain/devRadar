import { getDb } from "@/server/db/client";
import { collectDueReminders } from "@/server/services/follow-ups";
import { pruneScans, SCAN_TTL_MS } from "@/server/services/github-scans";
import { findStaleSnapshots, syncGithubSnapshot } from "@/server/services/github-snapshots";
import { deleteUserData } from "@/server/services/users";
import { githubSyncRequested, inngest, userDeleted } from "./client";

// Runs after a Clerk account is deleted. Deleting the user row cascades to
// applications, events and the GitHub connection. Retried if the database is
// briefly unavailable; safe to repeat because deleting twice is a no-op.
export const deleteUserDataJob = inngest.createFunction(
    { id: "delete-user-data", triggers: [userDeleted], retries: 5 },
    async ({ event, step }) => {
        const deleted = await step.run("delete-user-rows", () => deleteUserData(getDb(), event.data.userId));
        return { userId: event.data.userId, deleted };
    }
);

// Reads the account's repositories from GitHub and stores a fresh snapshot.
// One sync per user at a time: a request while one is running is skipped,
// since the running sync already reads the latest state. The fetch and the
// save share a step so the (large) snapshot never passes through Inngest.
export const syncGithubJob = inngest.createFunction(
    {
        id: "sync-github",
        triggers: [githubSyncRequested],
        singleton: { key: "event.data.userId", mode: "skip" },
        retries: 3,
    },
    async ({ event, step }) => {
        return step.run("fetch-and-store-snapshot", () => syncGithubSnapshot(getDb(), event.data.userId));
    }
);

// Nightly: queue a sync for every snapshot older than a day, and drop public
// scans nobody has looked at for a week.
export const refreshGithubJob = inngest.createFunction(
    { id: "refresh-github-snapshots", triggers: [{ cron: "TZ=UTC 0 4 * * *" }] },
    async ({ step }) => {
        const stale = await step.run("find-stale-snapshots", () => findStaleSnapshots(getDb(), new Date(Date.now() - 86_400_000)));
        if (stale.length) {
            await step.sendEvent(
                "queue-syncs",
                stale.map((userId) => githubSyncRequested.create({ userId, reason: "scheduled" }))
            );
        }
        const pruned = await step.run("prune-public-scans", () => pruneScans(getDb(), new Date(Date.now() - 7 * SCAN_TTL_MS)));
        return { queued: stale.length, pruned };
    }
);

// Daily: record a reminder for every application that has gone quiet (or
// whose snooze ran out) since the last run. The app shows these as "new";
// an email digest can read the same rows later.
export const followUpRemindersJob = inngest.createFunction(
    { id: "collect-follow-up-reminders", triggers: [{ cron: "TZ=UTC 0 7 * * *" }] },
    async ({ step }) => {
        const created = await step.run("collect-due-reminders", () => collectDueReminders(getDb()));
        return { created };
    }
);

export const functions = [deleteUserDataJob, syncGithubJob, refreshGithubJob, followUpRemindersJob];
