import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, PlayCircle } from 'lucide-react';

interface FAQEntry {
  question: string;
  answer: string;
}

const FAQ_ENTRIES: FAQEntry[] = [
  {
    question: 'Why does it take 20 questions to earn a Redemption Round credit?',
    answer: "The system waits for 20 answers so your brain has time to let the learning settle — especially if you just saw the answer via a hint. By the time the credit is earned, you'll likely have several missed questions queued, making the round more targeted and valuable.",
  },
  {
    question: 'Is the assessment timed?',
    answer: 'No. There is no per-question or total time limit. Time per question is tracked internally for analytics only. Your score is based on accuracy, not speed.',
  },
  {
    question: 'How does the adaptive assessment work?',
    answer: 'The assessment covers all 45 skills across 4 domains (45–90 questions total). After each answer, the engine adjusts what comes next. Get a skill right and it may move on; struggle and it follows up at a different cognitive level.',
  },
  {
    question: 'What are the 4 domains?',
    answer: 'Domain 1: Data-Based Decision Making & Accountability. Domain 2: Consultation & Collaboration. Domain 3: Interventions & Instructional Support. Domain 4: School-Wide Practices to Promote Learning.',
  },
  {
    question: 'What is Redemption Rounds?',
    answer: "When you answer a practice question incorrectly, it goes into your missed-question bank. Earn 1 credit per 20 practice answers. Spend a credit to run a focused review round. Each question has a 90-second timer and requires a confidence rating (Sure / Unsure / Guess). Sure + correct = immediately redeemed. Unsure/Guess + correct = needs 3 correct answers across rounds to redeem.",
  },
];

export default function HelpFAQ({ onGoHome, onReplayTutorial }: { onGoHome: () => void; onReplayTutorial?: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6 px-4 text-slate-200">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--d1-peach)]/30 bg-[color:var(--d1-peach)]/10">
          <HelpCircle className="h-5 w-5 text-[color:var(--d1-peach)]" />
        </div>
        <div>
          <p className="eyebrow">Support</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">Help &amp; FAQ</h1>
        </div>
      </div>

      <div className="glass divide-y divide-white/5 overflow-hidden">
        {FAQ_ENTRIES.map((entry, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/5"
              >
                <span className="text-sm font-semibold text-white">{entry.question}</span>
                {isOpen
                  ? <ChevronUp className="h-4 w-4 shrink-0 text-[color:var(--d1-peach)]" />
                  : <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />}
              </button>
              {isOpen && (
                <div className="border-t border-[color:var(--d1-peach)]/20 bg-navy-800/40 px-6 py-4">
                  <p className="text-sm leading-relaxed text-slate-300">{entry.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        {onReplayTutorial && (
          <button
            type="button"
            onClick={onReplayTutorial}
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--d3-ice)]/30 bg-[color:var(--d3-ice)]/10 px-4 py-2 text-sm font-medium text-[color:var(--d3-ice)] transition-colors hover:bg-[color:var(--d3-ice)]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--d1-peach)]"
          >
            <PlayCircle className="h-4 w-4" />
            Replay Tutorial
          </button>
        )}
        <button type="button" onClick={onGoHome} className="btn-ghost-atelier">
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
