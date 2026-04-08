// src/data/app-guide.ts
// App knowledge for the floating tutor widget.
// APP_KNOWLEDGE_CORE is always injected into every system prompt (condensed facts).
// APP_GUIDE_CONTENT is the full guide + FAQ, injected only on app-guide intent.

// ─── Core facts always in the prompt ─────────────────────────────────────────
export const APP_KNOWLEDGE_CORE = `
APP QUICK REFERENCE (use this to answer any navigation or how-to question):
- TUTORIAL: Help page (bottom of left nav) → click "Replay Tutorial" for the 8-slide walkthrough.
- STUDY A SPECIFIC SKILL: Practice Hub → "By Skill" (sorted weakest → strongest) → tap skill.
- PRACTICE MODES: By Domain | By Skill | Learning Path | Random. Unlocked after diagnostic.
- STUDY GUIDE: Unlocked after diagnostic. AI-generated plan. Regenerate once per 7 days.
- PROFICIENCY: Demonstrating ≥80% | Approaching 60–79% | Emerging <60%
- READINESS TARGET: 32 of 45 skills at Demonstrating (≥80%).
- REDEMPTION ROUNDS: Questions wrong 3+ times (or hint used) go to quarantine. 3 correct in Redemption clears them. Earn 1 credit per 20 practice answers.
- PROGRESS TAB: Shows accuracy + proficiency for every skill across all 4 domains.
- DOMAINS: Data-Based Decision Making | Consultation & Collaboration | Interventions & Instructional Support | Legal, Ethical & Professional Practice
`;

