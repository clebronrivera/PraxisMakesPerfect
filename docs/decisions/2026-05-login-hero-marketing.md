# ADR: Login hero marketing copy (platform-level only)

**Status:** Accepted  
**Date:** 2026-05-24

## Context

The login hero repeatedly drifted back to exam-specific stats (domain count, skill count, question-bank size, “calibrated items”, IRT claims). PASS is a general adaptive study platform; the public entry page should explain value without publishing numbers that go stale or over-specify a single exam.

## Decision

The login hero **and the `?boot=1` boot terminal** (`src/components/LoginScreen.tsx`) must **not** display:

- Question-bank size or item counts (e.g. “1,150 calibrated items”)
- Calibration / IRT marketing claims **anywhere in the unauthenticated entry, including the boot terminal** (e.g. “2PL IRT model · difficulty + discrimination per item”). The bank has **no IRT parameters and no calibration** — see `audit-output/psychometric-readiness-audit.md`; these claims are false.
- Domain or skill counts (e.g. “4 domains · 45 skills”)

It **may** display platform-level copy: headline, short value proposition, CTAs, feature bullets, and a “How it works” step list. The boot terminal may describe the **real** engine (per-skill follow-ups, Recall/Application alternation, misconception detection, confidence weighting, spaced review) — never a fabricated psychometric model.

Exam-specific counts and bank metadata remain in internal docs, admin tooling, and post-auth product surfaces—not on the unauthenticated hero.

## Consequences

- Hero copy is maintained in `LOGIN_HERO_FEATURES` and `LOGIN_HERO_STEPS` in `LoginScreen.tsx`.
- `docs/HOW_THE_APP_WORKS.md` login section documents this rule.
- Historical mockups under `public/` may still show old copy; ground truth for login is `mockup-login-generalized.html` and the React component.

## History

- **2026-05-24:** Accepted; hero generalized (PR #27 removed the bank-size stat row from the hero).
- **2026-05-31:** Extended to the `?boot=1` terminal. PR #27 fixed the hero but left the boot terminal asserting a fabricated “2PL IRT model · difficulty + discrimination per item”; corrected, and the Decision above now explicitly covers the boot terminal.
