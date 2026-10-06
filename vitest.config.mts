import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./", import.meta.url)),
        },
    },
    test: {
        environment: "node",
        include: ["**/*.test.ts"],
        exclude: ["node_modules/**", ".next/**"],
        // Database tests start an in-process Postgres (PGlite), which takes a
        // few seconds to boot.
        testTimeout: 30_000,
        hookTimeout: 30_000,
    },
});
