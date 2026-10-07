import type { Ecosystem } from "./catalog";

// Dependency manifests, parsed just enough to list package names. Parsers
// never throw: a malformed manifest contributes nothing rather than failing
// the whole sync.

export interface Manifests {
    packageJson?: string | null;
    requirements?: string | null;
    pyproject?: string | null;
    pipfile?: string | null;
    goMod?: string | null;
    cargo?: string | null;
    gemfile?: string | null;
    composer?: string | null;
    pom?: string | null;
    gradle?: string | null;
}

const unique = (names: Iterable<string>) => [...new Set([...names].filter(Boolean))].sort();

function jsonKeys(text: string, fields: string[]): string[] {
    try {
        const parsed: unknown = JSON.parse(text);
        if (!parsed || typeof parsed !== "object") return [];
        return fields.flatMap((field) => {
            const value = (parsed as Record<string, unknown>)[field];
            return value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value) : [];
        });
    } catch {
        return [];
    }
}

export function parsePackageJson(text: string): string[] {
    return unique(jsonKeys(text, ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]));
}

export function parseComposerJson(text: string): string[] {
    return unique(jsonKeys(text, ["require", "require-dev"]).filter((name) => name.includes("/")));
}

// PEP 503 normalisation: case-insensitive, runs of -_. are equivalent.
export const normalizePythonName = (name: string) => name.toLowerCase().replace(/[-_.]+/g, "-");

// "Django[argon2]>=4.2; python_version>'3.8'" → "django"
function pythonRequirementName(line: string): string | null {
    const match = /^\s*([A-Za-z0-9][A-Za-z0-9._-]*)/.exec(line);
    return match ? normalizePythonName(match[1]) : null;
}

