// src/data/app-guide.ts
// Condensed app guide content for the floating tutor widget.
// Injected into the system prompt when intent === 'app-guide'.

export const APP_GUIDE_CONTENT = `
APP NAVIGATION GUIDE:

DASHBOARD (Home):
The main hub. Shows your readiness phase, daily question goal, high-impact skills, and quick-start buttons. New users see a prompt to take the adaptive diagnostic. Users who completed the diagnostic see their full progress overview.

ADAPTIVE DIAGNOSTIC:
Your baseline assessment. Starts with 45 questions (one per skill), then adapts: wrong answers trigger follow-up questions. Minimum 45, maximum ~90 questions. You can pause any time and return later. Completing this unlocks all practice modes.

PRACTICE HUB:
Three practice modes:
- By Domain: Practice questions from one of the 4 Praxis domains
- By Skill: Target a specific skill (sorted weakest to strongest)
- Learning Path: A visual node map ordered by your weakest skills, with lessons + practice in a 3-section flow (Lesson → Practice Questions → Extend)

Feeling Spicy mode: Quick recalibration — one question per skill, cycling through all 45. Good for daily warmups.

PROGRESS:
Detailed breakdown of every skill and domain. Shows accuracy, attempt count, and proficiency level (Emerging / Approaching / Demonstrating).

STUDY GUIDE:
AI-generated personalized study plan based on your diagnostic data. Includes readiness snapshot, priority clusters, weekly plan, and vocabulary/misconception review. Requires diagnostic completion. Can be regenerated once per 7 days.

STUDY NOTEBOOK:
Your personal notes and study plan history.

GLOSSARY:
Searchable glossary of Praxis 5403 key terms.

REDEMPTION ROUNDS:
Review mode for questions you got wrong in practice. Earn 1 credit per 20 practice answers. Timed at 90 seconds per question.

PROFICIENCY LEVELS:
- Demonstrating (≥80%): Meeting the threshold consistently
- Approaching (60-79%): Near the threshold, opportunities to strengthen
- Emerging (<60%): Foundational gaps, targeted remediation needed
- Not started: No data yet

READINESS TARGET: 32 of 45 skills at Demonstrating (≥80%) for exam readiness.
`;

export const PAGE_CONTEXT_HINTS: Record<string, string> = {
  'home': 'The user is on the Dashboard/Home page. They can see their readiness phase, daily goal, and high-impact skills.',
  'practice': 'The user is in an active practice session answering questions.',
  'practice-hub': 'The user is browsing practice modes (By Domain, By Skill, Learning Path).',
  'results': 'The user is viewing their Progress dashboard with skill/domain breakdowns.',
  'study-guide': 'The user is viewing their AI Study Guide.',
  'adaptive-diagnostic': 'The user is taking the adaptive diagnostic assessment.',
  'screener': 'The user is taking the skills screener.',
  'glossary': 'The user is browsing the glossary.',
  'learning-path-module': 'The user is inside a Learning Path module (lesson + practice for a specific skill).',
  'help': 'The user is on the Help/FAQ page.',
  'study-notebook': 'The user is viewing their Study Notebook.',
  'tutor': 'The user is on the AI Tutor page.',
};
