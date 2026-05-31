# ADR: Login hero marketing copy — no bank-size or calibration claims

**Status:** Accepted
**Date:** 2026-05-24 (re-affirmed and finally landed on `main` 2026-05-31)

## Context

The login hero repeatedly drifted back to exam-specific stats — domain count, skill
count, question-bank size, "calibrated items", and IRT claims. Two distinct problems:

1. **Staleness / over-specification.** PASS is an adaptive study platform; the public
   entry page should explain value without publishing numbers that go stale or
   over-specify a single exam.
2. **The calibration claims are false.** The psychometric-readiness audit
   (`audit-output/psychometric-readiness-audit.md`) confirms the bank has **no IRT
   b-parameter, no numeric difficulty scale, and no empirical calibration**. Items carry
   only an SME-assigned 2-tier cognitive label ("Recall" / "Application"). p-values and a
   discrimination index are computed on-demand in admin (classical test theory), never
   stored per item, and are not IRT. So "IRT-calibrated", "2PL IRT model", and "1,150
   items calibrated" were inaccurate.

## Decision

The login hero (`src/components/LoginScreen.tsx`) must **not** present as marketing:

- Question-bank size or item counts (e.g. "1,150 calibrated items").
- Domain or skill counts as a stat row (e.g. "4 domains · 45 skills").

And **nowhere** in the unauthenticated entry — the hero **or** the `?boot=1` boot terminal —
may we assert psychometric calibration that does not exist:

- No "IRT-calibrated", "2PL IRT model", "items calibrated", or per-item
  difficulty/discrimination claims.

The hero **may** display platform-level value copy: headline, a short value proposition,
CTAs, and **honest, non-numeric proof points** describing what the product actually does —
e.g. *adaptive diagnostic*, *names your misconceptions*, *plan built from your data*.

Exam-specific counts and bank metadata remain in internal docs, admin tooling, and
post-auth product surfaces — not on the unauthenticated hero.

## Consequences

- Hero copy and the boot sequence live in `src/components/LoginScreen.tsx`. Honest proof
  points replace the old stat row; the boot "psychometric parameters" phase now describes
  the real engine (skill-based follow-ups, Recall/Application alternation, misconception
  detection, confidence weighting) instead of a fictional IRT model.
- `docs/HOW_THE_APP_WORKS.md` login section documents this rule and must be updated
  whenever hero copy changes (its maintenance checklist already lists "any stat shown on
  the login/marketing page").
- Historical/legacy mockups under `public/` may still show old copy; the React component
  is the ground truth.

## History

First accepted 2026-05-24 on an unmerged design branch (`feat/restore-cognitive-clarity`),
where it removed the hero stat row but left the boot terminal's "2PL IRT model" line
intact. That branch never reached `main`, so the false claims kept shipping in production
until this fix corrected both the hero **and** the boot sequence on 2026-05-31.
