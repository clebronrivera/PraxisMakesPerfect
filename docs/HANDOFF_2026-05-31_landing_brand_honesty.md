# Handoff — Landing Page, Rebrand & Honesty Fix (2026-05-31)

> Self-contained continuation doc for the 2026-05-31 session. Captures every thread, branch/PR state,
> decisions, and next steps so anyone (or a future Claude session) can pick up cold.
>
> ## ✅ RESUME HERE
> This session's work lives on branch **`explore/dashboard-redesign`** — **pushed to origin 2026-05-31**,
> so it's backed up. To continue in a new context window:
> ```
> git checkout explore/dashboard-redesign     # mockups + landing + docs
> preview_start("mockup")                      # serves public/*.html on :3033
> open http://localhost:3033/mockup-pass-landing.html
> ```
> **Outstanding production action:** ~~merge **PR #30** (boot-terminal honesty fix) once CI is green.~~
> ✅ **DONE 2026-06-01** — PR #30 squash-merged (commit `73a48be`); honesty track closed. Next up is
> the **landing polish → React implementation** decision (see "Open items" below).

---

## TL;DR

- Built a full **marketing landing page** mockup (`public/mockup-pass-landing.html`) — multi-section,
  premium "show the product" hero with a **live embedded dashboard**, new practitioner positioning, and a
  **founder's note**.
- **Rebranded** mockups to **PASS**; removed **false IRT/calibration claims**; removed **fixed counts**
  ("45 skills / 4 domains") in favor of **micro-skill** language.
- **Shipped the honesty fix** as **PR #30** (boot terminal). The login *hero* was already fixed on `main`
  by PR #27 mid-session, so the original PR #29 was closed.
- Created **`docs/PASS_STORY.md`** — canonical origin + positioning reference.
- Everything visual is still **mockup-stage** — there is **no React implementation** of the landing or
  re-theme yet.

---

## Where the work is — branches & PRs

| Branch / PR | What it is | State |
|---|---|---|
| **`explore/dashboard-redesign`** (local only ⚠️) | ALL session mockups + landing + founder's note + `PASS_STORY.md` + green-field concepts + recovered re-theme | 16 commits, **NOT pushed** |
| **PR #30** · `fix/boot-irt-claim` | Boot-terminal "2PL IRT model" honesty fix (off current `main`) | **OPEN**, `MERGEABLE`, `npm run check` green (153 tests), `BLOCKED` only on CI/review |
| PR #29 · `fix/login-hero-false-psychometrics` | Original honesty fix (hero + boot), built on stale `main` | **CLOSED** (superseded by #27 + #30); stale branch still on origin |
| PR #27 (merged) | "Restore Cognitive Clarity" — already generalized the login **hero** (removed the calibrated-items stat row) + landed the ADR | **MERGED to `main`** |
| PR #28 · `fix/cc-clarity-missed-components` | CC clarity + a11y pass (predates this session, **not ours**) | OPEN |
| `main` (origin) | Hero is honest (via #27); boot terminal still has the false "2PL IRT model" until **#30** merges | — |

**Net production honesty state:** hero already clean on prod; boot fix queued in **PR #30** → merge it to
close the integrity track.

---

## Work streams & status

1. **Recovered the approved re-theme from a stash** — the "Praxis Bright Multi-Gradient" 8-screen mockup
   (`mockup-retheme-allscreens.html`) + its handoff had been left untracked and swept into a stash
   (nearly lost). Recovered + committed. ✅
2. **Green-field home concepts** (Named Beliefs / Verdict / Briefing) — explored, then the user redirected
   back to the multi-gradient re-theme. Mockups kept (`mockup-home-*.html`) but **not** the chosen direction.
3. **Re-theme: 8 screens mocked** — added AI Tutor, Glossary, Login to the canonical
   `mockup-retheme-allscreens.html`. ✅ (Implementation plan: `docs/HANDOFF_indigo_violet_retheme.md`,
   Stage 2a→2b→2c — **not started**.)
4. **Brand → PASS** — fixed "Praxis.Ai" drift in mockups. ✅ (memory `project_brand_is_pass`)
5. **Honesty fix** — false "1,150 calibrated items · IRT-calibrated" / "2PL IRT model." Hero fixed on `main`
   by PR #27; boot fix in **PR #30**. ✅/pending-merge (memory `project_hero_no_psychometric_claims`,
   ADR `docs/decisions/2026-05-login-hero-marketing.md`)
6. **Login hero visual** — abandoned the abstract "Adaptive Engine" orb (user: too generic) → premium
   "show the product" hero. Final pick: **middle twilight canvas + LIVE embedded dashboard**
   (`mockup-login-cool-mid.html`; dark & bright variants also exist).
7. **Landing page** — `public/mockup-pass-landing.html` (see next section). ✅ draft
8. **`PASS_STORY.md`** — canonical narrative + positioning. ✅

---

## The landing page (`public/mockup-pass-landing.html`)

