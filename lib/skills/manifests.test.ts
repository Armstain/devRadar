import { describe, expect, it } from "vitest";
import {
    parseCargoToml,
    parseComposerJson,
    parseGemfile,
    parseGoMod,
    parseGradle,
    parseManifests,
    parsePackageJson,
    parsePipfile,
    parsePom,
    parsePyproject,
    parseRequirements,
} from "./manifests";

describe("manifest parsers", () => {
    it("reads every dependency field of package.json and ignores malformed JSON", () => {
        const pkg = JSON.stringify({
            dependencies: { next: "16.0.0", react: "19.0.0" },
            devDependencies: { vitest: "5.0.0" },
            peerDependencies: { react: "*" },
        });
        expect(parsePackageJson(pkg)).toEqual(["next", "react", "vitest"]);
        expect(parsePackageJson("{ not json")).toEqual([]);
        expect(parsePackageJson("[]")).toEqual([]);
    });

    it("normalises Python requirement names and skips options and comments", () => {
        const text = ["# web", "Django[argon2]>=4.2 ; python_version > '3.8'", "-r base.txt", "psycopg2_binary==2.9", "", "Flask"].join("\n");
        expect(parseRequirements(text)).toEqual(["django", "flask", "psycopg2-binary"]);
    });

    it("reads PEP 621, dependency groups and Poetry tables from pyproject.toml", () => {
        const text = `
[project]
name = "api"
dependencies = [
  "fastapi>=0.110",
  "SQLAlchemy[asyncio]",
]

[project.optional-dependencies]
dev = ["pytest", "ruff"]

[dependency-groups]
lint = ["mypy"]

[tool.poetry.dependencies]
python = "^3.12"
celery = "^5"

[tool.poetry.group.test.dependencies]
hypothesis = "*"
`;
        expect(parsePyproject(text)).toEqual(["celery", "fastapi", "hypothesis", "mypy", "pytest", "ruff", "sqlalchemy"]);
    });

    it("reads Pipfile packages", () => {
        expect(parsePipfile('[packages]\nrequests = "*"\n\n[dev-packages]\nBlack = "*"\n')).toEqual(["black", "requests"]);
    });

    it("reads Cargo dependencies, including table-style entries", () => {
        const text = `
[package]
name = "svc"

[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }

[dev-dependencies]
insta = "1"

[dependencies.serde]
version = "1"
`;
        expect(parseCargoToml(text)).toEqual(["axum", "insta", "serde", "tokio"]);
    });

    it("reads single-line and block requires from go.mod", () => {
        const text = `module example.com/api

go 1.23

require github.com/gin-gonic/gin v1.10.0

require (
\tgithub.com/jackc/pgx/v5 v5.6.0
\tgolang.org/x/sync v0.8.0 // indirect
)
`;
        expect(parseGoMod(text)).toEqual(["github.com/gin-gonic/gin", "github.com/jackc/pgx/v5", "golang.org/x/sync"]);
    });

    it("reads Gemfile, composer.json, pom.xml and Gradle coordinates", () => {
        expect(parseGemfile("source 'https://rubygems.org'\ngem 'rails', '~> 7.1'\n  gem \"sidekiq\"\n")).toEqual(["rails", "sidekiq"]);
        expect(parseComposerJson(JSON.stringify({ require: { php: "^8.2", "laravel/framework": "^11" } }))).toEqual(["laravel/framework"]);
        expect(
            parsePom(`<project><parent><artifactId>ignored-parent</artifactId></parent><dependencies>
              <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
            </dependencies></project>`)
        ).toEqual(["spring-boot-starter-web"]);
        expect(parseGradle(`implementation("org.springframework.boot:spring-boot-starter-web")\ntestImplementation 'junit:junit:4.13'`)).toEqual([
            "junit",
            "spring-boot-starter-web",
        ]);
    });

    it("merges manifests into dependencies per ecosystem", () => {
        expect(
            parseManifests({
                packageJson: JSON.stringify({ dependencies: { express: "4" } }),
                requirements: "pandas\n",
                pyproject: '[project]\ndependencies = ["numpy"]\n',
                goMod: null,
            })
        ).toEqual({ npm: ["express"], pypi: ["numpy", "pandas"] });
    });
});
