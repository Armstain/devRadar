"use client";

import { useCallback, useState } from "react";
import { flushSync } from "react-dom";
import { LAYOUT_COOKIE, type LayoutMode } from "@/components/app-shell/layout-mode";

// The chosen layout lives in a cookie so the server renders it on the first
// paint. Switching runs inside a view transition, so each nav item glides from
// the top bar into the sidebar (or back) instead of jumping.
export function useLayoutMode(initial: LayoutMode) {
    const [layout, setLayout] = useState<LayoutMode>(initial);

    const apply = useCallback((next: LayoutMode) => {
        document.cookie = `${LAYOUT_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
        if (!reduce && doc.startViewTransition) {
            doc.startViewTransition(() => flushSync(() => setLayout(next)));
        } else {
            setLayout(next);
        }
    }, []);

    const toggle = useCallback(() => apply(layout === "top" ? "side" : "top"), [apply, layout]);

    return { layout, toggle };
}

// ⌘ on Apple platforms, Ctrl elsewhere. Only call after hydration.
export function modKey(): string {
    if (typeof navigator === "undefined") return "⌘";
    return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl";
}
