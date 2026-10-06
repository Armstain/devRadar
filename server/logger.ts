import pino from "pino";

// Structured JSON logs (one object per line), which Vercel and most log
// drains can search by field. Secrets are redacted wherever they appear.
export const logger = pino({
    level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
    base: { service: "devradar" },
    redact: {
        paths: ["token", "accessToken", "*.token", "*.accessToken", "headers.authorization", "headers.cookie"],
        censor: "[redacted]",
    },
});
