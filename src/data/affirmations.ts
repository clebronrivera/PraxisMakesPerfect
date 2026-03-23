export const DAILY_AFFIRMATIONS = [
  "You're building the framework to support the students who need it most.",
  "Every question you practice is a future student you're better prepared to help.",
  "Trust the process. Your clinical judgment is getting sharper every day.",
  "Rest. Recovery is part of learning, just as it's part of intervention.",
  "You've put in the work today. Let the concepts consolidate.",
  "Great job. You are one step closer to making a systemic impact.",
  "The best school psychologists are lifelong learners. Take pride in your effort today.",
  "Your dedication to best practices is what changes school systems.",
  "Take a breath. You're doing the hard work of building true competency.",
  "A tired brain needs rest to build stronger pathways. See you tomorrow!"
];

export function getRandomAffirmation(): string {
  const index = Math.floor(Math.random() * DAILY_AFFIRMATIONS.length);
  return DAILY_AFFIRMATIONS[index];
}
