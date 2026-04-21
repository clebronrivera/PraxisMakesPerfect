# C11 — Catch-Up Diagnostic UX Copy (Decision 0.2-Modified)

**Status:** Draft complete — pending SME voice review and legal review (no promises, no loss-language).
**Blocks code task:** K13 (catch-up diagnostic flow), K14 (locked-skill gating).
**Decision reference:** `/docs/decisions/2026-04-skill-taxonomy-v2.md` §0.2.

## Context

Every existing user migrates to Taxonomy v2 immediately (their 45-skill data stays intact). The 6 new skills — MBH-06, ACA-10, DBD-11, DBD-12, RES-04, SSV-09 — are **locked** until the user completes a scoped catch-up diagnostic (~6–18 questions over the 6 new skills). On completion, `taxonomy_v2_catchup_completed_at` is set, locked skills unlock, and stats refresh.

Every surface below needs copy that is (a) non-punitive ("we added new content"), (b) opt-in-feeling but clearly important, (c) consistent with existing app voice.

**Voice model:** warm, second-person ("you"), test-prep focused, plain language. Mirrors the existing Login screen hero ("Master the Praxis 5403 with precision"), Tutorial slides ("Your personalized study companion"), and Study Modes lock states ("Unlocks after the adaptive diagnostic").

---

## Surface 1 — Dashboard banner (appears on every login until catch-up done)

**Role:** Persistent above-the-fold banner on Progress / Home screen.

- **Headline:** **Six new skills just landed. Unlock them in a short check-in.**
- **Body:** We expanded the Praxis 5403 taxonomy from 45 to 51 skills to match the newest ETS blueprint. Your existing scores are unchanged — take a short adaptive check-in (about 10 minutes) to map where you stand on the new skills, and we'll unlock them in your dashboard.
- **Primary CTA:** **Take catch-up diagnostic**
- **Secondary CTA:** **What changed?**
- **Dismissible?:** No — persistent until completion. (Do not add an "x" close button; this is a gating banner, not a dismissible announcement.)

Alternate headline options for SME review:

1. "Six new skills just landed. Unlock them in a short check-in." *(recommended — action-first)*
2. "Your Praxis 5403 map just got bigger."
3. "Six new skills are ready for you."

---

## Surface 2 — Catch-up intro dialog (launched from CTA)

**Role:** Explains what the user is about to do before the first question.

- **Title:** **Your catch-up diagnostic**
- **Subhead:** Six new skills · About 10 minutes · No time limit per question
- **Bullet 1 (why):** **Why it exists.** The Praxis 5403 blueprint now covers 51 skills — six more than when you first diagnosed. This short check-in tells us where you stand on the new skills so your dashboard, practice pools, and study guide stay accurate.
- **Bullet 2 (what):** **What it looks like.** About 6–18 questions across the 6 new skills. If you miss one, we may ask a follow-up at a lower cognitive level on the same skill. There's no time limit. You can pause and come back.
- **Bullet 3 (what happens after):** **What unlocks.** When you finish, the 6 new skills unlock in your Practice Hub and Progress tab, your readiness number refreshes against the new total (36 of 51), and — if you have one — your study guide can be regenerated with the new data.
- **Bullet 4 (what does NOT change):** **Your existing progress is safe.** Every answer you've recorded, every skill you've mastered, every module you've completed stays exactly as it is. This check-in is additive only.
- **Start button:** **Start catch-up diagnostic**
- **Cancel button:** **Not right now** *(closes dialog; banner remains on next login)*

---

## Surface 3 — Locked-skill tooltip (on hover/tap of a locked new skill in Practice or Progress)

**Role:** Explains why a particular skill is unavailable and routes the user back to catch-up.

- **Tooltip headline:** **Locked — catch-up diagnostic required**
- **Tooltip body:** This is one of the 6 new skills added in the Praxis 5403 taxonomy update. Take the catch-up diagnostic to unlock it.
- **Inline link:** **Take catch-up diagnostic →** *(routes to Surface 2 dialog)*

Visual treatment note for K14 owner: render locked skill cards at 60% opacity with a small lock icon; keep the skill name and domain color visible so users understand what's locked, not just that something is.

---

## Surface 4 — Completion toast

**Role:** Shown immediately after catch-up diagnostic submission.

- **Toast headline:** **Six new skills unlocked.**
- **Toast body:** Nice work. Your dashboard has refreshed with your new results — readiness now targets 36 of 51 skills at Demonstrating.
- **Primary action:** **View new results**
- **Secondary action:** **Back to dashboard**

Alternate toast headlines for A/B consideration:

1. "Six new skills unlocked." *(recommended — concrete)*
2. "You're caught up."
3. "Catch-up complete. New skills unlocked."

---

## Surface 5 — Admin banner

**Role:** Shown on admin dashboard `/admin/users` tab so admins know how many users have completed the catch-up.

- **Banner headline:** **Taxonomy v2 migration status**
- **Banner text:** **{completed} of {total} users** have completed the catch-up diagnostic. Users who haven't completed it still see the 6 new skills as locked in Practice and Progress; all other features continue to work normally.
- **Secondary metric (inline):** `{pending_count} pending · {stalled_7d_count} stalled (> 7 days since dashboard banner impression)`
- **Admin action link:** **Export pending users →** *(CSV of users whose `taxonomy_v2_catchup_completed_at IS NULL`)*

---

## Surface 6 — "What changed?" expandable section (linked from Surface 1 secondary CTA)

**Role:** Detail page for users who click "What changed?" from the dashboard banner. Not required for K13 MVP but drafted here so code can wire the CTA route.

