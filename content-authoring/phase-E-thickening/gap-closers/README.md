# Gap-Closer Modules — Phase E Thickening

## Purpose

These modules are **new content, not thickened rewrites**. They exist to close hard gaps identified in the April 2026 ETS Praxis 5403 Competency Audit (see `docs/audits/ets-5403-competency-audit.md`). Each corresponds to an ETS knowledge statement that had **no owning skill** in the 45-skill taxonomy.

## Status — All 9 Hard Gaps Now Drafted ✅

| File | ETS Gap Closed | Sample Q Validated | Proposed New Skill ID | App Domain |
|------|----------------|---------------------|-----------------------|------------|
| MOD-GAP-01-trauma-informed-practice.md | II.B.1.d — Trauma impact + trauma-informed practice | — | MBH-06 | 2 |
| MOD-GAP-02-classroom-management.md | II.B.1.a — Classroom organization & management | Q17 (house rules + positive reinforcement) | ACA-10 | 2 |
| MOD-GAP-03-performance-based-assessment.md | I.A.2.f — Portfolios & work samples | — | DBD-11 | 1 |
| MOD-GAP-04-ESSA.md | IV.C.2.a — ESSA-specific slice | — | LEG-05 | 4 |
| MOD-GAP-05-seclusion-restraint.md | IV.C.2.c — Seclusion, restraint, manifestation determination | — | LEG-06 | 4 |
| MOD-GAP-06-implementation-science.md | IV.B.4 — Implementation science / change management | — | RES-04 | 4 |
| MOD-GAP-07-low-incidence-exceptionalities.md | I.A.4.c — Low-incidence exceptionalities | — | DBD-12 | 1 |
| MOD-GAP-08-assessment-technology.md | I.A.2.i — Assessment technology & data tools | — | DBD-13 | 1 |
| MOD-GAP-09-school-climate-measurement.md | III.B.5 — School safety & climate measurement | — | SSV-09 | 3 |

All nine hard gaps from the April 2026 ETS 5403 competency audit now have draft modules. The next step is user review and codebase integration (see Integration Path below).

## Module Structure

Each gap-closer follows the same nine-component structure as the Phase E thickened modules:

1. In Plain Language
2. First-Principles Explanation
3. Worked Example
4. Named Misconceptions
5. If You Only Remember One Thing
6. Mnemonic / Analogy
7. Visual Primitive
8. 3 Concept-Specific Mini-Quiz Stems
9. Concept Tags

Metadata footer includes closed ETS gap, sample question validation (if any), proposed new skill ID, NASP 2020 domain, and app domain.

## Proposed New Skills Summary

The gap-closers introduce **9 new skills** that should be added to the 45-skill taxonomy, bringing the total to 54. They distribute as:

| Domain | New Skills |
|--------|-----------|
| Professional Practices (D1) | DBD-11 (PBA), DBD-12 (Low-Incidence), DBD-13 (Assessment Tech) |
| Student-Level Services (D2) | MBH-06 (Trauma-Informed), ACA-10 (Classroom Management) |
| Systems-Level Services (D3) | SSV-09 (School Climate Measurement) |
| Foundations (D4) | LEG-05 (ESSA), LEG-06 (Seclusion/Restraint/MD), RES-04 (Implementation Science) |

## Integration Path

1. **User review** of each gap-closer draft for accuracy, tone, and depth.
2. **Skill registration:** add 9 proposed new skills to `src/utils/progressTaxonomy.ts`, `src/data/skillIdMap.ts`, `src/data/skill-metadata-v1.ts`.
3. **Module registration:** add `LearningModule` entries to `src/data/learningModules.ts` using the `role: 'primary'` and `concepts: [...]` fields introduced in schema v2.
4. **Question-bank seeding:** convert the three mini-quiz stems per module into full items (write distractors, tag with skill + concept), add to question bank. 9 modules × 3 stems = 27 new question seeds.
5. **Audit re-run:** after integration, rerun `ets-5403-competency-audit.md` against the updated skill map — verify each gap's status flips from ❌ to ✅.

## Author Notes

- Tone matches Phase E: confident, test-prep voice, grounded in NASP 2020 and clinical practice.
- Content uses real cited frameworks (ACEs/Felitti & Anda, SAMHSA Four R's, Evertson & Emmer classroom management, Cohen's kappa for rubric reliability, Fixsen implementation stages, ED School Climate Surveys, FERPA data-sharing requirements) — verify citations before publication.
- Visual primitives are specified, not built.
- Quiz stems are seeds; full distractors to be written by content authors.
- One `[VERIFY:]` flag in MOD-GAP-06 (Fixsen 2–4 year full-implementation timeframe) — consistent with published NIRN guidance but confirm before publication.

---

*Generated 2026-04-18 as part of Phase E thickening follow-up. All 9 audit-identified hard gaps now closed in draft.*
