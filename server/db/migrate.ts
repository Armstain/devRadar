// Applies pending migrations: `npm run db:migrate` (needs DATABASE_URL).
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");

    // Migrations need a direct (non-pooled) connection.
    const client = postgres(url, { max: 1 });
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
