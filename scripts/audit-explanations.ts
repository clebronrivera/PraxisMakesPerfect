// Explanation Truncation Audit
//
// Catches answer explanations that stop mid-sentence. This is not hypothetical:
// 229 of the 250 legacy `item_*` questions (91.6%) ship explanations severed
// mid-clause — e.g. item_002 ends "...known for concepts related to language
// development and language". Users see that text immediately after answering,
// so it is the pedagogical payload of a wrong answer.
//
// Those 229 are recorded in the allowlist file as KNOWN failures, so this exits
// 0 today. It fails only when a NEW truncation appears — the same debt-ratchet
// shape as scripts/button-budget.json. When the legacy explanations are
// regenerated, remove the fixed ids from the allowlist; the script tells you
// which ones are safe to drop.
//
// Run: npm run audit:explanations

import QUESTIONS_DATA from '../src/data/questions.json';
import ALLOWLIST from './explanation-truncation-allowlist.json';

interface RawQuestion {
  UNIQUEID?: string;
  CORRECT_Explanation?: string;
}

/** Sentence-final punctuation, including closing quotes/brackets. */
const TERMINAL = /[.!?:;)\]}"'”’]$/;

/**
 * Strip trailing markdown horizontal rules before judging the ending.
 *
 * Without this the check reports ~37 false positives: many well-formed `PQ_*`
 * explanations end with a `---` separator, which is formatting, not a severed
 * sentence. Removing the rule reveals the real last character.
 */
export function normalizeExplanation(raw: string): string {
  let text = raw.trim();
  // Repeat: an explanation can end with a rule preceded by a blank line.
  for (;;) {
    const stripped = text.replace(/(?:\n|^)\s*(?:-{3,}|\*{3,}|_{3,})\s*$/, '').trim();
    if (stripped === text) break;
    text = stripped;
  }
  return text;
}

/** True when the explanation looks cut off mid-sentence. */
export function isTruncated(raw: string | undefined | null): boolean {
  if (!raw) return false; // absent is a different defect; audit:bank owns it
  const text = normalizeExplanation(raw);
  if (!text) return false;
  return !TERMINAL.test(text);
}

function main(): void {
  const questions = QUESTIONS_DATA as RawQuestion[];
  const known = new Set<string>(ALLOWLIST.knownTruncatedIds);

  const truncated: string[] = [];
  for (const q of questions) {
    const id = q.UNIQUEID;
    if (!id) continue;
    if (isTruncated(q.CORRECT_Explanation)) truncated.push(id);
  }

  const found = new Set(truncated);
  const newlyBroken = truncated.filter((id) => !known.has(id));
  const nowFixed = [...known].filter((id) => !found.has(id));

  console.log('Explanation truncation audit');
  console.log(`  questions scanned : ${questions.length}`);
  console.log(`  truncated         : ${truncated.length}`);
  console.log(`  known (allowlist) : ${known.size}`);
  console.log(`  newly broken      : ${newlyBroken.length}`);
  console.log(`  now fixed         : ${nowFixed.length}`);

  if (nowFixed.length > 0) {
    console.log('\n✅ These ids are no longer truncated — remove them from');
    console.log('   scripts/explanation-truncation-allowlist.json to lock the fix in:');
    nowFixed.slice(0, 25).forEach((id) => console.log(`   - ${id}`));
    if (nowFixed.length > 25) console.log(`   …and ${nowFixed.length - 25} more`);
  }

  if (newlyBroken.length > 0) {
    console.error('\n✗ NEW truncated explanations detected:');
    newlyBroken.forEach((id) => {
      const q = questions.find((x) => x.UNIQUEID === id);
      const text = normalizeExplanation(q?.CORRECT_Explanation ?? '');
      console.error(`   ${id}: …${JSON.stringify(text.slice(-70))}`);
    });
    console.error('\nAn explanation must end in a complete sentence — it is what the');
    console.error('learner reads after getting the question wrong. Fix the content, or');
    console.error('if this is genuinely intentional add the id to the allowlist with a reason.');
    process.exit(1);
  }

  console.log('\n✓ No new truncated explanations.');
}

// Only audit when run directly, so the predicates above can be imported by
// tests and by the allowlist generator without triggering process.exit.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main();
}
