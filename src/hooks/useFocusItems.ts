// src/hooks/useFocusItems.ts
//
// Extracts focus items from the user's latest study plan,
// manages Supabase-persisted check-off state, and tracks "New" badge logic.
//
// Used in StudyCenterSidebar → Focus Items tab.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import type { StudyPlanDocumentV2 } from '../types/studyPlanTypes';
import { extractFocusItems, type FocusItem } from '../utils/focusItemExtractor';

interface UseFocusItemsReturn {
  items: FocusItem[];
  checkedIds: Set<string>;
  newCount: number;
  loading: boolean;
  toggleCheck: (itemId: string) => void;
  markSeen: () => void;
}

export function useFocusItems(
  userId: string | null,
  skillId: string | null,
  /** The user's latest study plan (passed from App.tsx). Null = no plan yet. */
  studyPlan: { id: string; createdAt: string; plan: StudyPlanDocumentV2 } | null
): UseFocusItemsReturn {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Extract items from plan ─────────────────────────────────────────────
  const items = useMemo(() => {
    if (!studyPlan?.plan || !skillId) return [];
    return extractFocusItems(studyPlan.plan, skillId);
  }, [studyPlan, skillId]);

  // ── Load checked state + last-seen timestamp ────────────────────────────
  useEffect(() => {
    if (!userId || !skillId || !studyPlan?.id) {
      setCheckedIds(new Set());
      setLastSeenAt(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      // Load check-offs for this study plan
      const { data: checks } = await supabase
        .from('focus_item_checks')
        .select('item_type, item_key, checked')
        .eq('user_id', userId)
        .eq('study_plan_id', studyPlan.id)
        .eq('checked', true);

      // Load last-seen timestamp
      const { data: seenRow } = await supabase
        .from('focus_item_seen_at')
        .select('last_seen_at')
        .eq('user_id', userId)
        .eq('skill_id', skillId)
        .maybeSingle();

      if (cancelled) return;

      // Build checked set using stable IDs
      const checked = new Set<string>();
      if (checks) {
        for (const c of checks) {
          // Reconstruct the stable ID to match what extractFocusItems produces
          const matchingItem = items.find(
            item => item.type === c.item_type && item.text === c.item_key
          );
          if (matchingItem) checked.add(matchingItem.id);
        }
      }
      setCheckedIds(checked);
      setLastSeenAt(seenRow?.last_seen_at ?? null);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [userId, skillId, studyPlan?.id, items]);

  // ── "New" count: items from a plan newer than lastSeenAt ────────────────
  const newCount = useMemo(() => {
    if (!studyPlan?.createdAt || !lastSeenAt) {
      // If never seen before and there are items, they're all "new"
      return lastSeenAt === null ? items.filter(i => !checkedIds.has(i.id)).length : 0;
    }
    const planDate = new Date(studyPlan.createdAt).getTime();
    const seenDate = new Date(lastSeenAt).getTime();
    if (planDate > seenDate) {
      return items.filter(i => !checkedIds.has(i.id)).length;
    }
    return 0;
  }, [items, checkedIds, studyPlan?.createdAt, lastSeenAt]);

  // ── Toggle check ────────────────────────────────────────────────────────
  const toggleCheck = useCallback((itemId: string) => {
    if (!userId || !studyPlan?.id) return;

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const wasChecked = checkedIds.has(itemId);
    const newSet = new Set(checkedIds);
    if (wasChecked) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setCheckedIds(newSet);

    // Persist to Supabase
    supabase
      .from('focus_item_checks')
      .upsert(
        {
          user_id: userId,
          study_plan_id: studyPlan.id,
          item_type: item.type,
          item_key: item.text,
          checked: !wasChecked,
          checked_at: !wasChecked ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id,study_plan_id,item_type,item_key' }
      )
      .then(({ error }) => {
        if (error) console.error('[useFocusItems] toggleCheck error:', error.message);
      });
  }, [userId, studyPlan?.id, items, checkedIds]);

  // ── Mark seen (called when Focus Items tab is opened) ───────────────────
  const markSeen = useCallback(() => {
    if (!userId || !skillId) return;

    const now = new Date().toISOString();
    setLastSeenAt(now);

    supabase
      .from('focus_item_seen_at')
      .upsert(
        {
          user_id: userId,
          skill_id: skillId,
          last_seen_at: now,
        },
        { onConflict: 'user_id,skill_id' }
      )
      .then(({ error }) => {
        if (error) console.error('[useFocusItems] markSeen error:', error.message);
      });
  }, [userId, skillId]);

  return { items, checkedIds, newCount, loading, toggleCheck, markSeen };
}
