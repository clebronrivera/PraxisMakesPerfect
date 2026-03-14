export const PRIMARY_ADMIN_EMAIL = 'clebronrivera@icloud.com';

const ADMIN_EMAILS = [PRIMARY_ADMIN_EMAIL];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }

  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
