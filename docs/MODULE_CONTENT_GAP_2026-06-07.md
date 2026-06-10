# Module Content Gap & Question↔Module Alignment — 2026-06-07

> **⏱ STATUS UPDATE 2026-06-09** — the module-ownership gap below is CLOSED: **58→67 modules**, and
> **all 45 skills now own a dedicated lesson** (the 9 previously-unowned skills got their own module in
> Pack 2). Modules also now declare `etsTopicIds` (Pack 4). Counts in the body are the original
> 2026-06-07 audit. Current state → `docs/PHASE2_REVIEW_BACKLOG.md`.

> Auto-generated audit to scope module/learning-content authoring so each **skill** the diagnostic measures aligns to dedicated module content. Source: `SKILL_MODULE_MAP`, `questions.json` (`current_skill_id`, `primaryModuleId`), `progressTaxonomy`.

**Totals:** 45 skills · 58 modules · 1150 questions.

## A. Structural summary

- Modules shared by **>1 skill**: **39 / 58**
- Modules spanning **>1 app domain**: **22 / 58**  ← these are filed under an arbitrary domain today
- Skills with **no exclusive module** (rely entirely on shared content): **30** — DBD-01, DBD-03, DBD-08, DBD-09, DBD-10, PSY-01, PSY-02, PSY-03, PSY-04, ACA-07, ACA-08, ACA-09, DEV-01, MBH-02, MBH-04, MBH-05, FAM-03, SAF-03, SWP-03, SWP-04, DIV-01, DIV-03, DIV-05, ETH-01, ETH-02, ETH-03, LEG-01, LEG-02, LEG-03, RES-02
- Skills whose **primary module is shared** with another skill (ambiguous ownership): **34** — DBD-01, DBD-03, DBD-05, DBD-08, DBD-09, DBD-10, PSY-01, PSY-02, PSY-03, PSY-04, ACA-07, ACA-08, ACA-09, DEV-01, MBH-02, MBH-03, MBH-04, MBH-05, FAM-02, FAM-03, SAF-01, SAF-03, SWP-03, SWP-04, DIV-01, DIV-03, DIV-05, ETH-01, ETH-02, ETH-03, LEG-01, LEG-02, LEG-03, RES-02

## B. Per-skill coverage (questions vs modules)

