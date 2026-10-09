// Applies pending migrations: `npm run db:migrate` (needs DATABASE_URL).
// Vercel also runs this before every build (the "vercel-build" script), so a
// production deploy never ships code ahead of its schema. Preview deploys
// skip it: a branch's migration must not reach a shared database before the
// branch is merged.
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
    if (process.env.VERCEL && process.env.VERCEL_ENV !== "production") {
        console.log(`Skipping migrations on a ${process.env.VERCEL_ENV ?? "non-production"} deploy`);
        return;
    }
    // Prefer the direct connection Neon's Vercel integration provides; the
    // pooled one works too, without prepared statements.
    const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");

    const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
    try {
        await migrate(drizzle(client), { migrationsFolder: path.join(__dirname, "migrations") });
        console.log("Migrations applied");
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
