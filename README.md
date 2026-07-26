# PraxisMakesPerfect

> **Repo status (updated 2026-07-02):** This is the **active codebase for PASS** — merges to `main` auto-deploy to production (Netlify). The April 2026 "maintenance / three-track" note is superseded; that context is archived at [archive/docs-cleanup-2026-07/HANDOFF_2026-04-27.md](archive/docs-cleanup-2026-07/HANDOFF_2026-04-27.md).

PraxisMakesPerfect is a React + Vite study platform for the Praxis School Psychologist exam. The current app uses a taxonomy-driven question bank, Supabase-backed authentication and progress storage, adaptive practice flows, assessment builders, and question-generation tooling.

## Canonical Docs

Use these files as the active documentation set:

- [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) — **the only plan document.** Definition of done, PR queue, migration registry, decisions
- [docs/HOW_THE_APP_WORKS.md](docs/HOW_THE_APP_WORKS.md) — canonical plain-language description of the product
- [docs/DOCS_SYSTEM.md](docs/DOCS_SYSTEM.md) — what each doc is for and when to update it
- [docs/ISSUE_LEDGER.md](docs/ISSUE_LEDGER.md) — bugs, mismatches, watch items
- [docs/PENDING_IDEAS.md](docs/PENDING_IDEAS.md) — unsequenced backlog
- [docs/PHASE2_REVIEW_BACKLOG.md](docs/PHASE2_REVIEW_BACKLOG.md) — items awaiting SME sign-off
- [docs/Praxis_5403_Complete_Reference.md](docs/Praxis_5403_Complete_Reference.md) — Praxis 5403 domains, 45 skills, bank files
- [docs/ANALYTICS_DATA_INVENTORY.md](docs/ANALYTICS_DATA_INVENTORY.md)
- [docs/SUPABASE_AND_DEPLOYMENT_AUDIT.md](docs/SUPABASE_AND_DEPLOYMENT_AUDIT.md)

Working grounding docs:

- [AGENTS.md](AGENTS.md) — repo-local workflow and source-of-truth order
- [CLAUDE.md](CLAUDE.md) — developer notes, conventions, the mandatory mockup-first rule
- [docs/WORKFLOW_GROUNDING.md](docs/WORKFLOW_GROUNDING.md) — durable product and reporting rules
- [CHANGELOG.md](CHANGELOG.md) — implementation history

Carrying stale banners — principles hold, implementation details drifted; defer to code:

- [REWRITE_DEVELOPMENT_GUIDE.md](REWRITE_DEVELOPMENT_GUIDE.md) ⚠️ last verified 2026-03-15
- [CODEBASE_OVERVIEW.md](CODEBASE_OVERVIEW.md) ⚠️ last verified 2026-03-14
- [ASSESSMENT_DATA_FLOW_ANALYSIS.md](ASSESSMENT_DATA_FLOW_ANALYSIS.md) ⚠️ last verified 2026-03-18

`docs/DOCUMENT_REGISTRY.md` and `docs/DOCUMENT_CONSOLIDATION_REPORT.md` are **historical**, not canonical — both self-declare as root-only snapshots from March/April 2026 and are superseded by `docs/DOCS_SYSTEM.md`.

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
