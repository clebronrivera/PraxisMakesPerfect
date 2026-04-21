# Phase β Staging — Gap-Closer Taxonomy v2

This directory holds content deliverables that feed into Phase γ (core taxonomy code), Phase δ (module layer code), Phase ε (question authoring), and Phase θ (migration + catch-up + adaptive loop).

Nothing in this directory is TypeScript. Nothing here ships to production. These are **reviewable specifications** that make the subsequent code PRs mechanical translations.

See `/docs/plans/gap-closer-execution-plan.md` for the canonical phasing and gate logic, and `/docs/decisions/2026-04-skill-taxonomy-v2.md` for the locked Phase 0 decisions.

---

## Deliverables in this directory

| File | Content Task | Blocks Code Task | Status |
|------|-------------|------------------|--------|
| `skill-metadata-drafts.md` | C3 — Skill metadata for 6 new skills + 3 sub-concepts | K3b, K3c | **draft complete — pending SME review** |
| `module-sections.json` | C4 — Module section JSON for 9 gap-closer modules | K6 | **draft complete — pending SME review of doc_domain assignments + prerequisites** |
| `copy-updates.md` | C5 — Copy update spec ("45 skills" → "51 skills" etc.) | K4 | **draft complete — pending SME review** |
| `catchup-copy.md` | C11 — Catch-up diagnostic UX copy (Decision 0.2-modified) | K13, K14 | **draft complete — pending SME voice + legal review** |
| `fallback-prerequisite-map.md` | C12 — Per-skill fallback prerequisite mapping (Decision 0.3) | C7a–d, K15 | **draft complete — pending SME review alongside C3** |

---

## Fill order

1. **C3** first — everything else references the new skill IDs and vocabulary from here.
2. **C4** and **C5** and **C11** can fill in parallel once C3 is drafted.
3. **C12** needs C3 vocabulary lists complete before it can enumerate prerequisite concepts.
4. **C7a–d** (question authoring) cannot start until C3 and C12 are both reviewed.

---

## Review protocol

Each file ships via PR to the `feat/gap-closer-taxonomy` branch. SME review required before marking the corresponding task `completed` in the task tracker. Do NOT mark a content deliverable done based on draft quality alone — accuracy review by someone with school psychology expertise is required for C3, C11, and C12.
