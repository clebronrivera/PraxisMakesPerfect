# Misconception → Module Coverage Matrix (§3.1)
**Date:** 2026-06-06 · Generated from `src/data/questions.json`, `src/data/learningModules.ts`, `src/utils/progressTaxonomy.ts`
**Companion data:** [`coverage_matrix.csv`](coverage_matrix.csv) (750 skill×cluster rows) · [`cluster_ranking.csv`](cluster_ranking.csv) (20 clusters)

This is the §3.1 coverage pass the audit called for before building the live path. It is a **content/routing** analysis on the verified-clean id graph — not an id audit.

---

## 1. Headline finding — the routing key is wrong in the audit

The audit's §3.2 / open-decision #2 recommends keying `MISCONCEPTION_MODULE_MAP` on **`error_cluster_tag`** for authorability. The data says **don't** — at least not on the cluster tag *alone*.

| Routing key | Distinct keys | Routes to one module? | Verdict |
|---|---|---|---|
| `error_cluster_tag` alone | **20** | **No** — each tag spans 25–41 modules; the single most-common module covers only **5–15%** of the tag's questions | Too coarse. It's a cross-skill *error taxonomy*, not a topic. Routing on it sends students to the wrong module 85–95% of the time. |
| **`(skill_id, error_cluster_tag)` pair** | **750** | **Yes** — median module concentration **100%**; **90%** of pairs map to exactly one module | **Use this.** Deterministic, and still authorable. |
| per-question `moduleRefs[]` | n/a | already routed — 100% of questions, avg **2.6** refs each, all valid | Already exists. The live path can launch on this with **zero authoring**. |

**Why it matters:** "scope-undergeneralization" means something different on a consultation item than on an eligibility item. The skill supplies the topic; the cluster supplies the *error shape*. You need both to land on the right teaching section.

**Two consequences for the build plan:**

1. **You may not need a hand-authored map for v1 at all.** `moduleRefs[]` already encodes per-question module routing for all 1,150 questions. `deriveLivePath()` (Stage E) can aggregate those directly — rank modules by the student's wrong-answer clusters using the routing the questions already carry. Treat `MISCONCEPTION_MODULE_MAP` as a later **curation/override** layer, not a prerequisite.
2. **If you do author the map, key it on `(skill_id, cluster)`** — 750 entries, 90% single-module so largely auto-derivable from this CSV, leaving only ~75 ambiguous pairs for human judgment.

---

## 2. The 20 clusters, ranked by volume

The cluster space is small and fully authorable (the audit was right about *size*). 14 of 20 clusters cover 80% of tagged questions. 1,149 / 1,150 questions carry a tag.

| # | Cluster | Questions | Skills spanned | Modules spanned |
|---|---|---:|---:|---:|
| 1 | scope-undergeneralization | 95 | 45 | 41 |
| 2 | model-conflation | 90 | 43 | 38 |
| 3 | label-retrieval | 89 | 45 | 37 |
| 4 | scope-overgeneralization | 77 | 44 | 38 |
| 5 | component-confusion | 77 | 43 | 38 |
| 6 | prerequisite-skipping | 66 | 43 | 35 |
| 7 | purpose-confusion | 64 | 43 | 36 |
| 8 | tier-level-confusion | 59 | 39 | 33 |
| 9 | sequence-inversion | 59 | 38 | 34 |
| 10 | indirect-direct-confusion | 58 | 40 | 34 |
| 11 | treatment-assessment-confusion | 52 | 38 | 31 |
| 12 | role-confusion | 52 | 39 | 31 |
| 13 | validity-reliability-confusion | 45 | 34 | 30 |
| 14 | eligibility-criteria-confusion | 43 | 37 | 31 |
| 15 | developmental-stage-mismatch | 41 | 31 | 25 |
| 16 | population-confusion | 40 | 34 | 28 |
| 17 | causation-correlation | 40 | 33 | 28 |
| 18 | overgeneralization | 39 | 31 | 26 |
| 19 | norm-criterion-confusion | 36 | 27 | 25 |
| 20 | consent-confidentiality-confusion | 27 | 23 | 20 |

The high "modules spanned" column is the whole point of §1: these tags are orthogonal to topic.

---

## 3. Coverage gaps (the actual content work)

Routability is **100%** — every (skill, cluster) pair already points at a real module via `primaryModuleId`, all within the skill's `SKILL_MODULE_MAP`. So the gap is **not** missing routes; it's **teaching depth** at the modules those routes land on.

**Thin-module gap.** 57 of 750 skill×cluster pairs route to a module with **fewer than 3 sections** — too shallow to reliably teach a remediation. They concentrate in just 4 modules; these are the priority authoring targets:

- `MOD-D4-04`
- `MOD-D5-02`
- `MOD-D6-03`
- `MOD-D10-08`

**Overloaded-module gap.** A handful of modules are the primary route for 30–40 distinct skill×cluster pairs each while having only 3–4 sections. They aren't "thin," but they're carrying disproportionate load and should be reviewed for whether their sections actually span the range of errors routed to them:

