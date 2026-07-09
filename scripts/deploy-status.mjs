#!/usr/bin/env node
/**
 * deploy-status.mjs — answer "is `main` actually live in production?"
 *
 * Merging to `main` is only a production ship if Netlify is (a) not paused and
 * (b) has built the merge. Both have silently NOT been true before (a manual
 * site pause on 2026-07-02 meant three merged phases never deployed while they
 * looked "shipped"). This script makes the real state explicit:
 *
 *   - PAUSED   → site.disabled=true (nothing deploys until resumed)
 *   - DOWN     → prod URL not 200 and not a deliberate pause
 *   - STALE    → published deploy is behind local origin/main HEAD
 *   - LIVE     → published deploy matches origin/main and prod serves 200
 *
 * Uses the authenticated Netlify CLI (`netlify api ...`); no token needed.
 * Read-only. Run: `npm run deploy:status`.
 */
import { execFileSync } from 'node:child_process';

const SITE_ID = 'f8d73f2d-a306-439d-9e2a-5b569c0b5155'; // praxismakesperfect
const PROD_URL = 'https://praxismakesperfect.netlify.app';

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function sh(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function netlifyApi(method, payload) {
  const out = sh('netlify', ['api', method, '--data', JSON.stringify(payload)]);
  return JSON.parse(out);
}

function httpStatus(url) {
  try {
    return sh('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', '-m', '15', url]).trim();
  } catch {
    return 'ERR';
  }
}

function shortSha(ref) {
  return (ref || '').slice(0, 9) || '—';
}

async function main() {
  let site;
  try {
    site = netlifyApi('getSite', { site_id: SITE_ID });
  } catch {
    console.error(c.red('✖ Could not reach the Netlify API.'));
    console.error(c.dim('  The Netlify CLI must be installed and logged in (`netlify login`).'));
    process.exit(2);
  }

  const published = site.published_deploy || {};
  const prodCode = httpStatus(PROD_URL);

  let localMain = null;
  try {
    localMain = sh('git', ['rev-parse', 'origin/main']).trim();
  } catch {
    /* not a git checkout / no origin — skip the staleness comparison */
  }

  const publishedSha = published.commit_ref || null;
  const isStale = localMain && publishedSha && localMain !== publishedSha;

  // ── Verdict ────────────────────────────────────────────────────────────────
  let verdict;
  if (site.disabled) {
    verdict = c.yellow(`PAUSED — ${site.disabled_reason || 'site disabled'} (nothing deploys until resumed)`);
  } else if (prodCode !== '200') {
    verdict = c.red(`DOWN — prod returned HTTP ${prodCode}`);
  } else if (isStale) {
    verdict = c.yellow('STALE — origin/main is ahead of the published production deploy');
  } else {
    verdict = c.green('LIVE — published deploy matches origin/main and prod serves 200');
  }

  console.log(c.bold('\nNetlify production status') + c.dim(`  (${site.name})`));
  console.log('─'.repeat(60));
  console.log(`  verdict         ${verdict}`);
  console.log(`  paused          ${site.disabled ? c.yellow('yes — ' + (site.disabled_reason || '')) : 'no'}`);
  console.log(`  prod HTTP       ${prodCode === '200' ? c.green(prodCode) : c.red(prodCode)}  ${c.dim(PROD_URL)}`);
  console.log(`  published       ${shortSha(publishedSha)}  ${c.dim((published.title || '').split('\n')[0].slice(0, 48))}`);
  console.log(`  published at    ${published.published_at || published.created_at || '—'}`);
  console.log(`  local main      ${shortSha(localMain)}${isStale ? c.yellow('   ← ahead of published') : ''}`);
  console.log('');

  // Non-zero exit on anything a "did my merge ship?" check should treat as not-shipped,
  // so this can gate a release script or CI step.
  if (site.disabled || prodCode !== '200' || isStale) process.exit(1);
}

main();