// ─── Full guide + FAQ (injected on app-guide intent) ─────────────────────────
export const APP_GUIDE_CONTENT = `
APP NAVIGATION GUIDE:

DASHBOARD (Home):
The main hub. Shows your readiness phase, daily question goal, high-impact skills, and quick-start buttons. New users see a prompt to take the adaptive diagnostic. Users who completed the diagnostic see their full progress overview.

ADAPTIVE DIAGNOSTIC:
Your baseline assessment. Starts with 45 questions (one per skill), then adapts: wrong answers trigger follow-up questions. Minimum 45, maximum ~90 questions. You can pause any time and return later. Completing this unlocks all practice modes and the Study Guide.

PRACTICE HUB:
Four practice modes:
- By Domain: Practice questions from one of the 4 Praxis domains
- By Skill: Target a specific skill (sorted weakest to strongest). Best mode when you know exactly which skill to work on.
- Learning Path: A visual node map ordered by your weakest skills, with lessons + practice in a 3-section flow (Lesson → Practice Questions → Extend)
- Random: Adaptive practice based on your level of need — good for daily warmups and broad review.

PROGRESS:
Detailed breakdown of every skill and domain. Shows accuracy, attempt count, and proficiency level (Emerging / Approaching / Demonstrating). Accessible from the bottom nav or side nav.

STUDY GUIDE:
AI-generated personalized study plan based on your diagnostic data. Includes readiness snapshot, priority clusters, weekly plan, vocabulary/misconception review, and tactical coaching. Requires diagnostic completion. Can be regenerated once per 7 days.

STUDY NOTEBOOK:
Your personal notes and study plan history.

GLOSSARY:
Searchable glossary of Praxis 5403 key terms.

HELP PAGE:
Located at the bottom of the left/side nav. Contains the FAQ, a "Replay Tutorial" button, and support contact info.

TUTORIAL WALKTHROUGH:
An 8-slide guided tour of the app. Auto-plays on your first login after onboarding. To replay: Help page → "Replay Tutorial".

REDEMPTION ROUNDS:
Questions you got wrong 3+ times (or used a hint on) are quarantined — they only appear inside Redemption Rounds. Answer correctly 3 times to clear a question. Earn 1 credit per 20 non-hint practice answers. Sessions are timed at 90 seconds per question.

PROFICIENCY LEVELS:
- Demonstrating (≥80%): Meeting the threshold consistently
- Approaching (60–79%): Near the threshold, opportunities to strengthen
- Emerging (<60%): Foundational gaps, targeted remediation needed
- Not started: No data yet

READINESS TARGET: 32 of 45 skills at Demonstrating (≥80%) for exam readiness.

DOMAINS (4 total):
1. Data-Based Decision Making (DBDM)
2. Consultation & Collaboration (CC)
3. Interventions & Instructional Support (IIS)
4. Legal, Ethical & Professional Practice (LEG)

---
PREDICTED FAQ — answer these accurately when asked:

Q: Where is the tutorial?
A: The tutorial is on the Help page (bottom of the left nav). Click "Replay Tutorial" to re-watch the 8-slide walkthrough anytime.

Q: How do I study for a specific skill?
A: Go to Practice Hub → "By Skill". Skills are sorted weakest to strongest. Tap any skill to start a targeted session.

Q: What percentage do I need to be exam ready?
A: You need 80% accuracy on a skill to reach "Demonstrating." For overall exam readiness, you need 32 of your 45 skills at Demonstrating.

Q: How do I unlock the practice modes?
A: Complete the Adaptive Diagnostic. All practice modes unlock automatically when you finish.

Q: How do I unlock the Study Guide?
A: Complete the Adaptive Diagnostic. The Study Guide becomes available after that and can be regenerated once every 7 days.

Q: What does Approaching mean?
A: Approaching (60–79% accuracy) means you're near the threshold but haven't consistently hit 80% yet.

Q: What does Demonstrating mean?
A: Demonstrating (≥80% accuracy) means you're consistently meeting the skill threshold in practice.

Q: What are Redemption Rounds?
A: When you get a question wrong 3+ times (or use a hint), it gets quarantined. You can only see it inside Redemption Rounds until you answer it correctly 3 times. Earn 1 credit per 20 regular practice answers to play a session.

Q: How do I earn Redemption Round credits?
A: Every 20 non-hint practice answers earns 1 credit, which unlocks one full Redemption session.

Q: How do I use the Learning Path?
A: Go to Practice Hub → Learning Path. You'll see a node map of skills ordered by priority. Each node has 3 sections: Lesson, Practice Questions, and Extend. Complete them in order for deep learning on a skill.

Q: How often can I regenerate my Study Guide?
A: Once every 7 days.

Q: Where do I see all my skills and scores?
A: The Progress tab. It shows accuracy, attempt count, and proficiency level for every skill across all 4 domains.

Q: What is the Adaptive Diagnostic?
A: A 45–90 question baseline assessment. One question per skill to start, then follow-up questions if you get one wrong. Adapts in real time. Unlocks the rest of the app when complete.

Q: Can I pause the diagnostic?
A: Yes. Progress is saved automatically. Leave and return anytime.

Q: What domains does the Praxis 5403 cover?
A: Four domains: Data-Based Decision Making (DBDM), Consultation & Collaboration (CC), Interventions & Instructional Support (IIS), and Legal, Ethical & Professional Practice (LEG).

Q: How do I find my weakest skills?
A: Check the Progress tab, or go to Practice Hub → By Skill — skills are sorted weakest to strongest.

Q: What's the difference between By Skill and Learning Path?
A: By Skill is a quick targeted session on one skill. Learning Path is a structured module with a lesson, practice questions, and extended application — better for deep, comprehensive learning on a skill.

Q: How do I see my readiness level?
A: It's on your Dashboard (Home page). You'll see your current readiness phase and how many skills are at each proficiency level.

Q: What happens when I use a hint?
A: Using a hint on a practice question immediately quarantines it — it goes into your Redemption Rounds bank and won't appear in normal practice until you clear it with 3 correct answers in Redemption.

Q: Is PraxisBot affiliated with ETS?
A: No. This app and PraxisBot are independent study tools, not affiliated with ETS. Information is for study preparation only.

Q: How many total skills are there?
A: 45 skills across 4 domains.

Q: How many questions are in the question bank?
A: 1,150 practice questions across all 45 skills.
`;

export const PAGE_CONTEXT_HINTS: Record<string, string> = {
  'home': 'The user is on the Dashboard/Home page. They can see their readiness phase, daily goal, and high-impact skills.',
  'practice': 'The user is in an active practice session answering questions.',
  'practice-hub': 'The user is browsing practice modes (By Domain, By Skill, Learning Path, Random).',
  'results': 'The user is viewing their Progress dashboard with skill/domain breakdowns.',
  'study-guide': 'The user is viewing their AI Study Guide.',
  'adaptive-diagnostic': 'The user is taking the adaptive diagnostic assessment.',
  'screener': 'The user is taking the skills screener.',
  'glossary': 'The user is browsing the glossary.',
  'learning-path-module': 'The user is inside a Learning Path module (lesson + practice for a specific skill).',
  'help': 'The user is on the Help/FAQ page. The tutorial replay button is here.',
  'study-notebook': 'The user is viewing their Study Notebook.',
  'tutor': 'The user is on the AI Tutor page.',
};
