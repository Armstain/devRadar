import { serve } from "inngest/next";
import { inngest } from "@/server/jobs/client";
import { functions } from "@/server/jobs/functions";

// Inngest calls this endpoint to run jobs; requests are verified with
// INNGEST_SIGNING_KEY, so it's public in proxy.ts.
export const { GET, POST, PUT } = serve({ client: inngest, functions });
