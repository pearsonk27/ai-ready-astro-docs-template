# AI-Ready Astro Docs Template

Production-ready Astro + Starlight documentation template with strict authoring rules and enforcement at commit, build, and CI time.

## What this template enforces

All docs in `src/content/docs/**/*.md` must have frontmatter fields:

- `title` (string)
- `domain` (one of `underwriting`, `engineering`, `portal`)
- `tags` (string array)
- `last_updated` (`YYYY-MM-DD`)

All docs must include these sections:

- `## Overview`
- `## Rules`
- `## Examples`

All docs must avoid vague references:

- `see above`
- `as mentioned earlier`

All images must include:

- non-empty alt text
- immediate explanation block using `Explanation:` or `**Explanation:**`

## Project structure

```text
src/content/docs
scripts/
  validate-docs.ts
  create-doc.ts
  export-docs.ts
  load-docs-to-db.ts
.husky/pre-commit
.github/workflows/ci.yml
Dockerfile
docker-compose.yml
```

## Quick start

1. Install dependencies:

```bash
npm ci
```

1. Run local docs:

```bash
npm run dev
```

1. Validate docs manually:

```bash
npm run validate:docs
```

1. Build (includes docs validation gate):

```bash
npm run build
```

## Create a new document

Use the scaffold CLI so new docs start valid:

```bash
npm run create-doc
```

Prompts for:

- title
- domain
- tags

Creates a markdown file in `src/content/docs/` with required frontmatter and required sections.

## How validation works

Validation happens in two layers:

1. Schema validation in `src/content/config.ts` via Astro content collections + Zod.
2. Custom rule validation in `scripts/validate-docs.ts`.

The custom validator fails when:

- required sections are missing
- disallowed phrases are present
- images are missing alt text
- images are missing immediate explanation blocks

## Pre-commit enforcement

Husky pre-commit hook runs:

```bash
npm run validate:docs
```

If validation fails, the commit is blocked.

## Export docs for AI/RAG pipelines

Export all docs to structured JSON:

```bash
npm run export:docs
```

Output file:

- `generated/docs.export.json`

Each exported object includes title, sections, metadata, and source path.

## Load exported docs into PostgreSQL

1. Set database URL:

```bash
cp .env.example .env
export DATABASE_URL=postgres://docs:docs@localhost:5433/docs
```

1. Export and load:

```bash
npm run export:docs
npm run load:docs:db
```

The loader creates table `docs` if missing and upserts by `id`.

## Docker and docker-compose

Run app + postgres locally:

```bash
docker compose up --build
```

Services:

- docs app at `http://localhost:4321`
- PostgreSQL at `localhost:5433` on the host (`5432` inside the compose network)

Stop services:

```bash
docker compose down
```

## CI behavior

Workflow: `.github/workflows/ci.yml`

Core job:

1. install dependencies
2. run docs validation
3. build Astro app
4. build Docker image

Optional job:

1. export docs
2. load docs into PostgreSQL service container

The optional job is separate and configured as non-blocking.

## Troubleshooting

- Build fails at schema phase:
  - verify required frontmatter fields and formats.
- Validation fails for image explanation:
  - place `Explanation:` or `**Explanation:**` immediately after image line (one blank line allowed).
- Pre-commit blocks valid-looking change:
  - run `npm run validate:docs` and use the reported file/line hints.
