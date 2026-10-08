// Shared by the server layout (to read the cookie) and the client shell.

export type LayoutMode = "top" | "side";

export const LAYOUT_COOKIE = "devradar-layout";

export function parseLayout(value: string | undefined | null): LayoutMode {
    return value === "side" ? "side" : "top";
}
