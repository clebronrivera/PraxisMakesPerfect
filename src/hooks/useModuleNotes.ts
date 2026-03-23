// src/hooks/useModuleNotes.ts
//
// Supabase-backed hook for per-module user notes.
// Used in the Study Center sidebar (LearningPathModulePage).
//
// Autosaves via debounced upsert (1.5s after last keystroke).
// Notes are keyed to (user_id, module_id) — one note per module per user.

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../config/supabase';

interface UseModuleNotesReturn {
  noteText: string;
  setNoteText: (text: string) => void;
  saving: boolean;
  loaded: boolean;
}

const DEBOUNCE_MS = 1500;

export function useModuleNotes(
  userId: string | null,
  moduleId: string | null,
  skillId: string | null
): UseModuleNotesReturn {
  const [noteText, setNoteTextState] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef('');

  // ── Load note when module changes ────────────────────────────────────────
  useEffect(() => {
    if (!userId || !moduleId) {
      setNoteTextState('');
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    (async () => {
      const { data, error } = await supabase
        .from('module_notes')
        .select('note_text')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('[useModuleNotes] fetch error:', error.message);
        setNoteTextState('');
      } else {
        const text = data?.note_text ?? '';
        setNoteTextState(text);
        lastSavedRef.current = text;
      }
      setLoaded(true);
    })();

    return () => { cancelled = true; };
  }, [userId, moduleId]);

  // ── Debounced save ───────────────────────────────────────────────────────
  const save = useCallback(async (text: string) => {
    if (!userId || !moduleId || !skillId) return;
    if (text === lastSavedRef.current) return;

    setSaving(true);
    const { error } = await supabase
      .from('module_notes')
      .upsert(
        {
          user_id: userId,
          module_id: moduleId,
          skill_id: skillId,
          note_text: text,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,module_id' }
      );

    if (error) {
      console.error('[useModuleNotes] save error:', error.message);
    } else {
      lastSavedRef.current = text;
    }
    setSaving(false);
  }, [userId, moduleId, skillId]);

  // ── Public setter with debounce ──────────────────────────────────────────
  const setNoteText = useCallback((text: string) => {
    setNoteTextState(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      save(text);
    }, DEBOUNCE_MS);
  }, [save]);

  // ── Flush on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, []);

  return { noteText, setNoteText, saving, loaded };
}
