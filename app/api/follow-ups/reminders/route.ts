import { authed, json } from "@/server/http";
import { listUnseenReminders, markRemindersSeen } from "@/server/services/follow-ups";

// Follow-ups that became due since the user last looked.
export const GET = authed("follow-ups.reminders", async (_request, { db, userId }) => {
    return json(await listUnseenReminders(db, userId));
});

// Marks them all as seen.
export const POST = authed("follow-ups.reminders.seen", async (_request, { db, userId }) => {
    return json({ seen: await markRemindersSeen(db, userId) });
});
