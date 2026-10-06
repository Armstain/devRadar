import type { Instrumentation } from "next";

// Logs every unhandled server error (pages, routes, server actions) as a
// structured event with the route and request path.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    const { logger } = await import("@/server/logger");
    logger.error(
        {
            err: error,
            path: request.path,
            method: request.method,
            routePath: context.routePath,
            routeType: context.routeType,
        },
        "unhandled request error"
    );
};
