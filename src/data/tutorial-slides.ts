// src/data/tutorial-slides.ts
// Content for the 8-slide tutorial walkthrough shown after onboarding.

export interface TutorialSlide {
  id: string;
  title: string;
  description: string;
  icon: string;       // Lucide icon name
  highlights: string[]; // 2-4 key points
}

export const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    id: 'welcome',
    title: 'Welcome to Praxis Makes Perfect',
    description: 'Your personalized study companion for the Praxis 5403 School Psychology exam. Here\'s a quick tour of everything you can do.',
    icon: 'Sparkles',
    highlights: [
      '1,150 practice questions across 45 skills',
      'AI-powered study guides tailored to your gaps',
      'Real-time progress tracking with proficiency levels',
      'Adaptive practice that targets your weakest areas',
    ],
  },
  {
    id: 'diagnostic',
    title: 'Start with the Adaptive Diagnostic',
    description: 'Your first step is taking the Adaptive Diagnostic. It tests all 45 skills with 45\u201390 questions and builds your baseline profile.',
    icon: 'ClipboardCheck',
    highlights: [
      '45 questions if you ace it, up to 90 if you need follow-ups',
      'Wrong answers trigger follow-up questions on the same skill',
      'Unlocks all practice modes and your study guide',
      'You can pause and resume anytime',
    ],
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'After the diagnostic, your dashboard shows domain cards with proficiency levels and progress at a glance.',
    icon: 'LayoutDashboard',
    highlights: [
      'Emerging (< 60%) \u2014 targeted remediation needed',
      'Approaching (60\u201379%) \u2014 near the threshold',
      'Demonstrating (\u2265 80%) \u2014 meeting the standard',
      'Track your readiness: 70% of skills at Demonstrating = Ready',
    ],
  },
  {
    id: 'practice',
    title: 'Three Ways to Practice',
    description: 'Choose the practice mode that fits your study session. Each mode uses adaptive selection to focus on your gaps.',
    icon: 'Dumbbell',
    highlights: [
      'By Domain \u2014 broad review of an entire domain',
      'By Skill \u2014 deep dive into a specific skill',
      'Learning Path \u2014 structured modules ordered by your weakest skills',
    ],
  },
  {
    id: 'tutor',
    title: 'AI Tutor',
    description: 'Your on-demand study partner. Ask questions, get quizzed, or request practice activities tailored to your weak spots.',
    icon: 'Bot',
    highlights: [
      'Adaptive quizzes that target your emerging skills',
      'Remediation when you miss the same skill twice',
      'Practice sets, vocabulary lists, and matching activities',
      'Available as a full page or floating widget',
    ],
  },
  {
    id: 'progress',
    title: 'Track Your Progress',
    description: 'The Progress page breaks down your performance by domain and skill, with time-on-task data and a growth view that compares your current state to your diagnostic baseline.',
    icon: 'TrendingUp',
    highlights: [
      'Domain accuracy cards with Emerging / Approaching / Demonstrating badges',
      'Skill proficiency map: a color-coded grid of all 45 skills',
      'Growth Since Diagnostic: two-tone bars per skill (baseline vs. now)',
      'Concept insights: cross-skill gaps and weakest concepts',
    ],
  },
  {
    id: 'study-guide',
    title: 'AI Study Guide',
    description: 'A comprehensive, personalized study plan generated from your actual performance data. Regenerates as you improve.',
    icon: 'BookOpen',
    highlights: [
      'Readiness snapshot and data interpretation',
      'Priority clusters ranked by urgency',
      'Weekly study schedule with session types',
      'Vocabulary, case patterns, and checkpoint logic',
    ],
  },
  {
    id: 'redemption',
    title: 'Redemption Rounds',
    description: 'Questions you\'ve missed 3+ times or used hints on are quarantined. Earn credits through practice and clear them in Redemption Rounds.',
    icon: 'RotateCcw',
    highlights: [
      'Every 20 practice answers earns 1 credit',
      'Each credit lets you attempt your full quarantine bank',
      '3 correct answers in Redemption clears a question',
      '90-second timer per question \u2014 no shortcuts',
    ],
  },
];

/**
 * Separate tutorial shown before the adaptive diagnostic starts.
 * Focused on explaining how the diagnostic works — confidence, adaptive length, etc.
 */
export const DIAGNOSTIC_TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    id: 'diag-what',
    title: 'What the Diagnostic Measures',
    description: 'This assessment maps your knowledge across all 45 skills in 4 domains. Each question targets a specific skill so we know exactly where you stand.',
    icon: 'Target',
    highlights: [
      '45 skills across 4 Praxis 5403 domains',
      'Each question is tagged to a specific skill',
      'Your results unlock a personalized dashboard',
      'This is your starting baseline \u2014 every feature builds on it',
    ],
  },
  {
    id: 'diag-adapts',
    title: 'How It Adapts',
    description: 'If you miss a question, you may see follow-up questions on the same skill \u2014 up to 3 per skill. That\u2019s why the test can range from 45 to 90+ questions.',
    icon: 'GitBranch',
    highlights: [
      'Start with 1 question per skill (45 total)',
      'Wrong answers can trigger up to 2 follow-ups per skill',
      'The better you do, the shorter the diagnostic',
      'Follow-ups help us distinguish a gap from a one-off miss',
    ],
  },
  {
    id: 'diag-confidence',
    title: 'Confidence Matters',
    description: 'After each answer, rate your confidence: Guess, Unsure, or Sure. This helps us distinguish lucky guesses from solid knowledge and improves your study plan.',
    icon: 'Gauge',
    highlights: [
      'Be honest \u2014 overconfidence hides real gaps',
      'Guess + correct flags unstable knowledge that needs reinforcement',
      'Sure + wrong flags a misconception we need to remediate',
      'Your study guide uses confidence to prioritize skills',
    ],
  },
  {
    id: 'diag-pause',
    title: 'You Can Pause Anytime',
    description: 'Your progress saves automatically. Close the browser, come back tomorrow \u2014 you\u2019ll pick up exactly where you left off. No pressure.',
    icon: 'PauseCircle',
    highlights: [
      'Progress auto-saves after every question',
      'Resume from any device by logging in',
      'Take it in one sitting or spread it across days',
      'The pause button in the top bar saves and exits safely',
    ],
  },
  {
    id: 'diag-after',
    title: 'What Happens After',
    description: 'When you finish, your full dashboard unlocks \u2014 personalized practice modes, an AI study guide, progress tracking, and a tutor that knows your gaps.',
    icon: 'Rocket',
    highlights: [
      'Practice by domain, by skill, or follow a learning path',
      'AI Study Guide with priority clusters and weekly schedule',
      'Progress tracking with proficiency levels per skill',
      'AI Tutor that adapts quizzes to your weakest areas',
    ],
  },
];
