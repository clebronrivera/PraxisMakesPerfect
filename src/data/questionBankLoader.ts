// src/data/questionBankLoader.ts
//
// Single lazy loader for the raw question bank, shared by every client-side
// consumer (study-plan preprocessing, the diagnostic story panel, the admin
// question-bank tab).
//
// WHY fetch instead of `import('./questions.json')`:
//   A static OR dynamic `import` of a 6.5 MB JSON makes Rollup emit the whole
//   bank a SECOND time as a ~5.9 MB JS chunk — so the app shipped the bank
//   twice (once as the JSON asset the assessment/practice flow fetches, once as
//   this JS chunk). Fetching the asset URL instead:
//     · emits the JSON only as an asset (no duplicate JS chunk), and
//     · resolves to the SAME hashed URL App.tsx's `ensureQuestionBank` fetches
//       (Vite dedupes assets by source file), so the browser HTTP-caches ONE
//       copy across every consumer.
//
// Memoized: the first call starts the fetch and caches the promise; a failed
// load clears the cache so a later consumer can retry.

const QUESTION_BANK_URL = new URL('./questions.json', import.meta.url).href;

let _promise: Promise<unknown[]> | null = null;

/** Fetch + parse the raw question bank (array of raw question records). */
export function loadRawQuestionBank(): Promise<unknown[]> {
  if (!_promise) {
    _promise = fetch(QUESTION_BANK_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load question bank (${response.status})`);
        }
        return response.json() as Promise<unknown[]>;
      })
      .catch((error) => {
        _promise = null; // allow a later consumer to retry
        throw error;
      });
  }
  return _promise;
}
