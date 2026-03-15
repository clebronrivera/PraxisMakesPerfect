const LOCAL_STORAGE_RESET_MARKER = 'praxis-client-data-reset-v1';

const EXACT_LOCAL_STORAGE_KEYS = [
  'praxis-user-profile',
  'praxis-assessment-session',
  'praxis-current-user',
  'praxis-user-sessions-list'
];

const PREFIX_LOCAL_STORAGE_KEYS = [
  'praxis-user-sessions-list-',
  'praxis-session-',
  'practice-stats-'
];

export function clearLegacyClientDataOnce(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (window.localStorage.getItem(LOCAL_STORAGE_RESET_MARKER) === 'true') {
      return;
    }

    const keysToRemove: string[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key) {
        continue;
      }

      if (
        EXACT_LOCAL_STORAGE_KEYS.includes(key) ||
        PREFIX_LOCAL_STORAGE_KEYS.some((prefix) => key.startsWith(prefix))
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    window.localStorage.setItem(LOCAL_STORAGE_RESET_MARKER, 'true');
  } catch (error) {
    console.error('[LegacyData] Failed to clear legacy browser data:', error);
  }
}
