// src/utils/domainMilestones.ts
//
// Computes domain milestone threshold crossings for celebration toasts.
// Milestones: 25% / 50% / 75% / 100% of a domain's skills at Demonstrating.
//
// Milestone state is persisted in localStorage under pmp-milestones-{userId}
// as Record<string, number> — e.g. { "1": 50, "3": 25 }.
// Values represent the highest milestone already shown for that domain.
//
// No Supabase schema changes required.

import type { UserProfile } from '../hooks/useFirebaseProgress';
import { PROGRESS_DOMAINS, PROGRESS_SKILLS } from './progressTaxonomy';

const MILESTONES = [25, 50, 75, 100] as const;

export interface MilestoneEvent {
  domainId: number;
  domainName: string;
  pct: 25 | 50 | 75 | 100;
}

function storageKey(userId: string) {
  return `pmp-milestones-${userId}`;
}

function loadState(userId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveState(userId: string, state: Record<string, number>) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    // Silently ignore storage failures
  }
}

/**
 * Checks whether any domain has crossed a new milestone since the last call.
 * Returns an array of milestone events (empty if none new).
 * Persists the new high-water mark to localStorage.
 */
export function checkDomainMilestones(
  profile: UserProfile,
  userId: string,
): MilestoneEvent[] {
  const state = loadState(userId);
  const events: MilestoneEvent[] = [];

  for (const domain of PROGRESS_DOMAINS) {
    const domainSkills = PROGRESS_SKILLS.filter(s => s.domainId === domain.id);
    if (domainSkills.length === 0) continue;

    const demonstrating = domainSkills.filter(s => {
      const perf = profile.skillScores?.[s.skillId];
      return perf && perf.attempts > 0 && (perf.score ?? 0) >= 0.8;
    }).length;

    const pct = Math.floor((demonstrating / domainSkills.length) * 100);
    const prevMilestone = state[String(domain.id)] ?? 0;

    for (const threshold of MILESTONES) {
      if (pct >= threshold && prevMilestone < threshold) {
        events.push({ domainId: domain.id, domainName: domain.shortName, pct: threshold });
        state[String(domain.id)] = threshold;
      }
    }
  }

  if (events.length > 0) {
    saveState(userId, state);
  }

  return events;
}
