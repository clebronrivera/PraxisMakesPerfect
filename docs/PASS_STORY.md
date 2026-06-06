# The PASS Story — Origin, Founder & Positioning

> **Canonical narrative + positioning reference for PASS (Platform for Adaptive Study Sessions).**
> This is "the story of how we got here." Use it for the About page, landing-page copy, pitch/investor
> materials, onboarding, and to keep messaging consistent across surfaces.
>
> Related canonical docs:
> - `docs/HOW_THE_APP_WORKS.md` — how the product actually works (mechanics, thresholds, features).
> - `docs/decisions/2026-05-login-hero-marketing.md` — ADR: no false psychometric/bank-size claims on the hero.
> - `audit-output/psychometric-readiness-audit.md` — the audit that grounds our honesty rules.
> - `public/mockup-pass-landing.html` — the landing page that expresses this story.

---

## 1. What PASS Is

**PASS — Platform for Adaptive Study Sessions** — is a personalized exam-prep platform built (initially)
for the **Praxis School Psychology exam (5403)**. It is not a flashcard app or a static practice test.
You take an **adaptive baseline**, an algorithm pinpoints the **most granular skills (micro-skills)** you're
actually missing, and it builds a study plan around them — so you study what moves your readiness, and skip
re-reviewing what you already know.

The brand shown to users is always **PASS** (not "Praxis.Ai," "Praxis Study," or "Praxis Makes Perfect" —
those are internal/repo names; "Praxis 5403" is the exam, not the brand).

---

## 2. The Founder — Carlos Lebron Rivera

**Carlos Lebron Rivera** — Educational Consultant · Reading Specialist · Special Education Specialist &
Advocate · Educational Assessor. Experience in **complex case management** and in **school–parent
disagreements/conflict**.

Carlos has spent his career at the hardest end of education — turning around severe academic and behavioral
need, advocating in special education, and managing the cases and conflicts most people avoid. Giving other
educators a way to study **efficiently** and reclaim their time has been a personal passion.

*(Photo + any additional credentials/degrees to be added by Carlos.)*

---

## 3. The Origin Story — from the coaching room

PASS came out of instructional **coaching**.

Carlos noticed a pattern: when teachers were pushed to **perform** for whatever pedagogical focus the
principal or district was chasing that month, it produced a *theatrical performance* — not real learning.
The teacher was sidelined from their own curiosity.

But coaching cycles worked completely differently when the **teacher came curious** — when they owned a
*perceived deficiency* or named a *pedagogical challenge* themselves, and arrived with their own idea of
what they wanted to improve. That ownership is what unlocked everything:

1. The teacher's own goal told them **what data to look at**.
2. The data told them **which specific skills or behaviors to target**.
3. Being **intentional and deliberate about every move and every selection**, and **maximizing the signal
   extracted from every type of response**, is what actually drove improvement.

Apply that same loop to a learner preparing for a high-stakes exam — curiosity-driven, data-targeted,
deliberate about every response — and you get an engine that adapts to the individual.

**From that, the Platform for Adaptive Study Sessions was born.**

---

## 4. The Method / Philosophy

PASS leverages **AI and the science of learning**, but it runs on the principles of a strong school-based
practitioner. The engine mirrors real **MTSS** workflow:

**baseline → pinpoint → target → progress-monitor**

- **Educational triage** — find the real problem fast, not the surface symptom.
- **Triangulation** — read multiple signals at once (accuracy, confidence, error patterns, timing) to
  converge on the true gap.
- **Response to intervention (RTI)** — target, then re-check; let the data drive the next move.
- **Granular / micro-skill targeting** — go beneath the broad skill to the exact sub-skill behind a miss.
- **Deliberate by design** — every trigger, activity, and selection in the platform is curated so that
  **everything you answer or do adapts to the way *you* learn — not the average test-taker.**
- **Efficiency** — because it targets micro-skills, you skip re-studying what you already know. Study less,
  pass faster.

The learning-science mechanisms it actually uses: **spacing, retrieval practice, and interleaving.**

---

## 5. Positioning & Voice (how we talk about PASS)

These are the messaging rules we've settled on. Keep them consistent across every surface.

