"use client";

// Sends a browser-side error to /api/client-errors so it lands in the server
// logs. Best effort: a failed report is ignored.
export function reportClientError(error: Error & { digest?: string }) {
    const body = JSON.stringify({
        message: String(error.message || error.name || "Unknown error").slice(0, 500),
        digest: error.digest?.slice(0, 100),
        path: window.location.pathname.slice(0, 300),
    });
    try {
        if (!navigator.sendBeacon?.("/api/client-errors", new Blob([body], { type: "application/json" }))) {
            void fetch("/api/client-errors", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
        }
    } catch {
        // Reporting must never throw from inside an error boundary
    }
}