- **Page title:** **What changed in the Praxis 5403 taxonomy update**
- **Section 1 — Summary:** We expanded the taxonomy from 45 to 51 skills to match ETS's current domain coverage. Six new skills were added — three to Domain II, two to Domain I, and one each to Domain III and Domain IV. Three additional sub-concepts were nested under existing skills (ESSA under IDEA; Seclusion & Restraint under IDEA; Assessment Technology under RIOT).
- **Section 2 — Your data:** Everything you've done is preserved. Existing skills kept their skill IDs and all your responses stayed intact. Your readiness target shifted from 32 of 45 to 36 of 51 skills at Demonstrating, which is the same 70% standard applied to the new total.
- **Section 3 — The 6 new skills:** Bulleted list with one-sentence descriptions (SME to confirm descriptions match module summaries):
  - **Trauma-Informed Educational Practice (MBH-06)** — Tier 1–3 trauma supports, ACEs, and the SAMHSA 4 R's.
  - **Classroom Organization and Management (ACA-10)** — Rules, routines, reinforcement, and ecology-first consultation.
  - **Performance-Based Assessment (DBD-11)** — Portfolios, rubrics, inter-rater reliability, and triangulation.
  - **Assessment of Low-Incidence Exceptionalities (DBD-12)** — Hearing/vision/physical disability assessment with multidisciplinary teams.
  - **Implementation Science and Change Management (RES-04)** — Fixsen's stages, drivers, and treatment fidelity.
  - **School Climate Measurement and Evaluation (SSV-09)** — EDSCLS, triangulation, and ESSA non-academic indicator.
- **Section 4 — What to expect:** The catch-up diagnostic takes about 10 minutes. After you complete it, the 6 new skills appear in your Practice Hub and Progress tab, and you can regenerate your study guide to incorporate the new data.
- **Back CTA:** **Take catch-up diagnostic** *(returns to Surface 2)*

---

## Voice / tone checklist

- [ ] Matches existing app voice (warm, no jargon, test-prep focused)
- [ ] No apology language ("sorry," "please excuse," "unfortunately")
- [ ] Clear action-first headlines
- [ ] Consistent term: always **"catch-up diagnostic"** (not "catch-up test," "update quiz," "v2 check," "migration assessment")
- [ ] Consistent term: always **"new skills"** (not "v2 skills," "extra skills," "expansion skills")
- [ ] Consistent framing: **additive, not punitive** ("your progress is safe," "everything you've done is preserved")
- [ ] Never says "unfortunately" or "we had to" or "you'll need to" in a blame-adjacent frame
- [ ] Never implies the user did something wrong by having old data
- [ ] Pairs every locked state with a clear route to unlock (no dead-end lock messaging)

---

## Strings-as-constants (for K13 implementation)

Recommended file: `src/data/catchupCopy.ts` — single export object so K13/K14 import a single source of truth.

```ts
export const CATCHUP_COPY = {
  banner: {
    headline: 'Six new skills just landed. Unlock them in a short check-in.',
    body: 'We expanded the Praxis 5403 taxonomy from 45 to 51 skills to match the newest ETS blueprint. Your existing scores are unchanged — take a short adaptive check-in (about 10 minutes) to map where you stand on the new skills, and we\'ll unlock them in your dashboard.',
    primaryCta: 'Take catch-up diagnostic',
    secondaryCta: 'What changed?',
  },
  introDialog: {
    title: 'Your catch-up diagnostic',
    subhead: 'Six new skills · About 10 minutes · No time limit per question',
    why: 'The Praxis 5403 blueprint now covers 51 skills — six more than when you first diagnosed. This short check-in tells us where you stand on the new skills so your dashboard, practice pools, and study guide stay accurate.',
    what: 'About 6–18 questions across the 6 new skills. If you miss one, we may ask a follow-up at a lower cognitive level on the same skill. There\'s no time limit. You can pause and come back.',
    afterUnlock: 'When you finish, the 6 new skills unlock in your Practice Hub and Progress tab, your readiness number refreshes against the new total (36 of 51), and — if you have one — your study guide can be regenerated with the new data.',
    safetyPromise: 'Every answer you\'ve recorded, every skill you\'ve mastered, every module you\'ve completed stays exactly as it is. This check-in is additive only.',
    startCta: 'Start catch-up diagnostic',
    cancelCta: 'Not right now',
  },
  lockedTooltip: {
    headline: 'Locked — catch-up diagnostic required',
    body: 'This is one of the 6 new skills added in the Praxis 5403 taxonomy update. Take the catch-up diagnostic to unlock it.',
    ctaLink: 'Take catch-up diagnostic →',
  },
  completionToast: {
    headline: 'Six new skills unlocked.',
    body: 'Nice work. Your dashboard has refreshed with your new results — readiness now targets 36 of 51 skills at Demonstrating.',
    primaryAction: 'View new results',
    secondaryAction: 'Back to dashboard',
  },
  adminBanner: {
    headline: 'Taxonomy v2 migration status',
    bodyTemplate: '{completed} of {total} users have completed the catch-up diagnostic. Users who haven\'t completed it still see the 6 new skills as locked in Practice and Progress; all other features continue to work normally.',
    secondaryMetricTemplate: '{pending} pending · {stalled} stalled (> 7 days since dashboard banner impression)',
    exportCta: 'Export pending users →',
  },
} as const;
```

K13 imports `CATCHUP_COPY` in banner/dialog/tooltip/toast components; K14 imports `CATCHUP_COPY.lockedTooltip` for locked-skill card render.
