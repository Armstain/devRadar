"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

// Icons swap with the `dark` class, so nothing depends on the theme during
// server rendering and there's no hydration flicker.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle light and dark theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon className="dark:hidden" aria-hidden="true" />
      <Sun className="hidden dark:block" aria-hidden="true" />
    </Button>
  );
}
