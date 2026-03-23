// src/services/glossaryService.ts
//
// CRUD operations for the user_glossary_terms Supabase table.
// Used by GlossaryPage.tsx and the wrong-answer trigger in PracticeSession.tsx.

import { supabase } from '../config/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlossaryTerm {
  id: string;
  user_id: string;
  term: string;
  user_definition: string | null;
  revealed: boolean;
  revealed_at: string | null;
  added_from_skill_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Load all glossary terms for a user, sorted oldest-first.
 */
export async function loadGlossaryTerms(userId: string): Promise<GlossaryTerm[]> {
  const { data, error } = await supabase
    .from('user_glossary_terms')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[glossaryService] loadGlossaryTerms error:', error);
    return [];
  }
  return (data as GlossaryTerm[]) ?? [];
}

// ─── Write / Upsert ───────────────────────────────────────────────────────────

/**
 * Add a batch of new terms to a user's glossary (from a wrong-answer trigger).
 * Silently skips terms the user already has (via ON CONFLICT DO NOTHING).
 */
export async function addTermsFromWrongAnswer(
  userId: string,
  terms: string[],
  skillId: string
): Promise<void> {
  if (!terms.length) return;

  const rows = terms.map((term) => ({
    user_id: userId,
    term,
    added_from_skill_id: skillId,
    revealed: false,
  }));

  const { error } = await supabase
    .from('user_glossary_terms')
    .upsert(rows, { onConflict: 'user_id,term', ignoreDuplicates: true });

  if (error) {
    console.error('[glossaryService] addTermsFromWrongAnswer error:', error);
  }
}

/**
 * Save (or clear) a user's written definition for one term.
 */
export async function saveUserDefinition(
  userId: string,
  term: string,
  userDefinition: string
): Promise<void> {
  const { error } = await supabase
    .from('user_glossary_terms')
    .update({ user_definition: userDefinition, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('term', term);

  if (error) {
    console.error('[glossaryService] saveUserDefinition error:', error);
  }
}

/**
 * Permanently reveal the official definition for a term.
 * Once revealed = true it stays true (no un-reveal).
 */
export async function revealDefinition(
  userId: string,
  term: string
): Promise<void> {
  const { error } = await supabase
    .from('user_glossary_terms')
    .update({
      revealed: true,
      revealed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('term', term);

  if (error) {
    console.error('[glossaryService] revealDefinition error:', error);
  }
}

/**
 * Remove a term from the user's glossary.
 */
export async function removeGlossaryTerm(
  userId: string,
  term: string
): Promise<void> {
  const { error } = await supabase
    .from('user_glossary_terms')
    .delete()
    .eq('user_id', userId)
    .eq('term', term);

  if (error) {
    console.error('[glossaryService] removeGlossaryTerm error:', error);
  }
}