export function parseRequirements(text: string): string[] {
    return unique(
        text
            .split(/\r?\n/)
            .map((line) => line.replace(/#.*/, "").trim())
            .filter((line) => line && !line.startsWith("-"))
            .map(pythonRequirementName)
            .filter((name): name is string => name !== null)
    );
}

// Tables are `[section]` headers; returns the lines under each one.
function tomlSections(text: string): Map<string, string[]> {
    const sections = new Map<string, string[]>([["", []]]);
    let current = "";
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.replace(/(^|\s)#.*$/, "").trimEnd();
        const header = /^\s*\[\[?\s*([^\]]+?)\s*\]\]?\s*$/.exec(line);
        if (header) {
            current = header[1];
            if (!sections.has(current)) sections.set(current, []);
            continue;
        }
        sections.get(current)!.push(line);
    }
    return sections;
}

// `name = …` keys of a TOML table
const tomlKeys = (lines: string[]) =>
    lines.map((line) => /^\s*"?([A-Za-z0-9][A-Za-z0-9._-]*)"?\s*=/.exec(line)?.[1]).filter((key): key is string => Boolean(key));

// Quoted strings inside `key = [ … ]` arrays, which may span lines and hold
// brackets inside strings ("sqlalchemy[asyncio]").
function tomlArrayStrings(lines: string[], key: RegExp): string[] {
    const body = lines.join("\n");
    const values: string[] = [];
    const pattern = new RegExp(`^\\s*${key.source}\\s*=\\s*\\[`, "gm");
    for (const match of body.matchAll(pattern)) {
        let quote: string | null = null;
        let current = "";
        for (let i = match.index + match[0].length; i < body.length; i++) {
            const ch = body[i];
            if (quote) {
                if (ch === quote) {
                    values.push(current);
                    quote = null;
                    current = "";
                } else current += ch;
            } else if (ch === '"' || ch === "'") quote = ch;
            else if (ch === "]") break;
        }
    }
    return values;
}

export function parsePyproject(text: string): string[] {
    const sections = tomlSections(text);
    const names: string[] = [];
    // PEP 621
    names.push(...tomlArrayStrings(sections.get("project") ?? [], /dependencies/));
    for (const line of sections.get("project.optional-dependencies") ?? []) {
        for (const quoted of line.matchAll(/["']([^"']+)["']/g)) names.push(quoted[1]);
    }
    // PEP 735 dependency groups
    names.push(...tomlArrayStrings(sections.get("dependency-groups") ?? [], /[A-Za-z0-9_-]+/));
    // Poetry
    for (const [section, lines] of sections) {
        if (/^tool\.poetry\.(dev-)?dependencies$|^tool\.poetry\.group\.[^.]+\.dependencies$/.test(section)) {
            names.push(...tomlKeys(lines).filter((key) => key !== "python"));
        }
    }
    return unique(names.map(pythonRequirementName).filter((name): name is string => name !== null));
}

export function parsePipfile(text: string): string[] {
    const sections = tomlSections(text);
    const keys = [...(sections.get("packages") ?? []), ...(sections.get("dev-packages") ?? [])];
    return unique(tomlKeys(keys).map(normalizePythonName));
}

export function parseCargoToml(text: string): string[] {
    const names: string[] = [];
    for (const [section, lines] of tomlSections(text)) {
        if (/(^|\.)(dev-|build-)?dependencies$/.test(section)) names.push(...tomlKeys(lines));
        // [dependencies.serde] style tables
        const nested = /(?:^|\.)(?:dev-|build-)?dependencies\.([A-Za-z0-9_-]+)$/.exec(section);
        if (nested) names.push(nested[1]);
    }
    return unique(names);
}

export function parseGoMod(text: string): string[] {
    const names: string[] = [];
    let inBlock = false;
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.replace(/\/\/.*$/, "").trim();
        if (/^require\s*\($/.test(line)) {
            inBlock = true;
            continue;
        }
        if (inBlock && line === ")") {
            inBlock = false;
            continue;
        }
        const single = /^require\s+(\S+)\s+\S+/.exec(line);
        if (single) names.push(single[1]);
        else if (inBlock) {
            const entry = /^(\S+)\s+v\S+/.exec(line);
            if (entry) names.push(entry[1]);
        }
    }
    return unique(names);
}

export function parseGemfile(text: string): string[] {
    return unique([...text.matchAll(/^\s*gem\s+["']([^"']+)["']/gm)].map((match) => match[1]));
}

// Maven artifactIds from <dependency> and <plugin> entries
export function parsePom(text: string): string[] {
    const blocks = text.match(/<(dependency|plugin)>[\s\S]*?<\/\1>/g) ?? [];
    return unique(blocks.map((block) => /<artifactId>\s*([^<\s]+)\s*<\/artifactId>/.exec(block)?.[1] ?? ""));
}

// Gradle "group:artifact:version" coordinates → artifact
export function parseGradle(text: string): string[] {
    return unique([...text.matchAll(/["']([\w.-]+):([\w.-]+)(?::[^"']*)?["']/g)].map((match) => match[2]));
}

export function parseManifests(manifests: Manifests): Partial<Record<Ecosystem, string[]>> {
    const deps: Partial<Record<Ecosystem, string[]>> = {};
    const add = (ecosystem: Ecosystem, names: string[]) => {
        if (!names.length) return;
        deps[ecosystem] = unique([...(deps[ecosystem] ?? []), ...names]);
    };
    if (manifests.packageJson) add("npm", parsePackageJson(manifests.packageJson));
    if (manifests.requirements) add("pypi", parseRequirements(manifests.requirements));
    if (manifests.pyproject) add("pypi", parsePyproject(manifests.pyproject));
    if (manifests.pipfile) add("pypi", parsePipfile(manifests.pipfile));
    if (manifests.goMod) add("go", parseGoMod(manifests.goMod));
    if (manifests.cargo) add("cargo", parseCargoToml(manifests.cargo));
    if (manifests.gemfile) add("gem", parseGemfile(manifests.gemfile));
    if (manifests.composer) add("composer", parseComposerJson(manifests.composer));
    if (manifests.pom) add("maven", parsePom(manifests.pom));
    if (manifests.gradle) add("maven", parseGradle(manifests.gradle));
    return deps;
}