| Skill | Domain | #Q | #Modules | #Exclusive | Primary module | Primary exclusive? |
|---|---|--:|--:|--:|---|---|
| CON-01 | D1 | 34 | 4 | 3 | MOD-D2-01  | yes |
| DBD-01 | D1 | 32 | 3 | 0 | MOD-D9-04 ⚠ | NO — shared w/ DBD-08,PSY-03 |
| DBD-03 | D1 | 33 | 3 | 0 | MOD-D1-07 ⚠ | NO — shared w/ PSY-01 |
| DBD-05 | D1 | 23 | 3 | 1 | MOD-D1-10 ⚠ | NO — shared w/ ACA-03,ACA-08 |
| DBD-06 | D1 | 27 | 3 | 2 | MOD-D1-04  | yes |
| DBD-07 | D1 | 26 | 3 | 1 | MOD-D1-03  | yes |
| DBD-08 | D1 | 24 | 3 | 0 | MOD-D1-02 ⚠ | NO — shared w/ DBD-01 |
| DBD-09 | D1 | 22 | 2 | 0 | MOD-D8-01 ⚠ | NO — shared w/ PSY-04,ACA-07,DIV-01 |
| DBD-10 | D1 | 20 | 3 | 0 | MOD-D1-01 ⚠ | NO — shared w/ LEG-01 |
| PSY-01 | D1 | 22 | 3 | 0 | MOD-D1-07 ⚠ | NO — shared w/ DBD-03 |
| PSY-02 | D1 | 24 | 2 | 0 | MOD-D1-08 ⚠ | NO — shared w/ PSY-01 |
| PSY-03 | D1 | 26 | 3 | 0 | MOD-D1-06 ⚠ | NO — shared w/ SWP-04 |
| PSY-04 | D1 | 22 | 3 | 0 | MOD-D8-01 ⚠ | NO — shared w/ DBD-09,ACA-07,DIV-01 |
| ACA-02 | D2 | 23 | 2 | 1 | MOD-D3-04  | yes |
| ACA-03 | D2 | 23 | 2 | 1 | MOD-D3-06  | yes |
| ACA-04 | D2 | 26 | 2 | 1 | MOD-D3-01  | yes |
| ACA-06 | D2 | 28 | 2 | 1 | MOD-D3-05  | yes |
| ACA-07 | D2 | 24 | 2 | 0 | MOD-D3-02 ⚠ | NO — shared w/ ACA-04 |
| ACA-08 | D2 | 28 | 2 | 0 | MOD-D1-10 ⚠ | NO — shared w/ DBD-05,ACA-03 |
| ACA-09 | D2 | 20 | 2 | 0 | MOD-D4-06 ⚠ | NO — shared w/ DBD-06,ACA-08,MBH-04,MBH-05 |
| DEV-01 | D2 | 23 | 1 | 0 | MOD-D4-09 ⚠ | NO — shared w/ MBH-04 |
| MBH-02 | D2 | 24 | 3 | 0 | MOD-D4-01 ⚠ | NO — shared w/ MBH-03 |
| MBH-03 | D2 | 38 | 4 | 1 | MOD-D4-01 ⚠ | NO — shared w/ MBH-02 |
| MBH-04 | D2 | 24 | 3 | 0 | MOD-D4-05 ⚠ | NO — shared w/ SAF-01 |
| MBH-05 | D2 | 26 | 1 | 0 | MOD-D4-06 ⚠ | NO — shared w/ DBD-06,ACA-08,ACA-09,MBH-04 |
| FAM-02 | D3 | 22 | 2 | 1 | MOD-D7-01 ⚠ | NO — shared w/ DBD-09,FAM-03,DIV-01 |
| FAM-03 | D3 | 20 | 2 | 0 | MOD-D2-04 ⚠ | NO — shared w/ CON-01 |
| SAF-01 | D3 | 29 | 4 | 1 | MOD-D5-01 ⚠ | NO — shared w/ SWP-03 |
| SAF-03 | D3 | 32 | 3 | 0 | MOD-D6-03 ⚠ | NO — shared w/ SAF-04 |
| SAF-04 | D3 | 27 | 3 | 2 | MOD-D6-01  | yes |
| SWP-02 | D3 | 23 | 2 | 1 | MOD-D3-03  | yes |
| SWP-03 | D3 | 24 | 3 | 0 | MOD-D5-01 ⚠ | NO — shared w/ SAF-01 |
| SWP-04 | D3 | 32 | 3 | 0 | MOD-D1-06 ⚠ | NO — shared w/ PSY-03 |
| DIV-01 | D4 | 20 | 3 | 0 | MOD-D8-01 ⚠ | NO — shared w/ DBD-09,PSY-04,ACA-07 |
| DIV-03 | D4 | 21 | 2 | 0 | MOD-D5-04 ⚠ | NO — shared w/ SWP-04 |
| DIV-05 | D4 | 20 | 3 | 0 | MOD-D8-04 ⚠ | NO — shared w/ ACA-09 |
| ETH-01 | D4 | 33 | 2 | 0 | MOD-D10-03 ⚠ | NO — shared w/ ETH-02 |
| ETH-02 | D4 | 25 | 2 | 0 | MOD-D10-03 ⚠ | NO — shared w/ ETH-01 |
| ETH-03 | D4 | 23 | 1 | 0 | MOD-D10-07 ⚠ | NO — shared w/ ETH-01,ETH-02 |
| LEG-01 | D4 | 27 | 3 | 0 | MOD-D1-01 ⚠ | NO — shared w/ DBD-10 |
| LEG-02 | D4 | 37 | 3 | 0 | MOD-D10-01 ⚠ | NO — shared w/ DIV-05,LEG-03 |
| LEG-03 | D4 | 22 | 2 | 0 | MOD-D10-01 ⚠ | NO — shared w/ DIV-05,LEG-02 |
| LEG-04 | D4 | 24 | 2 | 1 | MOD-D10-08  | yes |
| RES-02 | D4 | 23 | 1 | 0 | MOD-D9-05 ⚠ | NO — shared w/ SWP-03 |
| RES-03 | D4 | 24 | 3 | 1 | MOD-D9-01  | yes |

