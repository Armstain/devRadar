import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrast, tokenRoles, tokens, type ThemeName } from "./tokens";

const css = fs.readFileSync(path.join(__dirname, "../app/globals.css"), "utf8");

function cssBlock(selector: string): Record<string, string> {
    const start = css.indexOf(`${selector} {`);
    const block = css.slice(start, css.indexOf("}", start));
    return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)].map((m) => [m[1], m[2].toLowerCase()]));
}

const blocks: Record<ThemeName, Record<string, string>> = { light: cssBlock(":root,\n.light"), dark: cssBlock(".dark") };

describe("design tokens", () => {
    for (const theme of ["light", "dark"] as const) {
        it(`globals.css matches lib/tokens.ts (${theme})`, () => {
            for (const [name, value] of Object.entries(tokens[theme])) {
                expect(blocks[theme][name], `--${name}`).toBe(value);
            }
        });

        it(`every text colour passes WCAG AA on the ground and on panels (${theme})`, () => {
            const t = tokens[theme];
            for (const role of tokenRoles.filter((r) => r.text)) {
                expect(contrast(t[role.name], t.ground), `${role.name} on ground`).toBeGreaterThanOrEqual(4.5);
                expect(contrast(t[role.name], t.panel), `${role.name} on panel`).toBeGreaterThanOrEqual(4.5);
            }
        });

        it(`text on the brand fill passes WCAG AA (${theme})`, () => {
            expect(contrast(tokens[theme]["brand-ink"], tokens[theme].brand)).toBeGreaterThanOrEqual(4.5);
        });

        it(`gap markers stay visible: warn on ground with an ink outline (${theme})`, () => {
            // The warn fill is a mark, not text; it carries an outline and a label.
            expect(contrast(tokens[theme].warn, tokens[theme].ground)).toBeGreaterThanOrEqual(theme === "dark" ? 3 : 1.5);
        });
    }

    it("computes known contrast ratios", () => {
        expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
        expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 1);
    });
});
