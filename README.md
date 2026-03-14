# PraxisMakesPerfect

PraxisMakesPerfect is a React + Vite study platform for the Praxis School Psychologist exam. The current app uses a taxonomy-driven question bank, Firebase-backed authentication and progress storage, adaptive practice flows, assessment builders, and question-generation tooling.

## Canonical Docs

Use these files as the active documentation set:

- [DOCUMENT_CONSOLIDATION_REPORT.md](/Users/lebron/Documents/PraxisMakesPerfect/DOCUMENT_CONSOLIDATION_REPORT.md)
- [DOCUMENT_REGISTRY.md](/Users/lebron/Documents/PraxisMakesPerfect/DOCUMENT_REGISTRY.md)
- [REWRITE_DEVELOPMENT_GUIDE.md](/Users/lebron/Documents/PraxisMakesPerfect/REWRITE_DEVELOPMENT_GUIDE.md)
- [CODEBASE_OVERVIEW.md](/Users/lebron/Documents/PraxisMakesPerfect/CODEBASE_OVERVIEW.md)
- [ASSESSMENT_DATA_FLOW_ANALYSIS.md](/Users/lebron/Documents/PraxisMakesPerfect/ASSESSMENT_DATA_FLOW_ANALYSIS.md)

Operational guides kept in root:

- [FIREBASE_AUTH_SETUP.md](/Users/lebron/Documents/PraxisMakesPerfect/FIREBASE_AUTH_SETUP.md)
- [DEPLOY_FIREBASE_RULES.md](/Users/lebron/Documents/PraxisMakesPerfect/DEPLOY_FIREBASE_RULES.md)
- [FIREBASE_SECURITY_TESTING.md](/Users/lebron/Documents/PraxisMakesPerfect/FIREBASE_SECURITY_TESTING.md)
- [FIX_UNAUTHORIZED_DOMAIN.md](/Users/lebron/Documents/PraxisMakesPerfect/FIX_UNAUTHORIZED_DOMAIN.md)

Historical and superseded documentation has been moved under `archive/`.

## Current Source-Of-Truth Rules

- Praxis content areas are the primary assessment and reporting structure.
- Domains and skills are taxonomy-derived; they are not inferred from question text.
- `skillId` is required for question classification and downstream analytics.
- Firebase is the active persistence layer for authentication and user progress.
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
npm run firebase:test-rules
```

## Runtime Overview

- Frontend: React 18 + Vite
- Styling: Tailwind CSS
- Persistence: Firebase Auth + Firestore
- Question bank: `src/data/questions.json`
- Skill taxonomy: `src/brain/skill-map.ts`
- Assessment builder: `src/utils/assessment-builder.ts`
- Adaptive and diagnostic logic: `src/brain/*`, `src/hooks/*`, `src/components/*`

## Repo Layout

```text
PraxisMakesPerfect/
├── App.tsx
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
