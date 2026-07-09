# PraxisMakesPerfect

> **Repo status (updated 2026-07-02):** This is the **active codebase for PASS** — merges to `main` auto-deploy to production (Netlify). The April 2026 "maintenance / three-track" note is superseded; that context is archived at [archive/docs-cleanup-2026-07/HANDOFF_2026-04-27.md](archive/docs-cleanup-2026-07/HANDOFF_2026-04-27.md).

PraxisMakesPerfect is a React + Vite study platform for the Praxis School Psychologist exam. The current app uses a taxonomy-driven question bank, Supabase-backed authentication and progress storage, adaptive practice flows, assessment builders, and question-generation tooling.

## Canonical Docs

Use these files as the active documentation set:

- [docs/DOCUMENT_CONSOLIDATION_REPORT.md](docs/DOCUMENT_CONSOLIDATION_REPORT.md)
- [docs/DOCUMENT_REGISTRY.md](docs/DOCUMENT_REGISTRY.md)
- [REWRITE_DEVELOPMENT_GUIDE.md](REWRITE_DEVELOPMENT_GUIDE.md) ⚠️ stale banner — principles hold, details drifted
- [CODEBASE_OVERVIEW.md](CODEBASE_OVERVIEW.md) ⚠️ stale banner — defer to code
- [ASSESSMENT_DATA_FLOW_ANALYSIS.md](ASSESSMENT_DATA_FLOW_ANALYSIS.md) ⚠️ stale banner — defer to code
- [docs/ANALYTICS_DATA_INVENTORY.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/ANALYTICS_DATA_INVENTORY.md)
- [docs/SUPABASE_AND_DEPLOYMENT_AUDIT.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/SUPABASE_AND_DEPLOYMENT_AUDIT.md)

Working grounding docs:

- [docs/DOCS_SYSTEM.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/DOCS_SYSTEM.md)
- [AGENTS.md](/Users/lebron/Documents/PraxisMakesPerfect/AGENTS.md)
- [docs/WORKFLOW_GROUNDING.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/WORKFLOW_GROUNDING.md)
- [docs/ISSUE_LEDGER.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/ISSUE_LEDGER.md)
- [docs/Praxis_5403_Complete_Reference.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/Praxis_5403_Complete_Reference.md) — Praxis 5403 domains, 45 skills, bank files

Historical and superseded documentation has been moved under `archive/`.
Historical Firebase setup and Firestore operations docs now live under `archive/docs-legacy-2026-03-18/`.

## Current Source-Of-Truth Rules

- Praxis content areas are the primary assessment and reporting structure.
- Domains and skills are taxonomy-derived; they are not inferred from question text.
- `skillId` is required for question classification and downstream analytics.
- Supabase is the active persistence layer for authentication, profile data, and response events.
- If documentation conflicts with code, current code and the canonical docs win.

## Quick Start

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173` by default.

Build and preview:

```bash
npm run build
npm run preview
```

## Useful Commands

```bash
npm run scan:types
npm run scan:knip
npm run scan:cycles
npm run diagnostics
npm run audit:bank
npm run audit:distractors
npm run audit:answers
npm run verify:health
```

## Runtime Overview

- Frontend: React 18 + Vite
- Styling: Tailwind CSS
- Persistence: Supabase Auth + Supabase Postgres
- Question bank: `src/data/questions.json`
- Skill taxonomy: `src/brain/skill-map.ts`
- Assessment builder: `src/utils/assessment-builder.ts`
- Assessment and adaptive logic: `src/brain/*`, `src/hooks/*`, `src/components/*`

## Repo Layout

```text
PraxisMakesPerfect/
├── App.tsx
├── local/
├── knowledge-base.ts
├── scripts/
├── src/
├── tests/
├── archive/
├── DOCUMENT_CONSOLIDATION_REPORT.md
├── DOCUMENT_REGISTRY.md
└── REWRITE_DEVELOPMENT_GUIDE.md
```

## Notes

- Older quick-start, implementation-plan, and audit files are retained only as historical artifacts under `archive/`.
- Root-level planning and audit sprawl is no longer authoritative unless it is listed above.
- `local/` is the intentionally ignored workspace for private PDFs, DOCX deliverables, scratch mapping files, and other local-only materials that should not land on GitHub.
- Generated CSV/JSON exports under `output/` are local working artifacts by default, not canonical tracked assets; the current explicit tracked exception is `output/AUDIT_SUMMARY.md`.