## C. Multi-domain shared modules — need a primary skill OR a split

Each row is a single module currently filed under ONE arbitrary domain (first-declared skill). Decide its canonical home, or split it.

| Module | Title | Mapped skills (domain) | Filed under today |
|---|---|---|---|
| MOD-D1-01 | FERPA and Student Confidentiality | DBD-10(D1), LEG-01(D4) | DBD-10 (D1) |
| MOD-D1-06 | MTSS Tiers: What Belongs at Tier 1 vs. Tier 3 | PSY-03(D1), SWP-04(D3) | PSY-03 (D1) |
| MOD-D1-10 | Working Memory: Keeping Information 'Online' | DBD-05(D1), ACA-03(D2), ACA-08(D2) | DBD-05 (D1) |
| MOD-D10-04 | Test Protocols and Parent Access: Copyright Is Protected | DBD-10(D1), LEG-01(D4) | DBD-10 (D1) |
| MOD-D10-05 | Parental Consent for Regular Education Students | DBD-10(D1), LEG-01(D4) | DBD-10 (D1) |
| MOD-D10-06 | LRE and 'Reasonable Educational Progress' | ACA-02(D2), DIV-05(D4), LEG-02(D4), LEG-03(D4) | ACA-02 (D2) |
| MOD-D2-04 | Systemic Drug Prevention: Community Coalition Over Classroom Talks | CON-01(D1), FAM-03(D3) | CON-01 (D1) |
| MOD-D4-02 | Negative Reinforcement vs. Punishment: The Perennial Confusion | DBD-07(D1), ACA-06(D2), MBH-03(D2) | DBD-07 (D1) |
| MOD-D4-03 | Applied Behavior Analysis (ABA): Structure and Task Analysis | DBD-07(D1), MBH-03(D2) | DBD-07 (D1) |
| MOD-D4-05 | Bullying: An Abuse of Power, Not Just Aggression | MBH-04(D2), SAF-01(D3) | MBH-04 (D2) |
| MOD-D4-06 | Broca's Area, the Amygdala, and Brain-Behavior Basics | DBD-06(D1), ACA-08(D2), ACA-09(D2), MBH-04(D2), MBH-05(D2) | DBD-06 (D1) |
| MOD-D4-07 | Suicide Assessment: Never Leave the Student Alone | MBH-02(D2), SAF-03(D3) | MBH-02 (D2) |
| MOD-D4-08 | Confidentiality Limits: When to Breach and When Not To | MBH-02(D2), SAF-03(D3) | MBH-02 (D2) |
| MOD-D5-02 | RTI at the Systems Level: Not for Retention Decisions | PSY-03(D1), SWP-02(D3), SWP-04(D3) | PSY-03 (D1) |
| MOD-D5-04 | Disproportionality: Group Membership and Unequal Outcomes | SWP-04(D3), DIV-03(D4) | SWP-04 (D3) |
| MOD-D7-01 | Starting Family Collaboration: Understand Values First | DBD-09(D1), FAM-02(D3), FAM-03(D3), DIV-01(D4) | DBD-09 (D1) |
| MOD-D8-01 | Testing ELL and Diverse Students: Caution and Cultural Humility | DBD-09(D1), PSY-04(D1), ACA-07(D2), DIV-01(D4) | DBD-09 (D1) |
| MOD-D8-03 | Systemic Racism and Disproportionality: Know the Vocabulary | PSY-04(D1), DIV-01(D4), DIV-03(D4) | PSY-04 (D1) |
| MOD-D8-04 | Intellectual Disability Evaluation: WISC + Vineland Required | ACA-09(D2), DIV-05(D4) | ACA-09 (D2) |
| MOD-D9-02 | Correlations: Negative Can Be Stronger Than Positive | PSY-01(D1), RES-03(D4) | PSY-01 (D1) |
| MOD-D9-03 | Validity vs. Reliability: A Critical Distinction | PSY-02(D1), RES-03(D4) | PSY-02 (D1) |
| MOD-D9-05 | Implementation Science: Dissemination Comes First | SWP-03(D3), RES-02(D4) | SWP-03 (D3) |

