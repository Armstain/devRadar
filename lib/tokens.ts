// Instrument colour tokens. app/globals.css declares the same values as CSS
// variables (CSS can't import TypeScript); lib/tokens.test.ts keeps the two in
// sync. Used where literal colours are needed: Clerk's UI, the social image
// and the /design page.

export type ThemeName = "light" | "dark";

export const tokens = {
    light: {
        ground: "#f4f5f4",
        panel: "#fbfbfa",
        raised: "#eaecea",
        line: "#dadcdb",
        scope: "#d2d5d3",
        ink: "#141515",
        "ink-soft": "#3a3c3c",
        muted: "#5f6262",
        brand: "#00769e",
        "brand-ink": "#ffffff",
        warn: "#fab219",
        "warn-ink": "#8a5500",
        danger: "#b8312b",
    },
    dark: {
        ground: "#141413",
        panel: "#1b1c1b",
        raised: "#242625",
        line: "#2e302f",
        scope: "#333634",
        ink: "#ebecea",
        "ink-soft": "#c2c4c2",
        muted: "#8d908e",
        brand: "#2a9fc8",
        "brand-ink": "#0c1214",
        warn: "#fab219",
        "warn-ink": "#f5b544",
        danger: "#f07167",
    },
} as const satisfies Record<ThemeName, Record<string, string>>;

export type TokenName = keyof (typeof tokens)["light"];

export const tokenRoles: { name: TokenName; label: string; use: string; text: boolean }[] = [
    { name: "ground", label: "Ground", use: "Page background", text: false },
    { name: "panel", label: "Panel", use: "Set-apart surfaces", text: false },
    { name: "raised", label: "Raised", use: "Hover, tracks, chips", text: false },
    { name: "line", label: "Line", use: "Hairlines and borders", text: false },
    { name: "scope", label: "Scope", use: "Dial bezel and outer ring", text: false },
    { name: "ink", label: "Ink", use: "Primary text", text: true },
    { name: "ink-soft", label: "Ink soft", use: "Body copy", text: true },
    { name: "muted", label: "Muted", use: "Labels and secondary text", text: true },
    { name: "brand", label: "Petrol", use: "Your data and the next action", text: true },
    { name: "warn", label: "Warning", use: "Gap markers, always with an icon", text: false },
    { name: "warn-ink", label: "Warning text", use: "Words about a gap", text: true },
    { name: "danger", label: "Danger", use: "Failures and destructive actions", text: true },
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
