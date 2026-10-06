"use client";

import { useTheme } from "next-themes";
import { tokens } from "@/lib/tokens";

// Clerk's UI is loaded from its CDN and derives hover and shade colours from
// these values, so it gets literal colours rather than CSS variables.
function palette(theme: "light" | "dark") {
  const t = tokens[theme];
  return {
    colorPrimary: t.signal,
    colorPrimaryForeground: t["signal-ink"],
    colorBackground: t.panel,
    colorForeground: t.ink,
    colorMutedForeground: t.muted,
    colorInput: t.ground,
    colorInputForeground: t.ink,
    colorBorder: t.line,
    colorRing: t.signal,
    colorDanger: t.danger,
    colorNeutral: t.ink,
  };
}

export function useClerkAppearance() {
  const { resolvedTheme } = useTheme();
  return {
    variables: {
      ...palette(resolvedTheme === "light" ? "light" : "dark"),
      fontFamily: "var(--font-grotesk), ui-sans-serif, system-ui, sans-serif",
      borderRadius: "10px",
    },
  };
}
