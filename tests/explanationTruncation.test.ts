// Unit tests for the explanation-truncation detector.
//
// The subtle case is the trailing markdown rule: many well-formed PQ_* answer
// explanations end with a `---` separator. A naive "does it end in a period?"
// check reports ~37 of them as truncated, which would bury the 229 real
// failures in noise and make the gate useless.
import { describe, it, expect } from 'vitest';
import { isTruncated, normalizeExplanation } from '../scripts/audit-explanations';

describe('normalizeExplanation', () => {
  it('strips a trailing markdown rule', () => {
    expect(normalizeExplanation('A complete thought.\n\n---')).toBe('A complete thought.');
  });

  it('strips asterisk and underscore rules too', () => {
    expect(normalizeExplanation('Done.\n***')).toBe('Done.');
    expect(normalizeExplanation('Done.\n___')).toBe('Done.');
  });

  it('strips repeated trailing rules', () => {
    expect(normalizeExplanation('Done.\n\n---\n\n---')).toBe('Done.');
  });

  it('leaves an internal rule alone', () => {
    // Only a rule at the END is formatting noise; one in the middle is content.
    expect(normalizeExplanation('Part one.\n---\nPart two.')).toBe('Part one.\n---\nPart two.');
  });

  it('does not treat a hyphenated word as a rule', () => {
    expect(normalizeExplanation('It is norm-referenced.')).toBe('It is norm-referenced.');
  });
});

describe('isTruncated', () => {
  it('flags a sentence cut off mid-clause', () => {
    // The real shape of the defect — item_002 ends exactly like this.
    expect(isTruncated('Chomsky is known for concepts related to language')).toBe(true);
  });

  it('accepts normal terminal punctuation', () => {
    expect(isTruncated('This is complete.')).toBe(false);
    expect(isTruncated('Is it complete?')).toBe(false);
    expect(isTruncated('It is!')).toBe(false);
  });

  it('accepts closing quotes and brackets', () => {
    expect(isTruncated('He called it "the discrepancy model."')).toBe(false);
    expect(isTruncated('See the manual (2nd ed.)')).toBe(false);
  });

  it('accepts an explanation whose real ending is hidden behind a rule', () => {
    // The false-positive class this detector exists to avoid.
    expect(isTruncated('A complete thought.\n\n---')).toBe(false);
  });

  it('still flags a truncated explanation that ends with a rule', () => {
    expect(isTruncated('A thought that stops right\n\n---')).toBe(true);
  });

  it('ignores absent explanations', () => {
    // Missing text is a different defect; audit:bank owns required-field checks.
    expect(isTruncated(undefined)).toBe(false);
    expect(isTruncated(null)).toBe(false);
    expect(isTruncated('')).toBe(false);
    expect(isTruncated('   ')).toBe(false);
  });
});
