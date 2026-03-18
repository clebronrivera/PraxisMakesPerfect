/**
 * Admin script: delete study plans for a specific user by email.
 *
 * ─── KEY FORMAT WARNING ────────────────────────────────────────────────────────
 * The SUPABASE_SERVICE_ROLE_KEY in .env.local is the new "sb_secret_*" format.
 * This format CANNOT bypass RLS or access the admin auth API — it fails with
 * "Unregistered API key" or "Expected 3 parts in JWT".
 *
 * You need the REAL JWT service_role key from the Supabase dashboard:
 *   Settings → API → Project API keys → service_role
 *   It starts with "eyJ..." and has three dot-separated parts.
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Usage:
 *   SERVICE_ROLE_KEY="eyJ..." node scripts/admin-delete-study-plan.mjs puppyheavenllc@gmail.com
 *
 * Alternative — manual deletion via Supabase dashboard:
 *   1. Table Editor → auth.users → find puppyheavenllc@gmail.com → copy their id
 *   2. Table Editor → study_plans → filter user_id = <copied id> → select all → delete
 */

const SUPABASE_URL = 'https://ypsownmsoyljlqhcnrwa.supabase.co';
const SERVICE_KEY  = process.env.SERVICE_ROLE_KEY;
const TARGET_EMAIL = process.argv[2];

if (!SERVICE_KEY) {
  console.error('❌  Missing SERVICE_ROLE_KEY env var.');
  console.error('   Get it from: Supabase dashboard → Settings → API → service_role key (starts with eyJ...)');
  process.exit(1);
}
if (!TARGET_EMAIL) {
  console.error('❌  Usage: node scripts/admin-delete-study-plan.mjs <email>');
  process.exit(1);
}

// ── 1. Find user by email via admin API ──────────────────────────────────────
const usersResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
  headers: {
    apikey:        SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  },
});

if (!usersResp.ok) {
  const body = await usersResp.text();
  console.error(`❌  Auth admin API failed (${usersResp.status}):`, body);
  process.exit(1);
}

const { users } = await usersResp.json();
const target = users?.find(u => u.email === TARGET_EMAIL);

if (!target) {
  console.error(`❌  User not found: ${TARGET_EMAIL}`);
  console.log('Available users:', users?.map(u => u.email));
  process.exit(1);
}

console.log(`✅  Found user: ${target.email}  (id: ${target.id})`);

// ── 2. Show existing study plans ─────────────────────────────────────────────
const listResp = await fetch(
  `${SUPABASE_URL}/rest/v1/study_plans?user_id=eq.${target.id}&select=id,created_at&order=created_at.desc`,
  {
    headers: {
      apikey:        SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer:        'return=representation',
    },
  }
);

const existing = await listResp.json();
console.log(`📋  Study plans found: ${existing.length}`);
existing.forEach(p => console.log(`   • ${p.id}  created: ${p.created_at}`));

if (existing.length === 0) {
  console.log('Nothing to delete.');
  process.exit(0);
}

// ── 3. Delete them ────────────────────────────────────────────────────────────
const deleteResp = await fetch(
  `${SUPABASE_URL}/rest/v1/study_plans?user_id=eq.${target.id}`,
  {
    method: 'DELETE',
    headers: {
      apikey:        SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer:        'return=representation',
    },
  }
);

if (!deleteResp.ok) {
  const body = await deleteResp.text();
  console.error(`❌  Delete failed (${deleteResp.status}):`, body);
  process.exit(1);
}

const deleted = await deleteResp.json();
console.log(`🗑️   Deleted ${deleted.length} study plan(s) for ${TARGET_EMAIL}`);
