# Brief — Green-field Reimagining of the Home Experience

> **Read this first, in a NEW chat, before looking at any code or mockup.**
> This brief exists because the last redesign pass (`HANDOFF_dashboard_hybrid_redesign.md`) was
> judged **too anchored to the current build** — it reorganized existing surfaces rather than
> rethinking the experience. Your job is the opposite: **design from first principles.** Forget how
> the app looks today. Forget the color system. Possibly forget the word "dashboard."

---

## Your mission

Reimagine the **signed-in home experience** for a Praxis 5403 (School Psychology) exam-prep app,
with **no inherited constraints**:

- **No color restriction.** The bright violet/indigo system is NOT a requirement here. Propose
  whatever palette/typography/mood serves the experience. (A separate locked-color track exists; this
  brief is deliberately unshackled from it.)
- **No layout inheritance.** Do not assume a left sidebar + grid of cards. The home could be a
  conversation, a single verdict, a briefing, a map, a timeline — whatever the job demands.
- **No feature-preservation mandate.** You may argue that things currently on the home don't belong
  there, and that things currently buried should be the centerpiece.

The bar: bring a **genuinely fresh perspective** and **surface what the product is sitting on but not
capitalizing on.**

---

## Anti-anchoring protocol (important — follow the order)

1. **Do NOT open the current dashboard component or existing mockups first.** Read this brief, then
   `HOW_THE_APP_WORKS.md` (product truth) and `ANALYTICS_DATA_INVENTORY.md` (data truth) — those
   describe the *substrate*, not the *solution*.
2. **Design from the job-to-be-done and the data assets** (below) before you look at anything visual.
3. **Only after you have ≥3 divergent directions of your own**, look at
   `public/mockup-dashboard-hybrid.html` + `HANDOFF_dashboard_hybrid_redesign.md` — purely to make sure
   you're not unconsciously repeating that pass. Treat it as the baseline to beat, not a template.

---

## Who the user is (design for the human, not the data)

A graduate student or career-changer studying for a high-stakes licensure exam. They are typically:
**anxious, time-poor, and uncertain whether they'll pass.** Their real questions, in priority order:

1. **"Am I going to pass?"** (and they rarely get an honest answer anywhere)
2. "If not yet — what's actually wrong, and is it fixable in my timeframe?"
3. "What do I do in the next 30 minutes that matters most?"
4. "Am I making progress, or spinning?"

The current product answers #3 and #4 partially and **never answers #1 or #2 directly.** Sit with that.

---

## The under-capitalized assets (the real raw material)

These are computed/stored capabilities the product barely exposes. Each is a potential *spine* for a
reimagined home — not just another card. Mine these hard.

1. **A misconception engine almost no competitor has.** Every wrong-answer option (≈3,587 of them) is
   pre-classified with the *specific false belief* it represents + the knowledge gap behind it. The
   product can tell a student **what they believe that is wrong**, by name. Today this is a footnote.
   → What if the entire home were organized around *belief correction* instead of *score chasing*?

2. **Confidence / calibration data.** Every answer carries a confidence signal. Mis-calibration
   (confident + wrong) is one of the strongest predictors of exam failure and the hardest thing to
   self-detect. → A metacognition layer ("you are overconfident in 3 areas") is almost unheard of in
   prep apps and the data is already here.

3. **A latent knowledge graph.** Skills have **prerequisite chains** and NASP-domain mappings; the
   path is already sorted by prerequisite depth. → Root-cause framing: "you keep failing X because you
   never locked its prerequisite Y" beats a flat ranked list of weak skills. Nobody is showing the
   *structure* of the student's gaps.

4. **A dormant spaced-repetition system.** A full Leitner schedule (5 boxes, due dates) is computed
   and explicitly sitting in "shadow mode, will surface later." → A review/retention experience is
   pre-built and invisible.

5. **Enough signal to predict a pass.** Accuracy, confidence-weighting, trend, coverage, and a
   readiness target all exist. → A **predicted pass-probability / score band with honesty about
   uncertainty** could answer question #1 directly. High-risk, high-reward — handle truthfully.

