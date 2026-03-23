# Praxis 5403 — Complete Reference (Repo)

Status: Active. **Maintained** alongside product and taxonomy changes.

This document is the **single place in `docs/` for Praxis School Psychology (5403) exam structure as implemented in Praxis Makes Perfect** — official-style scope (four domains, forty-five skills), where the numbers live in code, and how question banks relate. It does not replace ETS/Pearson materials; it anchors internal consistency.

---

## Exam identity

| Field | Value |
|--------|--------|
| Exam | **Praxis School Psychology** |
| Test code | **5403** |
| Role in this app | Primary certification exam targeted by onboarding, practice, assessments, and reporting |

User-facing narrative also lives in [HOW_THE_APP_WORKS.md](./HOW_THE_APP_WORKS.md).

---

## Content structure: four domains, forty-five skills

Reporting, readiness, and practice use **four Praxis domains** and **forty-five skills**. Canonical definitions:

- **Domains and skills:** [`src/utils/progressTaxonomy.ts`](../src/utils/progressTaxonomy.ts) — `PROGRESS_DOMAINS`, `PROGRESS_SKILLS`

### Domains (reporting)

| ID | Name | Subtitle (short scope) |
|----|------|-------------------------|
| 1 | Professional Practices | Assessment, consultation, and data-based decision making |
| 2 | Student-Level Services | Academic, developmental, and mental health supports |
| 3 | Systems-Level Services | Family, schoolwide, and systems practice |
| 4 | Foundations of School Psychology | Ethics, law, diversity, and research |

### Skills by domain (45 total)

**Domain 1 — Professional Practices (13)**  
`CON-01`, `DBD-01`, `DBD-03`, `DBD-05`, `DBD-06`, `DBD-07`, `DBD-08`, `DBD-09`, `DBD-10`, `PSY-01`, `PSY-02`, `PSY-03`, `PSY-04`

**Domain 2 — Student-Level Services (12)**  
`ACA-02`, `ACA-03`, `ACA-04`, `ACA-06`, `ACA-07`, `ACA-08`, `ACA-09`, `DEV-01`, `MBH-02`, `MBH-03`, `MBH-04`, `MBH-05`

**Domain 3 — Systems-Level Services (8)**  
`FAM-02`, `FAM-03`, `SAF-01`, `SAF-03`, `SAF-04`, `SWP-02`, `SWP-03`, `SWP-04`

**Domain 4 — Foundations (12)**  
`DIV-01`, `DIV-03`, `DIV-05`, `ETH-01`, `ETH-02`, `ETH-03`, `LEG-01`, `LEG-02`, `LEG-03`, `LEG-04`, `RES-02`, `RES-03`

Full labels (e.g. “Functional Behavioral Assessment”) are in `PROGRESS_SKILLS` in the same file.

---

## NASP ten-domain skill map (detailed authoring model)

Item authoring, explanations, and some tooling use a **ten-domain** NASP-style map with granular `DBDM-S01`–style IDs. That structure is **not** the same ID scheme as the forty-five progress skills above; questions still resolve to progress skills for scoring and UI.

- **Location:** [`src/brain/skill-map.ts`](../src/brain/skill-map.ts) — `SKILL_MAP`, per-skill `questionIds`

When domain or skill *counts* or *names* for **user-facing** copy change, update [HOW_THE_APP_WORKS.md](./HOW_THE_APP_WORKS.md) in the same change (see repo rule in `CLAUDE.md`).

---

## Question banks and files

| Asset | Path | Role |
|--------|------|------|
| **Canonical runtime bank** | `src/data/questions.json` | Loaded by the app; assessments and practice |
| **900-question practice bundle** | `praxis_5403_practice_questions_900q.json` | Skill-review practice; must stay aligned with bank fixes when content overlaps |

The JSON bundle declares provenance:

```json
"source": "Praxis_5403_Complete_Question_Bank_900Q.md"
```

That markdown source file is **not** tracked in this repository; treat this reference doc plus the JSON as the maintained story for the bundle. If the `.md` is ever added or renamed, update the `source` field and this section together.

**Data-integrity rules** for edits: [WORKFLOW_GROUNDING.md](./WORKFLOW_GROUNDING.md) (section on question bank integrity / merged options).

---

## Related documentation

| Doc | Why |
|-----|-----|
| [HOW_THE_APP_WORKS.md](./HOW_THE_APP_WORKS.md) | Screener/full counts, unlocks, thresholds — must stay aligned with product |
| [WORKFLOW_GROUNDING.md](./WORKFLOW_GROUNDING.md) | Assessment wiring, question bank maintenance |
| [DOCS_SYSTEM.md](./DOCS_SYSTEM.md) | Where this file sits in the doc set |

---

## Maintenance checklist

Update **this file** when:

- Any **domain name**, **domain count**, **skill count**, or **skill ID list** in `progressTaxonomy.ts` changes.
- The **canonical bank path** or **900q bundle** role changes.
- The **NASP skill map** (`skill-map.ts`) is restructured in a way that authors need to know about.

Update **HOW_THE_APP_WORKS.md** in the same commit when those changes are **user-visible** (same rule as other product docs).
