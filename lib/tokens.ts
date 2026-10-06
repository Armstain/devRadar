// Signal colour tokens. app/globals.css declares the same values as CSS
// variables (CSS can't import TypeScript); lib/tokens.test.ts keeps the two in
// sync. Used where literal colours are needed: Clerk's UI and the /design page.

export type ThemeName = "light" | "dark";

export const tokens = {
    light: {
        ground: "#f4f5f2",
        panel: "#ffffff",
        raised: "#eceeeb",
        line: "#dadfda",
        ink: "#0e1310",
        muted: "#545f58",
        signal: "#0b7a4e",
        "signal-ink": "#ffffff",
        caution: "#9a5b00",
        danger: "#b42318",
    },
    dark: {
        ground: "#0a0d0b",
        panel: "#111512",
        raised: "#1a201c",
        line: "#232a26",
        ink: "#e6ebe7",
        muted: "#8e9a93",
        signal: "#3ddc97",
        "signal-ink": "#03130b",
        caution: "#f5a524",
        danger: "#f97066",
    },
} as const satisfies Record<ThemeName, Record<string, string>>;

export type TokenName = keyof (typeof tokens)["light"];

export const tokenRoles: { name: TokenName; label: string; use: string; text: boolean }[] = [
    { name: "ground", label: "Ground", use: "Page background", text: false },
    { name: "panel", label: "Panel", use: "Cards and dialogs", text: false },
    { name: "raised", label: "Raised", use: "Hover, chips, tracks", text: false },
    { name: "line", label: "Line", use: "Borders and dividers", text: false },
    { name: "ink", label: "Ink", use: "Primary text", text: true },
    { name: "muted", label: "Muted", use: "Secondary text", text: true },
    { name: "signal", label: "Signal", use: "The one thing that matters now", text: true },
    { name: "caution", label: "Caution", use: "Gaps and overdue items", text: true },
    { name: "danger", label: "Danger", use: "Destructive actions", text: true },
];

function luminance(hex: string): number {
    const [r, g, b] = [1, 3, 5].map((i) => {
        const v = parseInt(hex.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG 2.x contrast ratio between two hex colours.
export function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}
