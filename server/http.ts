import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getDb, type Database } from "@/server/db/client";
import { logger } from "@/server/logger";

export function json<T>(body: T, init?: number | ResponseInit) {
    return NextResponse.json(body, typeof init === "number" ? { status: init } : init);
}

export function errorResponse(message: string, status: number, headers?: HeadersInit) {
    return NextResponse.json({ error: message }, { status, headers });
}

// Parses a JSON body, returning undefined instead of throwing on invalid JSON
// so the schema check reports it as a 400 rather than a 500.
export async function readJson(request: Request): Promise<unknown> {
    try {
        return await request.json();
    } catch {
        return undefined;
    }
}

export function validationError(error: z.ZodError) {
    return NextResponse.json({ error: "Invalid request", issues: z.flattenError(error) }, { status: 400 });
}

export interface RouteContext<P> {
    userId: string;
    db: Database;
    params: P;
    log: typeof logger;
}

// Wraps a route handler with authentication, a database handle, a per-request
// logger and a single place that turns unexpected errors into a 500.
export function authed<P = Record<string, never>>(
    name: string,
    handler: (request: Request, context: RouteContext<P>) => Promise<Response>
) {
    return async (request: Request, context: { params: Promise<P> }) => {
        const { userId } = await auth();
        if (!userId) return errorResponse("Unauthorized", 401);

        const requestId = request.headers.get("x-request-id") ?? randomUUID();
        const log = logger.child({ route: name, requestId, userId });
        const started = performance.now();
        try {
            const response = await handler(request, { userId, db: getDb(), params: await context.params, log });
            log.debug({ status: response.status, ms: Math.round(performance.now() - started) }, "request handled");
            response.headers.set("x-request-id", requestId);
            return response;
        } catch (error) {
            log.error({ err: error, ms: Math.round(performance.now() - started) }, "unhandled route error");
            return NextResponse.json({ error: "Something went wrong", requestId }, { status: 500, headers: { "x-request-id": requestId } });
        }
    };
}
