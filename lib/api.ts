import { NextResponse } from "next/server";
import { z } from "zod";

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
    return NextResponse.json(
        { error: "Invalid request", issues: z.flattenError(error) },
        { status: 400 }
    );
}