| Module | Pairs routed here | Sections |
|---|---:|---:|
| MOD-D10-07 | 39 | 3 |
| MOD-D5-01 (PBIS: NASP-Endorsed System-Wide Practice) | 38 | 3 |
| MOD-D4-06 | 37 | 3 |
| MOD-D10-01 (IDEA and Child Find) | 36 | 4 |
| MOD-D8-01 (Testing ELL and Diverse Students) | 35 | 3 |
| MOD-D9-04 (RTI Data Analysis: Three Levels) | 33 | 3 |
| MOD-D8-04 (Intellectual Disability Evaluation) | 33 | 3 |
| MOD-D4-01 (CBT: Most Supported School-Based Counseling) | 28 | 4 |

Full per-pair detail (with concentration %, section count, and a `THIN` flag) is in `coverage_matrix.csv`.

---

## 4. Recommended next steps (updates the audit's plan)

1. **Revise §3.2 / decision #2:** key any `MISCONCEPTION_MODULE_MAP` on `(skill_id, error_cluster_tag)`, not `error_cluster_tag` alone. 90% of the 750 entries are auto-derivable from `coverage_matrix.csv`.
2. **Build Stage E (`deriveLivePath`) on existing `moduleRefs[]` first** — no authoring needed to prove the loop. The map becomes an override layer later.
3. **Author content against §3 gaps, not a flat top-20:** the 4 thin modules first, then a depth review of the ~8 overloaded modules. That's a far smaller, better-targeted job than "fill all clusters."
4. **Per CLAUDE.md:** module-behavior or path-unlock changes require a `docs/HOW_THE_APP_WORKS.md` update in the same change; UI surfacing (Stage B/D/F) follows the mockup-first/approval rule.

---

*Method note: clusters from `error_cluster_tag`; module section counts parsed from `learningModules.ts` `sections[]`; concentration = share of a pair's questions whose `primaryModuleId` is the modal module. One question has no cluster tag (excluded). "Thin" = route module has <3 sections.*

---

## Appendix A — Actual section content for the 12 priority modules

Reading the real sections changes the gap list. **Two corrections to §3:**

- **The "overloaded module" alarm in §3 was overstated by the raw section count.** Most of those modules use `comparison` and `interactive` sections that *are* substantive teaching but read as a single `type:` each. CBT (MOD-D4-01), IDEA (MOD-D10-01), and PBIS (MOD-D5-01) are structurally fine — paragraph + comparison/interactive + anchor. They carry high cluster load, but that's expected: **a module teaches its topic; the 20 cluster tags are orthogonal error-shapes, not separate things to teach.** Don't author per-cluster sections into them.
- **The genuine content gaps are narrower than 4+8.** They are the modules that are *literally* short-form prose or bare reference lists while carrying real question volume.

### Genuine authoring targets (real gaps)

| Module | Title | What's actually there | Qs routed | Why it's a gap |
|---|---|---:|---:|---|
| **MOD-D10-08** | Major Legal Cases — Quick Reference | 1 paragraph + 1 bare `list` | 24 | It's a lookup table, not a teaching module. 24 questions route here for remediation and get a reference list. **Highest priority** — either build it into a real module or re-route its questions. |
| **MOD-D6-03** | Threat Assessment: Duty to Warn | 2 paragraphs only | 31 | High-stakes topic, 31 questions, zero comparison/interactive/anchor scaffolding. |
| **MOD-D5-02** | RTI at the Systems Level: Not for Retention | 2 paragraphs only | 29 | Same shape — short prose carrying real load. |
| **MOD-D4-04** | Reinforcement Fading: Teaching Independence | 2 paragraphs only | 8 | Genuinely thin, but only 8 questions — **low priority.** |
| MOD-D10-07 | Major Legal Cases — Quick Reference (NASP/supervision) | paragraph + paragraph + anchor | 47 | Reference-style and the **single highest-volume route** (47 qs). Worth a depth review even though it has 3 sections. |

### Structurally adequate — leave alone (high load, but real sections)

| Module | Title | Sections present | Qs routed |
|---|---|---|---:|
| MOD-D4-01 | CBT: Most Supported School-Based Counseling | paragraph ×2 + comparison + interactive(click-selector) | 42 |
| MOD-D10-01 | IDEA and Child Find | paragraph ×2 + comparison + anchor | 58 |
| MOD-D5-01 | PBIS: NASP-Endorsed System-Wide Practice | paragraph ×2 + anchor (+core-features) | 50 |
| MOD-D4-06 | Suicide Assessment: Never Leave the Student Alone | paragraph ×2 + comparison | 55 |
| MOD-D8-04 | Intellectual Disability Evaluation: WISC + Vineland | paragraph ×2 + anchor | 36 |
| MOD-D8-01 | Testing ELL and Diverse Students | paragraph ×2 + anchor | 44 |
| MOD-D9-04 | RTI Data Analysis: Three Levels | paragraph + list + paragraph | 50 |

**Net:** the real authoring backlog is **3 modules** (MOD-D10-08, MOD-D6-03, MOD-D5-02) plus a depth review of the two reference-list modules (MOD-D10-08 again, MOD-D10-07). MOD-D4-04 is optional (low volume). Everything I previously flagged as "overloaded" can stay as-is.

*Appendix method: section content parsed directly from each module's `sections[]` block in `learningModules.ts`; cluster/skill load = questions whose `primaryModuleId` equals the module. "Qs routed" counts all questions landing on the module regardless of cluster.*
