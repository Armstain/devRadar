// The technologies DevRadar can recognise, and how. Detection is
// deliberately evidence-based: a technology only counts when a repository
// declares it (a dependency in a manifest, a config file at the root, or a
// meaningful share of its code), never because of a name or a topic tag.

export const SKILL_AREAS = [
    { id: "frontend", label: "Frontend", description: "UI frameworks, styling, mobile and desktop clients" },
    { id: "backend", label: "Backend", description: "Servers, APIs, auth, payments and background work" },
    { id: "data", label: "Data", description: "Databases, ORMs, caches, streams and analysis" },
    { id: "devops", label: "DevOps", description: "Containers, CI/CD, cloud and observability" },
    { id: "testing", label: "Quality", description: "Tests, end-to-end suites, linting and type checking" },
    { id: "ai", label: "AI / ML", description: "LLM APIs, agents, model training and vector search" },
] as const;

export type SkillAreaId = (typeof SKILL_AREAS)[number]["id"];

export type Ecosystem = "npm" | "pypi" | "go" | "cargo" | "gem" | "composer" | "maven";

export interface Technology {
    id: string;
    name: string;
    // Languages without a clear area (TypeScript, Python…) still show up in
    // the language breakdown but don't move the radar.
    area: SkillAreaId | null;
    kind: "language" | "framework" | "tool";
    // Dependency names per ecosystem. A trailing `*` matches a prefix, so
    // "@nestjs/*" matches every NestJS package.
    deps?: Partial<Record<Ecosystem, string[]>>;
    // Names at the repository root (files or folders). `*` is a wildcard.
    files?: string[];
    // GitHub linguist language names.
    languages?: string[];
    // Other names people use in job posts, for matching against them later.
    aliases?: string[];
}

const t = (tech: Technology) => tech;

