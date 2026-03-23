// src/utils/glossaryHighlighter.tsx
//
// Scans plain text and wraps vocabulary terms in <GlossaryTooltip> elements.
//
// Only terms from the current skill's vocabulary map are highlighted (Option B)
// so that dense prose doesn't become visually noisy.
//
// Usage:
//   const highlight = buildHighlighter(skillTerms, officialDefinitions);
//   // Then in JSX: <p>{highlight(section.text)}</p>

import { Fragment } from 'react';
import GlossaryTooltip from '../components/GlossaryTooltip';

/**
 * Given a list of vocabulary terms and the full official definitions map,
 * returns a `highlight` function that replaces matching substrings in a text
 * string with <GlossaryTooltip> elements.
 *
 * - Terms are matched longest-first to avoid partial matches
 *   (e.g. "social-emotional learning" wins over "social-emotional").
 * - Matching is case-insensitive; the word as it appears in text is displayed.
 * - Only whole words / whole phrases are matched (\b boundaries).
 * - If a term has no official definition, it is left as plain text.
 * - If `terms` is empty, returns an identity function (no highlighting).
 */
export function buildHighlighter(
  terms: string[],
  officialDefinitions: Record<string, string>
): (text: string) => React.ReactNode {
  if (!terms.length) return (text) => text;

  // Build a lowercase → definition lookup
  const defMap = new Map<string, string>();
  for (const [term, def] of Object.entries(officialDefinitions)) {
    defMap.set(term.toLowerCase(), def);
  }

  // Filter to only terms that actually have a definition
  const matchable = terms.filter((t) => defMap.has(t.toLowerCase()));
  if (!matchable.length) return (text) => text;

  // Longest terms first — prevents shorter prefix from consuming a longer match
  const sorted = [...matchable].sort((a, b) => b.length - a.length);

  // Escape special regex characters in each term
  const escaped = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  // Single pass regex with a capture group so split() preserves matched text
  const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');

  return function highlight(text: string): React.ReactNode {
    const parts = text.split(pattern);

    // No matches — return plain string (avoids creating a Fragment wrapper)
    if (parts.length === 1) return text;

    return (
      <Fragment>
        {parts.map((part, i) => {
          // Even indices are plain text segments
          if (i % 2 === 0) return part || null;

          // Odd indices are matched terms (preserved with original casing)
          const def = defMap.get(part.toLowerCase());
          if (!def) return part;

          return <GlossaryTooltip key={i} term={part} definition={def} />;
        })}
      </Fragment>
    );
  };
}