6. **A temporal dimension that's barely used.** `planned_test_date` is collected and never shown. →
   The home for someone 6 months out should look nothing like the home for someone 8 days out. Should
   the experience be **phase-adaptive**?

7. **Real cohort data.** Cross-user stats already power a leaderboard. → Normative benchmarking
   ("students who passed had locked Ethics by this point") is more motivating than a lonely percentage.

8. **Two AIs reading one profile.** The study guide and the tutor both consume the same skill profile
   but live as separate destinations. → Could the home BE a coach — a daily briefing from an entity
   that knows your data — rather than a wall of widgets?

---

## Provocations to force divergence (use as lenses, not a checklist)

- **"What's the one number?"** If the home could show only a single thing, what is it? (Pass
  probability? Days-to-ready? The one belief to fix today?) Design outward from that.
- **Coach, not cockpit.** What if the home is a short, human briefing ("Here's where you are, here's
  the one thing today") and the metrics are a layer you *expand into*, not the default wall?
- **Root cause, not symptom list.** Show the *graph* of why the student is stuck, not a ranked list.
- **The product is a belief-correction machine.** Reframe the whole thing around misconceptions.
- **Calibration as a first-class score.** A second axis next to accuracy.
- **Phase-adaptive home.** Different home per readiness phase / time-to-exam.
- **Answer "will I pass?" honestly.** A predicted band with a confidence interval and what moves it.
- **Emotional design.** The user is scared. What makes a stressed candidate feel *calm and in
  control*? Is the current information-dense grid the opposite of that?

Challenge the premise itself: maybe the home shouldn't be a metrics dashboard at all.

---

## Tools available (the user wants generative tools used)

- **Google Stitch** (MCP, Gemini 3.1 Pro) — `create_project` → `create_design_system` →
  `generate_screen_from_text`. Good for fast divergent full-screen concepts in any style. A prior
  project exists (`projects/4029779327524238186`) but **start fresh** to avoid inheriting the locked palette.
- **Figma MCP** — push a chosen direction into a real design-system spec for handoff.
- **21st.dev magic** — component-level inspiration.
- **Preview server** — `preview_start("mockup")` serves `public/*.html` on :3033; render + screenshot
  to verify. (Mockup-first rule in `CLAUDE.md` still applies before any React work.)

Use them to *diverge*, not just to render one idea prettily. Generate multiple distinct directions in
different visual languages before converging.

---

## Deliverable

1. **3–5 genuinely distinct directions** — each with a one-line thesis (the "spine"), who it's for,
   what it makes the user feel, and which under-capitalized asset it activates. At least two should be
   structurally different from a sidebar-and-cards dashboard.
2. **Rendered mockups** for the strongest 2–3 (Stitch and/or hand-built HTML), screenshotted.
3. A short **"what we're not capitalizing on" findings list** — the latent opportunities, ranked by
   impact × feasibility, independent of any single design.
4. Only then, a **recommendation** and a feasibility note (what data is real today vs. needs building —
   the existing wiring map in `HANDOFF_dashboard_hybrid_redesign.md` is a useful reference for that
   last part *only*).

## Essential context map (the substrate to reimagine, not preserve)

- `docs/HOW_THE_APP_WORKS.md` — canonical product description (purpose, 45 skills / 4 domains,
  diagnostic, study guide, tutor, redemption, proficiency + readiness model).
- `docs/ANALYTICS_DATA_INVENTORY.md` — every data signal the app captures and where it lives.
- `HANDOFF_dashboard_hybrid_redesign.md` — the prior (anchored) pass + the data wiring map. **Read
  last**, as the baseline to surpass.
- `CLAUDE.md` — engineering constraints, mockup-first rule, label/threshold source-of-truth (don't
  rename status/proficiency labels even in a green-field design — they're product law).

> The point of this exercise is not a prettier dashboard. It's to discover whether the *right* home
> experience is something the current one isn't even attempting.