## D. Question→module alignment mismatches

For each skill, do its questions' `primaryModuleId` point to a module actually mapped to that skill in `SKILL_MODULE_MAP`? A mismatch means a question for the skill teaches via a module not listed for it.

Mismatched (skill, primaryModule) pairs: **0**


Modules referenced by questions' `primaryModuleId` but absent from `SKILL_MODULE_MAP`: **0** — none

## E. Recommended target data model

Two complementary fixes (do **E1** regardless; **E2** is the content investment):

- **E1 — Canonical `primarySkillId` per module (data, cheap).** Today the browser files a module under its *first-declared* skill (arbitrary). Add one authoritative "this module primarily teaches skill X" designation per module. Modules can still be *referenced* by several skills, but each has ONE home skill→domain for grouping & priority. The 39 shared / 22 multi-domain modules below each need this single decision (which skill is the true owner).
- **E2 — Dedicated modules for under-served skills (content authoring).** 30 of 45 skills have no module of their own. A student weak in those studies content shared with (and titled for) other skills. Author skill-specific module(s) so the learning path is precise. Prioritize by question volume (§F).

Target end-state: **every skill has ≥1 exclusive primary module**, and **every module has exactly one canonical (skill, domain)**. Then question→skill→module→domain is unambiguous end-to-end.

## F. Authoring backlog — skills with NO dedicated module, ranked by question volume

These are the highest-leverage new modules to author (most-tested first). "Currently studies via" = the shared modules a weak student is sent to today.