Multi-section scrolling page, dark-twilight premium aesthetic, PASS brand. Section order:

`hero` → `how it works` → `micro-skill precision` → `the method` → `why it's faster` → `your plan` →
`founder's note` → `final CTA` → `footer`.

**Hero:** headline **"Find the exact skills holding you back."**; subhead frames the adaptive baseline +
algorithm (built from Carlos's experience) + micro-skills; a **live embedded dashboard** (iframe of
`mockup-retheme-allscreens.html`, switcher cropped, "LIVE" badge) with a floating **"Micro-skill pinpointed"**
card + a mastery toast.

**Founder's note ("Why I built PASS"):** Carlos Lebron Rivera + credentials, the coaching-room origin story,
the methodology (triage / triangulation / RTI / micro-skill targeting / everything-adapts), ending on the
PASS name reveal. **`photo` is a placeholder.**

**Copy/positioning decisions baked in (keep consistent):**
- Lead with **adaptive baseline + granular/micro-skill diagnosis**, NOT "names your misconception."
- Use **"micro-skills"** consistently.
- **No fixed counts** — no "45 skills" / "4 domains" anywhere on the landing OR the embedded dashboard
  preview (softened `13 of 45 skills` → `13 skills at Demonstrating`). The count may change with Praxis
  blueprint analysis.
- **No false psychometric claims** (no IRT/calibration/bank-size).
- **Time-saved** framing is **qualitative** (no fabricated hours).
- Bio line (current): *"Built by an educator…"*; full credentials in the founder's note.

Screenshot capture note: the preview tool mis-renders scrolled sections (white frames). Workaround used this
session: hide the hero iframe + disable `backdrop-filter`, then shift the page with
`document.body.style.marginTop = '-Npx'` and screenshot at scroll 0.

---

## Open items / next steps (prioritized)

1. ✅ ~~PUSH `explore/dashboard-redesign`~~ — pushed to origin 2026-05-31.
2. ✅ ~~Merge PR #30~~ — merged 2026-06-01 (commit `73a48be`); honesty track closed.
3. **Landing polish:** add Carlos's **photo**; confirm exact **bio/credential** wording; optional —
   personalize the hero trust line with his name; optional — pull "everything adapts to the way you learn"
   into its own full-width band.
4. **Possible new landing sections:** "who it's for," pricing, FAQ, testimonials/social proof.
5. **Implementation decision (the big one):** turn the approved mockups into React —
   (a) the **landing** as a real marketing/login page, and (b) the **re-theme** in-app
   (Stage 2a→2b→2c per `docs/HANDOFF_indigo_violet_retheme.md`). All still mockup-stage.
6. **Rollout/branch strategy:** decide how the `explore/dashboard-redesign` work reaches production
   (it's not destined for `main` as-is — it's mockups + docs). Likely: cherry-pick docs/PRs, build React on
   fresh branches off `main`.
7. **Minor flags:** the embedded dashboard still shows four domain *cards* (structure, no count text — soften
   if domain layout may change); the non-landing **Progress** screen still has per-domain "/11" counts;
   the stale `fix/login-hero-false-psychometrics` branch (PR #29 closed) can be deleted on origin.

---

## How to resume

- **Preview:** `preview_start("mockup")` (Claude Preview, port 3033) serves `public/*.html`; or
  `open http://localhost:3033/mockup-pass-landing.html`. The server naps between turns — just restart it.
- **Key mockups:** `mockup-pass-landing.html` (landing), `mockup-retheme-allscreens.html` (8-screen re-theme,
  also embedded in the landing hero), `mockup-login-cool-mid.html` (chosen hero; `-cool.html` dark /
  `-cool-bright.html` bright variants).
- **Mockup-first rule** (`CLAUDE.md`) still applies: build HTML mockups, **screenshot inline**, get visual
  approval before any React. Don't rename status/proficiency labels (product law).
- **Communication:** the user writes in shorthand/typos (voice-to-text) — interpret via context, finish the
  idea with the most logical next step, ask when unsure (memory `feedback_user_comm_style`).

---

## References

- `docs/PASS_STORY.md` — canonical origin story + positioning rules.
- `docs/decisions/2026-05-login-hero-marketing.md` — ADR (no false/bank-size claims; now explicitly covers
  the `?boot=1` boot terminal).
- `audit-output/psychometric-readiness-audit.md` — confirms the bank is **not** IRT-calibrated (grounds the
  honesty rules).
- `docs/HANDOFF_indigo_violet_retheme.md` — the re-theme React implementation plan.
- `docs/HOW_THE_APP_WORKS.md` — product mechanics (source of truth for how the app behaves).
- **Memories:** `project_brand_is_pass`, `project_hero_no_psychometric_claims`, `project_landing_positioning`,
  `feedback_always_screenshot_mockups`, `feedback_user_comm_style`, `project_dashboard_redesign`,
  `project_preferred_design_scheme`.
