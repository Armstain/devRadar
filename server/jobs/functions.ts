import { getDb } from "@/server/db/client";
import { deleteUserData } from "@/server/services/users";
import { inngest, userDeleted } from "./client";

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

export const functions = [deleteUserDataJob];