| Do | Don't |
|---|---|
| Speak to **practitioners** (teachers, educators) in their language: adaptive baseline, MTSS, tiered/data-based decision-making, progress monitoring, micro-skills. | Talk like a generic test-prep mill. |
| Lead with the **adaptive baseline** + **granular / micro-skill diagnosis**. | Lead with "names your misconception" — it's one *supporting* feature, not the headline. The product does more. |
| Use **"micro-skills"** consistently. | Mix in "sub-skill / granular skill" inconsistently. |
| Credit the **algorithm + 15+ yrs MTSS/education + science of learning**, in the **founder's first-person voice** for track-record claims. | State experiential/track-record claims as if they were objective product facts. |
| Frame **time saved** qualitatively (target micro-gaps, skip the known). | Fabricate hours/percentages. |
| Keep counts **flexible** — "every skill / the entire exam blueprint." | Commit to fixed counts like **"45 skills" / "4 domains"** — the structure may change with Praxis blueprint analysis. |
| Use honest proof points: *adaptive diagnostic · names your misconceptions · plan from your data.* | Claim **"IRT-calibrated," "2PL IRT model," "1,150 calibrated items."** These are **FALSE** — the bank has no IRT parameters (see the psychometric audit). |
| Brand = **PASS** (tagline: *Platform for Adaptive Study Sessions* / hero tagline *"A study plan that listens."*). | "Praxis.Ai," "Praxis Study," etc. |

Current landing headline: **"Find the exact skills holding you back."**

---

## 6. How We Got Here — Decisions & History

**Product:** built by Carlos Lebron Rivera out of his coaching/intervention practice (see §3).

**Design & positioning journey (2026-05):**

- **Brand confirmed = PASS.** Mockups had drifted to "Praxis.Ai"; corrected. (See memory `project_brand_is_pass`.)
- **Honesty fix — removed false psychometric claims.** The live login hero + `?boot=1` boot terminal
  asserted "1,150 calibrated items," "IRT-calibrated," and a fabricated "2PL IRT model." The audit confirms
  none exist. Replaced with honest proof points. (ADR `docs/decisions/2026-05-login-hero-marketing.md`;
  branch `fix/login-hero-false-psychometrics`; memory `project_hero_no_psychometric_claims`.)
- **Repositioned to practitioner/MTSS framing** — lead with adaptive baseline + granular/micro-skill
  diagnosis instead of "names your misconception." (Memory `project_landing_positioning`.)
- **Removed fixed counts** ("45 skills" / "4 domains") from the landing and the embedded dashboard preview —
  count-flexible language, because the blueprint/skill structure may evolve.
- **Added the time-saved / efficiency story** — the algorithm targets micro-skills, so you don't re-study
  what you know.
- **Built the landing page** (`public/mockup-pass-landing.html`) — multi-section scrolling page with a
  premium "show the product" hero (live dashboard preview), the "Why it's faster" section, and this
  **founder's note**.
- **Captured the founder story** (Carlos's credentials + the coaching origin) directly from him — preserved
  below.

**Visual direction:** the cool/premium "show the product" hero on a **middle twilight canvas** (between dark
and bright multi-gradient), with a live embedded dashboard window + floating micro-skill / mastery cards.
The broader app re-theme is the **bright multi-gradient** ("Praxis Bright Multi-Gradient": violet→indigo
chrome + cyan/emerald/rose/amber domain gradients; `public/mockup-retheme-allscreens.html`).

---

## 7. Source Material — the founder's own words (preserved)

> *Leveraging the power of AI, the science of learning, experience in intervention and data response — an
> educational expert who has successfully turned around the most severe cases of academic and behavioral
> deficiencies, with a proven track record of efficacy and response to intervention. By using the very
> concepts of educational triage, intervention, and triangulation, I have carefully curated the response of
> certain triggers and activities in the platform so that EVERYTHING you are answering or doing in the
> platform is adapting to the way you learn.*

> *Carlos Lebron Rivera — Educational Consultant, Reading Specialist, Trained Special Education Advocate,
> Educational Assessor, Special Education Specialist; experience with complex case management and in
> school–parent disagreements/conflict. Completing this platform and giving other educators even better
> opportunities to maximize time by studying efficiently has been my passion over the years.*
>
> *As a coach, I was encouraged to provide feedback often on pedagogical elements that the principal or
> district was focusing on — often sidelining/forcing the teacher to give a theatrical performance rather
> than truly being able to explore their curiosities and have a meaningful learning experience as a teacher.
> But when teachers engaged in coaching cycles with me and were able to be curious about a topic — due to a
> perceived deficiency, or having identified the pedagogical challenge — the teacher came with an idea of
> what he wanted to improve on. And that helped us determine what kind of data we would look at and what
> specific skills or behaviors we're going to target in order to improve. It's by targeting these skills and
> being intentional and deliberate about every one of the user's moves and every selection, and maximizing
> the amount of data that we could extract from all types of responses. And through that, the Platform for
> Adaptive Study Sessions was born.*

---

*Maintainers: keep §5 (Positioning & Voice) in sync with the landing copy and the memories it references.
When the founder finalizes credentials, photo, or exact bio wording, update §2 and §7.*
