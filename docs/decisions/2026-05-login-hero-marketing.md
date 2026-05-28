# ADR: Login hero marketing copy (platform-level only)

**Status:** Accepted  
**Date:** 2026-05-24

## Context

The login hero repeatedly drifted back to exam-specific stats (domain count, skill count, question-bank size, “calibrated items”, IRT claims). PASS is a general adaptive study platform; the public entry page should explain value without publishing numbers that go stale or over-specify a single exam.

## Decision

The login hero (`src/components/LoginScreen.tsx`) must **not** display:

- Question-bank size or item counts (e.g. “1,150 calibrated items”)
- Calibration / IRT marketing claims
- Domain or skill counts (e.g. “4 domains · 45 skills”)

It **may** display platform-level copy: headline, short value proposition, CTAs, feature bullets, and a “How it works” step list.

Exam-specific counts and bank metadata remain in internal docs, admin tooling, and post-auth product surfaces—not on the unauthenticated hero.

## Consequences

- Hero copy is maintained in `LOGIN_HERO_FEATURES` and `LOGIN_HERO_STEPS` in `LoginScreen.tsx`.
- `docs/HOW_THE_APP_WORKS.md` login section documents this rule.
- Historical mockups under `public/` may still show old copy; ground truth for login is `mockup-login-generalized.html` and the React component.
