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
      '450+ practice questions across 45 skills',
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
      'Takes 30\u201360 minutes to complete',
      'Adapts difficulty based on your answers',
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
    description: 'The Score Report breaks down your performance by domain and skill with trend indicators and time-on-task data.',
    icon: 'TrendingUp',
    highlights: [
      'Domain-level accuracy bars with proficiency badges',
      'Skill breakdown table: accuracy, attempts, trends',
      'Time distribution stats per session',
      'Top 10 most-missed skills highlighted',
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
