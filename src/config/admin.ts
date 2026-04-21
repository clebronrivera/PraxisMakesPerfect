const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;

export const PRIMARY_ADMIN_EMAIL = viteEnv?.VITE_ADMIN_EMAIL ?? 'clebronrivera@icloud.com';

const ADMIN_EMAILS = [
  PRIMARY_ADMIN_EMAIL.trim().toLowerCase(),
  'clebronrivera@gmail.com',
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }

  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