export const TECHNOLOGIES: Technology[] = [
    // Languages
    t({ id: "typescript", name: "TypeScript", area: null, kind: "language", languages: ["TypeScript"], deps: { npm: ["typescript"] }, aliases: ["ts"] }),
    t({ id: "javascript", name: "JavaScript", area: null, kind: "language", languages: ["JavaScript"], aliases: ["js", "es6", "ecmascript"] }),
    t({ id: "python", name: "Python", area: null, kind: "language", languages: ["Python"] }),
    t({ id: "go", name: "Go", area: "backend", kind: "language", languages: ["Go"], aliases: ["golang"] }),
    t({ id: "rust", name: "Rust", area: "backend", kind: "language", languages: ["Rust"] }),
    t({ id: "java", name: "Java", area: "backend", kind: "language", languages: ["Java"] }),
    t({ id: "kotlin", name: "Kotlin", area: null, kind: "language", languages: ["Kotlin"] }),
    t({ id: "csharp", name: "C#", area: "backend", kind: "language", languages: ["C#"], aliases: [".net", "dotnet", "asp.net"] }),
    t({ id: "ruby", name: "Ruby", area: "backend", kind: "language", languages: ["Ruby"] }),
    t({ id: "php", name: "PHP", area: "backend", kind: "language", languages: ["PHP"] }),
    t({ id: "elixir", name: "Elixir", area: "backend", kind: "language", languages: ["Elixir"] }),
    t({ id: "scala", name: "Scala", area: "backend", kind: "language", languages: ["Scala"] }),
    t({ id: "cpp", name: "C++", area: null, kind: "language", languages: ["C++"] }),
    t({ id: "c", name: "C", area: null, kind: "language", languages: ["C"] }),
    t({ id: "swift", name: "Swift", area: "frontend", kind: "language", languages: ["Swift"], aliases: ["ios", "swiftui"] }),
    t({ id: "dart", name: "Dart", area: "frontend", kind: "language", languages: ["Dart"] }),
    t({ id: "html", name: "HTML", area: "frontend", kind: "language", languages: ["HTML"], aliases: ["html5"] }),
    t({ id: "css", name: "CSS", area: "frontend", kind: "language", languages: ["CSS", "SCSS", "Sass", "Less"], deps: { npm: ["sass", "less"] }, aliases: ["css3", "scss", "sass"] }),
    t({ id: "shell", name: "Shell", area: "devops", kind: "language", languages: ["Shell", "PowerShell"], aliases: ["bash", "scripting"] }),
    t({ id: "sql", name: "SQL", area: "data", kind: "language", languages: ["PLpgSQL", "TSQL", "PLSQL", "SQL"] }),
    t({ id: "r", name: "R", area: "data", kind: "language", languages: ["R"] }),
    t({ id: "jupyter", name: "Jupyter", area: "ai", kind: "tool", languages: ["Jupyter Notebook"], aliases: ["notebooks"] }),

    // Frontend
    t({ id: "react", name: "React", area: "frontend", kind: "framework", deps: { npm: ["react"] }, aliases: ["react.js", "reactjs"] }),
    t({ id: "nextjs", name: "Next.js", area: "frontend", kind: "framework", deps: { npm: ["next"] }, files: ["next.config.*"], aliases: ["next"] }),
    t({ id: "vue", name: "Vue", area: "frontend", kind: "framework", deps: { npm: ["vue"] }, languages: ["Vue"], aliases: ["vue.js", "vuejs"] }),
    t({ id: "nuxt", name: "Nuxt", area: "frontend", kind: "framework", deps: { npm: ["nuxt"] }, files: ["nuxt.config.*"] }),
    t({ id: "svelte", name: "Svelte", area: "frontend", kind: "framework", deps: { npm: ["svelte", "@sveltejs/kit"] }, languages: ["Svelte"], aliases: ["sveltekit"] }),
    t({ id: "angular", name: "Angular", area: "frontend", kind: "framework", deps: { npm: ["@angular/core"] }, files: ["angular.json"] }),
    t({ id: "solid", name: "SolidJS", area: "frontend", kind: "framework", deps: { npm: ["solid-js"] } }),
    t({ id: "astro", name: "Astro", area: "frontend", kind: "framework", deps: { npm: ["astro"] }, languages: ["Astro"] }),
    t({ id: "remix", name: "Remix", area: "frontend", kind: "framework", deps: { npm: ["@remix-run/*", "@react-router/dev"] }, aliases: ["react router"] }),
    t({ id: "tailwind", name: "Tailwind CSS", area: "frontend", kind: "tool", deps: { npm: ["tailwindcss"] }, files: ["tailwind.config.*"], aliases: ["tailwind"] }),
    t({ id: "radix", name: "Radix UI", area: "frontend", kind: "tool", deps: { npm: ["@radix-ui/*", "radix-ui"] }, files: ["components.json"], aliases: ["shadcn", "shadcn/ui"] }),
    t({ id: "css-in-js", name: "CSS-in-JS", area: "frontend", kind: "tool", deps: { npm: ["styled-components", "@emotion/react", "@emotion/styled", "@vanilla-extract/css", "@pandacss/dev"] }, aliases: ["styled-components", "emotion"] }),
    t({ id: "redux", name: "Redux", area: "frontend", kind: "tool", deps: { npm: ["redux", "@reduxjs/toolkit"] }, aliases: ["redux toolkit"] }),
    t({ id: "zustand", name: "Zustand", area: "frontend", kind: "tool", deps: { npm: ["zustand", "jotai"] } }),
    t({ id: "tanstack-query", name: "TanStack Query", area: "frontend", kind: "tool", deps: { npm: ["@tanstack/*-query", "react-query", "swr"] }, aliases: ["react query", "swr"] }),
    t({ id: "motion", name: "Motion", area: "frontend", kind: "tool", deps: { npm: ["framer-motion", "motion", "gsap"] }, aliases: ["framer motion", "animation", "gsap"] }),
    t({ id: "threejs", name: "Three.js", area: "frontend", kind: "tool", deps: { npm: ["three", "@react-three/fiber"] }, aliases: ["webgl", "3d"] }),
    t({ id: "d3", name: "D3", area: "frontend", kind: "tool", deps: { npm: ["d3", "d3-*", "recharts", "@visx/*", "chart.js"] }, aliases: ["data visualization", "charts"] }),
    t({ id: "vite", name: "Vite", area: "frontend", kind: "tool", deps: { npm: ["vite"] }, files: ["vite.config.*"] }),
    t({ id: "storybook", name: "Storybook", area: "frontend", kind: "tool", deps: { npm: ["storybook", "@storybook/*"] }, files: [".storybook"] }),
    t({ id: "react-native", name: "React Native", area: "frontend", kind: "framework", deps: { npm: ["react-native", "expo"] }, files: ["eas.json"], aliases: ["expo", "mobile"] }),
    t({ id: "flutter", name: "Flutter", area: "frontend", kind: "framework", files: ["pubspec.yaml"], aliases: ["mobile"] }),
    t({ id: "electron", name: "Electron", area: "frontend", kind: "framework", deps: { npm: ["electron"] }, aliases: ["desktop"] }),
    t({ id: "tauri", name: "Tauri", area: "frontend", kind: "framework", deps: { npm: ["@tauri-apps/*"], cargo: ["tauri"] }, files: ["src-tauri"], aliases: ["desktop"] }),

    // Backend
    t({ id: "nodejs", name: "Node.js", area: "backend", kind: "framework", deps: { npm: ["@types/node", "tsx", "ts-node", "nodemon"] }, aliases: ["node", "node.js"] }),
    t({ id: "express", name: "Express", area: "backend", kind: "framework", deps: { npm: ["express"] }, aliases: ["express.js"] }),
    t({ id: "fastify", name: "Fastify", area: "backend", kind: "framework", deps: { npm: ["fastify"] } }),
    t({ id: "nestjs", name: "NestJS", area: "backend", kind: "framework", deps: { npm: ["@nestjs/*"] }, aliases: ["nest"] }),
    t({ id: "hono", name: "Hono", area: "backend", kind: "framework", deps: { npm: ["hono"] } }),
    t({ id: "trpc", name: "tRPC", area: "backend", kind: "tool", deps: { npm: ["@trpc/server"] } }),
    t({ id: "graphql", name: "GraphQL", area: "backend", kind: "tool", deps: { npm: ["graphql", "@apollo/server", "@apollo/client", "graphql-yoga", "urql"], pypi: ["strawberry-graphql", "graphene", "ariadne"], go: ["github.com/99designs/gqlgen"], cargo: ["async-graphql"], gem: ["graphql"] }, aliases: ["apollo"] }),
    t({ id: "rest", name: "OpenAPI", area: "backend", kind: "tool", deps: { npm: ["@hono/zod-openapi", "swagger-ui-express", "@nestjs/swagger", "openapi-typescript"], pypi: ["drf-spectacular", "flasgger"] }, files: ["openapi.*", "swagger.*"], aliases: ["swagger", "rest api", "rest"] }),
    t({ id: "django", name: "Django", area: "backend", kind: "framework", deps: { pypi: ["django", "djangorestframework"] }, files: ["manage.py"], aliases: ["drf"] }),
    t({ id: "flask", name: "Flask", area: "backend", kind: "framework", deps: { pypi: ["flask"] } }),
    t({ id: "fastapi", name: "FastAPI", area: "backend", kind: "framework", deps: { pypi: ["fastapi"] } }),
    t({ id: "rails", name: "Ruby on Rails", area: "backend", kind: "framework", deps: { gem: ["rails"] }, aliases: ["rails", "ror"] }),
    t({ id: "laravel", name: "Laravel", area: "backend", kind: "framework", deps: { composer: ["laravel/framework"] }, files: ["artisan"] }),
    t({ id: "symfony", name: "Symfony", area: "backend", kind: "framework", deps: { composer: ["symfony/framework-bundle"] } }),
    t({ id: "spring", name: "Spring Boot", area: "backend", kind: "framework", deps: { maven: ["spring-boot*"] }, aliases: ["spring"] }),
    t({ id: "gin", name: "Gin", area: "backend", kind: "framework", deps: { go: ["github.com/gin-gonic/gin", "github.com/labstack/echo*", "github.com/gofiber/fiber*", "github.com/go-chi/chi*"] }, aliases: ["echo", "fiber", "chi"] }),
    t({ id: "axum", name: "Axum", area: "backend", kind: "framework", deps: { cargo: ["axum", "actix-web", "rocket"] }, aliases: ["actix", "rocket"] }),
    t({ id: "auth", name: "Authentication", area: "backend", kind: "tool", deps: { npm: ["next-auth", "@auth/*", "@clerk/*", "passport", "passport-*", "lucia", "better-auth", "jsonwebtoken", "jose", "@supabase/auth-helpers-*"], pypi: ["pyjwt", "python-jose", "authlib", "django-allauth"], gem: ["devise"], go: ["github.com/golang-jwt/jwt*"] }, aliases: ["oauth", "jwt", "auth", "sso"] }),
    t({ id: "payments", name: "Stripe", area: "backend", kind: "tool", deps: { npm: ["stripe", "@stripe/*"], pypi: ["stripe"], gem: ["stripe"], go: ["github.com/stripe/stripe-go*"] }, aliases: ["payments"] }),
    t({ id: "jobs", name: "Background jobs", area: "backend", kind: "tool", deps: { npm: ["bullmq", "bull", "inngest", "@temporalio/*", "@trigger.dev/*", "agenda"], pypi: ["celery", "rq", "dramatiq", "temporalio"], gem: ["sidekiq"] }, aliases: ["queues", "celery", "sidekiq", "bullmq", "message queues"] }),
    t({ id: "websockets", name: "WebSockets", area: "backend", kind: "tool", deps: { npm: ["socket.io", "ws", "@socket.io/*", "pusher", "ably"], pypi: ["websockets", "channels"], go: ["github.com/gorilla/websocket"] }, aliases: ["socket.io", "realtime"] }),

    // Data
    t({ id: "postgres", name: "PostgreSQL", area: "data", kind: "tool", deps: { npm: ["pg", "postgres", "@neondatabase/serverless", "@vercel/postgres", "pg-promise"], pypi: ["psycopg", "psycopg2", "psycopg2-binary", "asyncpg"], go: ["github.com/jackc/pgx*", "github.com/lib/pq"], cargo: ["tokio-postgres", "postgres"], gem: ["pg"], maven: ["postgresql"] }, aliases: ["postgres", "psql"] }),
    t({ id: "mysql", name: "MySQL", area: "data", kind: "tool", deps: { npm: ["mysql", "mysql2", "@planetscale/database"], pypi: ["pymysql", "mysqlclient", "mysql-connector-python"], go: ["github.com/go-sql-driver/mysql"], gem: ["mysql2"], maven: ["mysql-connector*"] }, aliases: ["mariadb"] }),
    t({ id: "sqlite", name: "SQLite", area: "data", kind: "tool", deps: { npm: ["sqlite3", "better-sqlite3", "@libsql/client", "sql.js"], cargo: ["rusqlite"], gem: ["sqlite3"], go: ["github.com/mattn/go-sqlite3", "modernc.org/sqlite"] }, aliases: ["libsql", "turso"] }),
    t({ id: "mongodb", name: "MongoDB", area: "data", kind: "tool", deps: { npm: ["mongodb", "mongoose"], pypi: ["pymongo", "motor", "mongoengine"], go: ["go.mongodb.org/mongo-driver*"], gem: ["mongoid"] }, aliases: ["mongo", "mongoose", "nosql"] }),
    t({ id: "redis", name: "Redis", area: "data", kind: "tool", deps: { npm: ["redis", "ioredis", "@upstash/redis"], pypi: ["redis"], go: ["github.com/redis/go-redis*", "github.com/go-redis/redis*"], cargo: ["redis"], gem: ["redis"] }, aliases: ["caching", "upstash"] }),
    t({ id: "prisma", name: "Prisma", area: "data", kind: "tool", deps: { npm: ["prisma", "@prisma/client"] } }),
    t({ id: "drizzle", name: "Drizzle", area: "data", kind: "tool", deps: { npm: ["drizzle-orm"] }, files: ["drizzle.config.*"], aliases: ["drizzle orm"] }),
    t({ id: "orm", name: "SQL ORMs", area: "data", kind: "tool", deps: { npm: ["typeorm", "sequelize", "knex", "kysely", "@mikro-orm/*"], pypi: ["sqlalchemy", "sqlmodel", "peewee", "tortoise-orm"], go: ["gorm.io/gorm", "github.com/jmoiron/sqlx"], cargo: ["diesel", "sqlx", "sea-orm"], maven: ["hibernate*", "spring-boot-starter-data-jpa"] }, aliases: ["orm", "sqlalchemy", "typeorm", "hibernate", "jpa"] }),
    t({ id: "supabase", name: "Supabase", area: "data", kind: "tool", deps: { npm: ["@supabase/supabase-js", "@supabase/ssr"], pypi: ["supabase"] }, files: ["supabase"] }),
    t({ id: "firebase", name: "Firebase", area: "data", kind: "tool", deps: { npm: ["firebase", "firebase-admin"], pypi: ["firebase-admin"] }, files: ["firebase.json"], aliases: ["firestore"] }),
    t({ id: "search", name: "Elasticsearch", area: "data", kind: "tool", deps: { npm: ["@elastic/elasticsearch", "meilisearch", "typesense", "algoliasearch"], pypi: ["elasticsearch", "opensearch-py", "meilisearch"] }, aliases: ["search", "opensearch", "algolia", "meilisearch"] }),
    t({ id: "kafka", name: "Kafka", area: "data", kind: "tool", deps: { npm: ["kafkajs", "amqplib", "@aws-sdk/client-sqs", "nats"], pypi: ["confluent-kafka", "kafka-python", "aiokafka", "pika"], go: ["github.com/segmentio/kafka-go", "github.com/IBM/sarama", "github.com/nats-io/nats.go"], cargo: ["rdkafka"] }, aliases: ["rabbitmq", "event streaming", "message broker", "sqs", "nats"] }),
    t({ id: "pandas", name: "pandas", area: "data", kind: "tool", deps: { pypi: ["pandas", "polars", "numpy"] }, aliases: ["numpy", "polars", "dataframes"] }),
    t({ id: "data-pipelines", name: "Data pipelines", area: "data", kind: "tool", deps: { pypi: ["apache-airflow", "dbt-core", "dbt-*", "pyspark", "dagster", "prefect"] }, files: ["dbt_project.yml"], aliases: ["airflow", "dbt", "spark", "etl"] }),

    // DevOps
    t({ id: "docker", name: "Docker", area: "devops", kind: "tool", files: ["Dockerfile", "Dockerfile.*", "*.Dockerfile", "docker-compose.y*ml", "compose.y*ml", ".dockerignore"], languages: ["Dockerfile"], aliases: ["containers", "docker compose"] }),
    t({ id: "kubernetes", name: "Kubernetes", area: "devops", kind: "tool", files: ["k8s", "kubernetes", "helm", "charts", "skaffold.yaml", "kustomization.yaml"], aliases: ["k8s", "helm"] }),
    t({ id: "terraform", name: "Terraform", area: "devops", kind: "tool", files: ["*.tf", "terraform"], languages: ["HCL"], deps: { npm: ["aws-cdk-lib", "@pulumi/*", "sst"] }, aliases: ["infrastructure as code", "iac", "pulumi", "cdk"] }),
    t({ id: "github-actions", name: "GitHub Actions", area: "devops", kind: "tool", files: [".github/workflows"], aliases: ["ci/cd", "ci", "continuous integration"] }),
    t({ id: "ci", name: "CI pipelines", area: "devops", kind: "tool", files: [".gitlab-ci.yml", ".circleci", "Jenkinsfile", "azure-pipelines.yml", "bitbucket-pipelines.yml", ".travis.yml"], aliases: ["gitlab ci", "jenkins", "circleci"] }),
    t({ id: "vercel", name: "Vercel", area: "devops", kind: "tool", deps: { npm: ["@vercel/*", "vercel"] }, files: ["vercel.json"] }),
    t({ id: "edge", name: "Cloudflare", area: "devops", kind: "tool", deps: { npm: ["wrangler", "@cloudflare/*"] }, files: ["wrangler.toml", "wrangler.json*"], aliases: ["cloudflare workers", "edge"] }),
    t({ id: "aws", name: "AWS", area: "devops", kind: "tool", deps: { npm: ["aws-sdk", "@aws-sdk/*", "aws-cdk-lib", "serverless"], pypi: ["boto3", "aws-cdk-lib"], go: ["github.com/aws/aws-sdk-go*"], cargo: ["aws-sdk-*", "aws-config"] }, files: ["serverless.y*ml", "samconfig.toml", "cdk.json"], aliases: ["amazon web services", "lambda", "s3"] }),
    t({ id: "gcp", name: "Google Cloud", area: "devops", kind: "tool", deps: { npm: ["@google-cloud/*"], pypi: ["google-cloud-*"], go: ["cloud.google.com/go*"] }, files: ["app.yaml", "cloudbuild.yaml"], aliases: ["gcp"] }),
    t({ id: "azure", name: "Azure", area: "devops", kind: "tool", deps: { npm: ["@azure/*"], pypi: ["azure-*"] }, aliases: ["microsoft azure"] }),
    t({ id: "hosting", name: "PaaS hosting", area: "devops", kind: "tool", files: ["netlify.toml", "fly.toml", "render.yaml", "railway.json", "railway.toml", "Procfile"], aliases: ["netlify", "fly.io", "render", "railway", "heroku"] }),
    t({ id: "observability", name: "Observability", area: "devops", kind: "tool", deps: { npm: ["@sentry/*", "@opentelemetry/*", "prom-client", "dd-trace", "pino", "winston"], pypi: ["sentry-sdk", "opentelemetry-*", "prometheus-client", "structlog"], go: ["go.opentelemetry.io/*", "github.com/prometheus/client_golang"], cargo: ["tracing", "opentelemetry"] }, aliases: ["monitoring", "logging", "sentry", "opentelemetry", "prometheus"] }),
    t({ id: "monorepo", name: "Monorepos", area: "devops", kind: "tool", deps: { npm: ["turbo", "nx", "lerna"] }, files: ["turbo.json", "nx.json", "pnpm-workspace.yaml", "lerna.json"], aliases: ["turborepo", "nx"] }),
    t({ id: "nix", name: "Nix", area: "devops", kind: "tool", files: ["flake.nix", "shell.nix", "default.nix"], languages: ["Nix"] }),

    // Quality
    t({ id: "unit-tests", name: "Unit testing", area: "testing", kind: "tool", deps: { npm: ["jest", "vitest", "mocha", "ava", "@jest/*", "uvu"], pypi: ["pytest", "pytest-*", "hypothesis", "nose2"], gem: ["rspec", "rspec-*", "minitest"], composer: ["phpunit/phpunit", "pestphp/pest"], maven: ["junit*", "spring-boot-starter-test"], go: ["github.com/stretchr/testify"] }, files: ["jest.config.*", "vitest.config.*", "pytest.ini", "conftest.py", "tox.ini", ".rspec", "phpunit.xml*"], aliases: ["jest", "vitest", "pytest", "rspec", "junit", "tdd", "testing", "unit tests"] }),
    t({ id: "testing-library", name: "Testing Library", area: "testing", kind: "tool", deps: { npm: ["@testing-library/*", "msw", "supertest", "nock"] }, aliases: ["react testing library", "msw", "integration tests"] }),
    t({ id: "e2e", name: "End-to-end tests", area: "testing", kind: "tool", deps: { npm: ["@playwright/test", "playwright", "cypress", "puppeteer", "webdriverio"], pypi: ["playwright", "pytest-playwright", "selenium"], gem: ["capybara"] }, files: ["playwright.config.*", "cypress.config.*", "cypress", "e2e"], aliases: ["playwright", "cypress", "selenium", "e2e", "end-to-end testing", "end to end testing", "detox"] }),
    t({ id: "linting", name: "Linting", area: "testing", kind: "tool", deps: { npm: ["eslint", "prettier", "@biomejs/biome", "oxlint", "stylelint"], pypi: ["ruff", "black", "flake8", "pylint", "isort"], gem: ["rubocop"], go: ["github.com/golangci/golangci-lint"] }, files: [".eslintrc*", "eslint.config.*", "biome.json*", ".prettierrc*", "prettier.config.*", "ruff.toml", ".golangci.y*ml", ".rubocop.yml", ".pre-commit-config.yaml"], aliases: ["eslint", "prettier", "code quality"] }),
    // No area: nearly every TypeScript repository has it, so it would say
    // little about quality on its own.
    t({ id: "type-checking", name: "Static typing", area: null, kind: "tool", deps: { npm: ["typescript", "zod", "valibot"], pypi: ["mypy", "pyright", "pydantic"] }, files: ["tsconfig.json", "mypy.ini", "pyrightconfig.json"], aliases: ["type safety", "mypy", "zod", "pydantic"] }),

    // AI / ML
    t({ id: "llm-apis", name: "LLM APIs", area: "ai", kind: "tool", deps: { npm: ["openai", "@anthropic-ai/sdk", "@google/genai", "@google/generative-ai", "@mistralai/mistralai", "groq-sdk", "ollama", "cohere-ai"], pypi: ["openai", "anthropic", "google-genai", "google-generativeai", "mistralai", "groq", "ollama", "litellm", "cohere"], go: ["github.com/sashabaranov/go-openai", "github.com/anthropics/anthropic-sdk-go", "github.com/openai/openai-go"] }, aliases: ["openai", "anthropic", "claude", "gemini", "gpt", "llm", "generative ai", "genai"] }),
    t({ id: "ai-sdk", name: "Vercel AI SDK", area: "ai", kind: "tool", deps: { npm: ["ai", "@ai-sdk/*"] }, aliases: ["ai sdk"] }),
    t({ id: "langchain", name: "LangChain", area: "ai", kind: "framework", deps: { npm: ["langchain", "@langchain/*", "llamaindex"], pypi: ["langchain", "langchain-*", "langgraph", "llama-index", "llama-index-*"] }, aliases: ["langgraph", "llamaindex", "rag", "agents"] }),
    t({ id: "mcp", name: "MCP", area: "ai", kind: "tool", deps: { npm: ["@modelcontextprotocol/sdk"], pypi: ["mcp", "fastmcp"] }, aliases: ["model context protocol"] }),
    t({ id: "vector-db", name: "Vector search", area: "ai", kind: "tool", deps: { npm: ["@pinecone-database/pinecone", "chromadb", "@qdrant/*", "weaviate-client", "pgvector"], pypi: ["pinecone", "pinecone-client", "chromadb", "qdrant-client", "weaviate-client", "pgvector", "faiss-cpu", "lancedb"] }, aliases: ["embeddings", "pinecone", "pgvector", "vector database"] }),
    t({ id: "pytorch", name: "PyTorch", area: "ai", kind: "framework", deps: { pypi: ["torch", "torchvision", "lightning", "pytorch-lightning"] }, aliases: ["torch", "deep learning"] }),
    t({ id: "tensorflow", name: "TensorFlow", area: "ai", kind: "framework", deps: { npm: ["@tensorflow/*"], pypi: ["tensorflow", "keras", "jax", "flax"] }, aliases: ["keras", "jax"] }),
    t({ id: "huggingface", name: "Hugging Face", area: "ai", kind: "tool", deps: { npm: ["@huggingface/*", "@xenova/transformers"], pypi: ["transformers", "datasets", "diffusers", "huggingface-hub", "sentence-transformers", "accelerate", "peft"] }, aliases: ["transformers", "fine-tuning"] }),
    t({ id: "scikit-learn", name: "scikit-learn", area: "ai", kind: "tool", deps: { pypi: ["scikit-learn", "xgboost", "lightgbm", "statsmodels"] }, aliases: ["sklearn", "machine learning", "xgboost"] }),
];

export const TECHNOLOGY_BY_ID = new Map(TECHNOLOGIES.map((tech) => [tech.id, tech]));

export const AREA_BY_ID = new Map(SKILL_AREAS.map((area) => [area.id, area]));
