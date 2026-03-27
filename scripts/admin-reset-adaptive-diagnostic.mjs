/**
 * Admin script: reset the adaptive diagnostic for a specific user by email.
 *
 * This archives then deletes all adaptive (+ full/diagnostic) assessment responses,
 * rebuilds skill/domain scores from remaining practice responses, and clears the
 * adaptive_diagnostic_complete flag so the user can restart from scratch.
 *
 * ─── KEY FORMAT WARNING ────────────────────────────────────────────────────────
 * Requires the REAL JWT service_role key (starts with "eyJ...") from:
 *   Supabase dashboard → Settings → API → Project API keys → service_role
 * The sb_secret_* format will NOT work here.
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Usage:
 *   SERVICE_ROLE_KEY="eyJ..." node scripts/admin-reset-adaptive-diagnostic.mjs user@example.com
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
  console.error('❌  Missing email argument.');
  console.error('   Usage: SERVICE_ROLE_KEY="eyJ..." node scripts/admin-reset-adaptive-diagnostic.mjs user@example.com');
  process.exit(1);
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function supabaseGet(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function supabasePatch(path, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH', headers, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH ${path} → ${r.status}: ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

async function supabaseDelete(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: 'DELETE', headers });
  if (!r.ok) throw new Error(`DELETE ${path} → ${r.status}: ${await r.text()}`);
  return null;
}

// ── 1. Look up user by email ─────────────────────────────────────────────────
console.log(`\n🔍  Looking up user: ${TARGET_EMAIL}`);
const authUsers = await fetch(
  `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(TARGET_EMAIL)}`,
  { headers }
).then(r => r.json());

const user = authUsers?.users?.find(u => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());
if (!user) {
  console.error(`❌  No user found with email: ${TARGET_EMAIL}`);
  process.exit(1);
}
const userId = user.id;
console.log(`✅  Found user: ${userId} (${user.email})`);

// ── 2. Count adaptive/diagnostic responses ───────────────────────────────────
const allResponses = await supabaseGet(
  `responses?user_id=eq.${userId}&assessment_type=in.(adaptive,full,diagnostic)&select=*&order=created_at.desc`
);
console.log(`\n📊  Found ${allResponses.length} assessment responses to archive+delete:`);
const byType = {};
for (const r of allResponses) {
  byType[r.assessment_type] = (byType[r.assessment_type] || 0) + 1;
}
for (const [type, count] of Object.entries(byType)) {
  console.log(`     ${type}: ${count}`);
}

// ── 3. Fetch user_progress snapshot (needed for archive) ─────────────────────
console.log('\n🔧  Fetching user_progress snapshot...');
const progressRows = await supabaseGet(`user_progress?user_id=eq.${userId}&select=*`);
const progress = progressRows[0];

if (allResponses.length === 0) {
  console.log('   Nothing to delete.');
} else {
  // ── 4. Archive into assessment_reset_archive ──────────────────────────────
  // Table schema: {target_user_id, actor_email, scope, user_progress_snapshot, responses_archived, response_count}
  console.log('\n📦  Archiving to assessment_reset_archive...');
  const archiveRow = {
    target_user_id: userId,
    actor_email: 'admin-script@internal',
    scope: 'full_diagnostic',
    user_progress_snapshot: progress ?? {},
    responses_archived: allResponses,
    response_count: allResponses.length,
  };

  const archiveRes = await fetch(`${SUPABASE_URL}/rest/v1/assessment_reset_archive`, {
    method: 'POST',
    headers,
    body: JSON.stringify(archiveRow),
  });
  if (!archiveRes.ok) {
    console.warn(`⚠️   Archive failed (${archiveRes.status}) — continuing with delete anyway.`);
    console.warn(`     ${await archiveRes.text()}`);
  } else {
    console.log(`✅  Archived snapshot (${allResponses.length} responses).`);
  }

  // ── 5. Delete responses ──────────────────────────────────────────────────
  console.log('\n🗑️   Deleting responses...');
  await supabaseDelete(
    `responses?user_id=eq.${userId}&assessment_type=in.(adaptive,full,diagnostic)`
  );
  console.log('✅  Responses deleted.');
}

if (!progress) {
  console.log('   No user_progress row found — nothing to reset.');
} else {
  const lastSession = progress.last_session;
  const sessionMode = lastSession?.mode;
  const clearLastSession = ['adaptive', 'full', 'diagnostic'].includes(sessionMode);

  await supabasePatch(`user_progress?user_id=eq.${userId}`, {
    diagnostic_complete: false,
    full_assessment_complete: false,
    adaptive_diagnostic_complete: false,
    diagnostic_question_ids: [],
    last_diagnostic_session_id: null,
    full_assessment_question_ids: [],
    pre_assessment_question_ids: [],
    last_full_assessment_session_id: null,
    last_session: clearLastSession ? null : lastSession,
    skill_scores: {},
    domain_scores: {},
    weakest_domains: [],
    factual_gaps: [],
    error_patterns: [],
    total_questions_seen: 0,
    updated_at: new Date().toISOString(),
  });
  console.log('✅  user_progress reset.');
  if (clearLastSession) {
    console.log(`   Cleared last_session (was mode="${sessionMode}")`);
  }
}

console.log(`\n🎉  Done! ${TARGET_EMAIL} can now start a fresh adaptive diagnostic.\n`);