| Rank | Skill | Name | Domain | #Q | Currently studies via (shared) |
|--:|---|---|---|--:|---|
| 1 | LEG-02 | LEG-02 | D4 | 37 | MOD-D10-01 "IDEA and Child Find: The Identification Mandate" (shared w/ DIV-05,LEG-03); MOD-D10-02 "The Stay-Put Rule: Triggered by Due Process" (shared w/ LEG-04); MOD-D10-06 "LRE and 'Reasonable Educational Progress'" (shared w/ ACA-02,DIV-05,LEG-03) |
| 2 | DBD-03 | DBD-03 | D1 | 33 | MOD-D1-07 "Reading Standard Scores on Cognitive Assessments" (shared w/ PSY-01); MOD-D1-11 "Matrices Subtests = Nonverbal / Fluid Reasoning" (shared w/ DBD-05); MOD-D8-02 "The Universal Nonverbal Intelligence Test (UNIT) for Special Populations" (shared w/ PSY-04) |
| 3 | ETH-01 | ETH-01 | D4 | 33 | MOD-D10-03 "Ethical Violations: Address at the Lowest Level First" (shared w/ ETH-02); MOD-D10-07 "NCSP Credential and NASP's Role" (shared w/ ETH-02,ETH-03) |
| 4 | DBD-01 | DBD-01 | D1 | 32 | MOD-D9-04 "RTI Data Analysis: Three Levels" (shared w/ DBD-08,PSY-03); MOD-D1-02 "RTI Data: Universal Screening vs. Progress Monitoring" (shared w/ DBD-08); MOD-D1-09 "Curriculum-Based Measurement (CBM): Progress Tracking, Not Replacement" (shared w/ DBD-08) |
| 5 | SAF-03 | SAF-03 | D3 | 32 | MOD-D6-03 "Threat Assessment: Duty to Warn" (shared w/ SAF-04); MOD-D4-07 "Suicide Assessment: Never Leave the Student Alone" (shared w/ MBH-02); MOD-D4-08 "Confidentiality Limits: When to Breach and When Not To" (shared w/ MBH-02) |
| 6 | SWP-04 | SWP-04 | D3 | 32 | MOD-D1-06 "MTSS Tiers: What Belongs at Tier 1 vs. Tier 3" (shared w/ PSY-03); MOD-D5-02 "RTI at the Systems Level: Not for Retention Decisions" (shared w/ PSY-03,SWP-02); MOD-D5-04 "Disproportionality: Group Membership and Unequal Outcomes" (shared w/ DIV-03) |
| 7 | ACA-08 | ACA-08 | D2 | 28 | MOD-D1-10 "Working Memory: Keeping Information 'Online'" (shared w/ DBD-05,ACA-03); MOD-D4-06 "Broca's Area, the Amygdala, and Brain-Behavior Basics" (shared w/ DBD-06,ACA-09,MBH-04,MBH-05) |
| 8 | LEG-01 | LEG-01 | D4 | 27 | MOD-D1-01 "FERPA and Student Confidentiality" (shared w/ DBD-10); MOD-D10-04 "Test Protocols and Parent Access: Copyright Is Protected" (shared w/ DBD-10); MOD-D10-05 "Parental Consent for Regular Education Students" (shared w/ DBD-10) |
| 9 | PSY-03 | PSY-03 | D1 | 26 | MOD-D1-06 "MTSS Tiers: What Belongs at Tier 1 vs. Tier 3" (shared w/ SWP-04); MOD-D5-02 "RTI at the Systems Level: Not for Retention Decisions" (shared w/ SWP-02,SWP-04); MOD-D9-04 "RTI Data Analysis: Three Levels" (shared w/ DBD-01,DBD-08) |
| 10 | MBH-05 | MBH-05 | D2 | 26 | MOD-D4-06 "Broca's Area, the Amygdala, and Brain-Behavior Basics" (shared w/ DBD-06,ACA-08,ACA-09,MBH-04) |
| 11 | ETH-02 | ETH-02 | D4 | 25 | MOD-D10-03 "Ethical Violations: Address at the Lowest Level First" (shared w/ ETH-01); MOD-D10-07 "NCSP Credential and NASP's Role" (shared w/ ETH-01,ETH-03) |
| 12 | DBD-08 | DBD-08 | D1 | 24 | MOD-D1-02 "RTI Data: Universal Screening vs. Progress Monitoring" (shared w/ DBD-01); MOD-D1-09 "Curriculum-Based Measurement (CBM): Progress Tracking, Not Replacement" (shared w/ DBD-01); MOD-D9-04 "RTI Data Analysis: Three Levels" (shared w/ DBD-01,PSY-03) |
| 13 | PSY-02 | PSY-02 | D1 | 24 | MOD-D1-08 "Reliability and Validity: What the Numbers Mean" (shared w/ PSY-01); MOD-D9-03 "Validity vs. Reliability: A Critical Distinction" (shared w/ RES-03) |
| 14 | ACA-07 | ACA-07 | D2 | 24 | MOD-D3-02 "Reading Programs: Phonological Processing Comes First" (shared w/ ACA-04); MOD-D8-01 "Testing ELL and Diverse Students: Caution and Cultural Humility" (shared w/ DBD-09,PSY-04,DIV-01) |
| 15 | MBH-02 | MBH-02 | D2 | 24 | MOD-D4-01 "CBT: The Most Supported School-Based Counseling Approach" (shared w/ MBH-03); MOD-D4-07 "Suicide Assessment: Never Leave the Student Alone" (shared w/ SAF-03); MOD-D4-08 "Confidentiality Limits: When to Breach and When Not To" (shared w/ SAF-03) |
| 16 | MBH-04 | MBH-04 | D2 | 24 | MOD-D4-05 "Bullying: An Abuse of Power, Not Just Aggression" (shared w/ SAF-01); MOD-D4-06 "Broca's Area, the Amygdala, and Brain-Behavior Basics" (shared w/ DBD-06,ACA-08,ACA-09,MBH-05); MOD-D4-09 "Erikson's Stages: School-Age Reference Card" (shared w/ DEV-01) |
| 17 | SWP-03 | SWP-03 | D3 | 24 | MOD-D5-01 "PBIS: The NASP-Endorsed System-Wide Practice" (shared w/ SAF-01); MOD-D5-03 "CASEL and Social-Emotional Learning" (shared w/ SAF-01); MOD-D9-05 "Implementation Science: Dissemination Comes First" (shared w/ RES-02) |
| 18 | DEV-01 | DEV-01 | D2 | 23 | MOD-D4-09 "Erikson's Stages: School-Age Reference Card" (shared w/ MBH-04) |
| 19 | ETH-03 | ETH-03 | D4 | 23 | MOD-D10-07 "NCSP Credential and NASP's Role" (shared w/ ETH-01,ETH-02) |
| 20 | RES-02 | RES-02 | D4 | 23 | MOD-D9-05 "Implementation Science: Dissemination Comes First" (shared w/ SWP-03) |
| 21 | DBD-09 | DBD-09 | D1 | 22 | MOD-D8-01 "Testing ELL and Diverse Students: Caution and Cultural Humility" (shared w/ PSY-04,ACA-07,DIV-01); MOD-D7-01 "Starting Family Collaboration: Understand Values First" (shared w/ FAM-02,FAM-03,DIV-01) |
| 22 | PSY-01 | PSY-01 | D1 | 22 | MOD-D1-07 "Reading Standard Scores on Cognitive Assessments" (shared w/ DBD-03); MOD-D1-08 "Reliability and Validity: What the Numbers Mean" (shared w/ PSY-02); MOD-D9-02 "Correlations: Negative Can Be Stronger Than Positive" (shared w/ RES-03) |
| 23 | PSY-04 | PSY-04 | D1 | 22 | MOD-D8-01 "Testing ELL and Diverse Students: Caution and Cultural Humility" (shared w/ DBD-09,ACA-07,DIV-01); MOD-D8-02 "The Universal Nonverbal Intelligence Test (UNIT) for Special Populations" (shared w/ DBD-03); MOD-D8-03 "Systemic Racism and Disproportionality: Know the Vocabulary" (shared w/ DIV-01,DIV-03) |
| 24 | LEG-03 | LEG-03 | D4 | 22 | MOD-D10-01 "IDEA and Child Find: The Identification Mandate" (shared w/ DIV-05,LEG-02); MOD-D10-06 "LRE and 'Reasonable Educational Progress'" (shared w/ ACA-02,DIV-05,LEG-02) |
| 25 | DIV-03 | DIV-03 | D4 | 21 | MOD-D5-04 "Disproportionality: Group Membership and Unequal Outcomes" (shared w/ SWP-04); MOD-D8-03 "Systemic Racism and Disproportionality: Know the Vocabulary" (shared w/ PSY-04,DIV-01) |
| 26 | DBD-10 | DBD-10 | D1 | 20 | MOD-D1-01 "FERPA and Student Confidentiality" (shared w/ LEG-01); MOD-D10-04 "Test Protocols and Parent Access: Copyright Is Protected" (shared w/ LEG-01); MOD-D10-05 "Parental Consent for Regular Education Students" (shared w/ LEG-01) |
| 27 | ACA-09 | ACA-09 | D2 | 20 | MOD-D4-06 "Broca's Area, the Amygdala, and Brain-Behavior Basics" (shared w/ DBD-06,ACA-08,MBH-04,MBH-05); MOD-D8-04 "Intellectual Disability Evaluation: WISC + Vineland Required" (shared w/ DIV-05) |
| 28 | FAM-03 | FAM-03 | D3 | 20 | MOD-D2-04 "Systemic Drug Prevention: Community Coalition Over Classroom Talks" (shared w/ CON-01); MOD-D7-01 "Starting Family Collaboration: Understand Values First" (shared w/ DBD-09,FAM-02,DIV-01) |
| 29 | DIV-01 | DIV-01 | D4 | 20 | MOD-D8-01 "Testing ELL and Diverse Students: Caution and Cultural Humility" (shared w/ DBD-09,PSY-04,ACA-07); MOD-D8-03 "Systemic Racism and Disproportionality: Know the Vocabulary" (shared w/ PSY-04,DIV-03); MOD-D7-01 "Starting Family Collaboration: Understand Values First" (shared w/ DBD-09,FAM-02,FAM-03) |
| 30 | DIV-05 | DIV-05 | D4 | 20 | MOD-D8-04 "Intellectual Disability Evaluation: WISC + Vineland Required" (shared w/ ACA-09); MOD-D10-01 "IDEA and Child Find: The Identification Mandate" (shared w/ LEG-02,LEG-03); MOD-D10-06 "LRE and 'Reasonable Educational Progress'" (shared w/ ACA-02,LEG-02,LEG-03) |
