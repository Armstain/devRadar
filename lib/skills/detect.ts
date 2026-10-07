import { TECHNOLOGIES, type Ecosystem, type Technology } from "./catalog";
import { normalizePythonName } from "./manifests";
import type { SnapshotRepo } from "./types";

function wildcard(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`, "i");
}

interface CompiledTechnology {
    tech: Technology;
    deps: [Ecosystem, RegExp[]][];
    files: RegExp[];
    languages: Set<string>;
}

const COMPILED: CompiledTechnology[] = TECHNOLOGIES.map((tech) => ({
    tech,
    deps: Object.entries(tech.deps ?? {}).map(([ecosystem, names]) => [
        ecosystem as Ecosystem,
        names.map((name) => wildcard(ecosystem === "pypi" ? normalizePythonName(name) : name)),
    ]),
    files: (tech.files ?? []).map(wildcard),
    languages: new Set(tech.languages ?? []),
}));

// A language counts once it's a real part of the repository, not a stray
// script: at least 10% of its code (and 1 KB), or 50 KB outright.
export function significantLanguages(repo: Pick<SnapshotRepo, "languages">): string[] {
    const total = repo.languages.reduce((sum, l) => sum + l.bytes, 0);
    return repo.languages
        .filter((l) => (l.bytes >= 1_000 && l.bytes / Math.max(total, 1) >= 0.1) || l.bytes >= 50_000)
        .map((l) => l.name);
}

// Technology ids a repository shows evidence of, in catalog order.
export function detectTechnologies(repo: Pick<SnapshotRepo, "languages" | "deps" | "files">): string[] {
    const languages = new Set(significantLanguages(repo));
    const found: string[] = [];
    for (const { tech, deps, files, languages: techLanguages } of COMPILED) {
        const byDependency = deps.some(([ecosystem, patterns]) =>
            (repo.deps[ecosystem] ?? []).some((name) => patterns.some((pattern) => pattern.test(name)))
        );
        const byFile = files.length > 0 && repo.files.some((name) => files.some((pattern) => pattern.test(name)));
        const byLanguage = [...techLanguages].some((language) => languages.has(language));
        if (byDependency || byFile || byLanguage) found.push(tech.id);
    }
    return found;
}
