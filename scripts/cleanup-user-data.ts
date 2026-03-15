#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

type ParsedArgs = {
  uids: string[];
  emails: string[];
  allUsers: boolean;
  confirmDelete: boolean;
  help: boolean;
};

type UserCleanupSummary = {
  uid: string;
  email: string | null;
  userDocExists: boolean;
  responseLogs: number;
  legacyScreenerResponses: number;
  practiceResponses: number;
  diagnosticSessions: number;
  studyPlans: number;
  globalScores: number;
  betaFeedback: number;
  questionReports: number;
};

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    uids: [],
    emails: [],
    allUsers: false,
    confirmDelete: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }

    if (arg === '--all-users') {
      parsed.allUsers = true;
      continue;
    }

    if (arg === '--confirm-delete') {
      parsed.confirmDelete = true;
      continue;
    }

    if (arg === '--uid' && next) {
      parsed.uids.push(next);
      index += 1;
      continue;
    }

    if (arg.startsWith('--uid=')) {
      parsed.uids.push(arg.slice('--uid='.length));
      continue;
    }

    if (arg === '--email' && next) {
      parsed.emails.push(next);
      index += 1;
      continue;
    }

    if (arg.startsWith('--email=')) {
      parsed.emails.push(arg.slice('--email='.length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function printUsage(): void {
  console.log(`
Cleanup Firestore user data safely.

Usage:
  npm run firebase:cleanup-user-data -- --uid <firebase-uid>
  npm run firebase:cleanup-user-data -- --email <user@example.com>
  npm run firebase:cleanup-user-data -- --uid <uid> --confirm-delete
  npm run firebase:cleanup-user-data -- --all-users

Flags:
  --uid <uid>            Target a specific Firestore user document by uid
  --email <email>        Resolve uid(s) by users.authMetrics.email
  --all-users            Target every user document in Firestore
  --confirm-delete       Actually delete Firestore data (otherwise dry run)
  --help                 Show this message

Behavior:
  - Dry run is the default
  - Deletes Firestore user data only, not Firebase Auth accounts
  - Removes users/{uid}, responses/{uid}, practiceResponses/{uid},
    diagnosticSessions/{uid}, studyPlans/{uid}, userProgress/{uid},
    plus betaFeedback/questionReports rows tied to the uid
`);
}

function loadServiceAccount(): Record<string, unknown> {
  const explicitPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const fallbackPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  const credentialPath = explicitPath ? path.resolve(explicitPath) : fallbackPath;

  if (!fs.existsSync(credentialPath)) {
    throw new Error(
      `Firebase Admin credentials not found. Expected GOOGLE_APPLICATION_CREDENTIALS or ${fallbackPath}`
    );
  }

  return JSON.parse(fs.readFileSync(credentialPath, 'utf8')) as Record<string, unknown>;
}

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  return initializeApp({
    credential: cert(loadServiceAccount())
  });
}

async function countDocsInSubcollections(rootPath: string): Promise<number> {
  const db = getFirestore(getAdminApp());
  const rootRef = db.doc(rootPath);
  const subcollections = await rootRef.listCollections();

  let total = 0;

  for (const subcollection of subcollections) {
    const snapshot = await subcollection.get();
    total += snapshot.size;
  }

  return total;
}

async function resolveTargetUserIds(args: ParsedArgs): Promise<string[]> {
  const db = getFirestore(getAdminApp());
  const targetIds = new Set<string>(args.uids);

  if (args.allUsers) {
    const usersSnapshot = await db.collection('users').get();
    usersSnapshot.docs.forEach((docSnapshot) => targetIds.add(docSnapshot.id));
  }

  for (const email of args.emails) {
    const snapshot = await db.collection('users')
      .where('authMetrics.email', '==', email)
      .get();

    snapshot.docs.forEach((docSnapshot) => targetIds.add(docSnapshot.id));
  }

  return [...targetIds];
}

async function buildUserSummary(uid: string): Promise<UserCleanupSummary> {
  const db = getFirestore(getAdminApp());
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data() as { authMetrics?: { email?: string | null } } | undefined;

  const [
    responseLogsSnap,
    legacyScreenerSnap,
    studyPlansSnap,
    globalScoresSnap,
    betaFeedbackSnap,
    questionReportsSnap,
    practiceResponsesCount,
    diagnosticSessionsCount
  ] = await Promise.all([
    userRef.collection('responses').get(),
    db.collection('responses').doc(uid).collection('screener').get(),
    db.collection('studyPlans').doc(uid).collection('plans').get(),
    db.collection('userProgress').doc(uid).collection('globalScores').get(),
    db.collection('betaFeedback').where('userId', '==', uid).get(),
    db.collection('questionReports').where('userId', '==', uid).get(),
    countDocsInSubcollections(`practiceResponses/${uid}`),
    countDocsInSubcollections(`diagnosticSessions/${uid}`)
  ]);

  return {
    uid,
    email: userData?.authMetrics?.email ?? null,
    userDocExists: userSnap.exists,
    responseLogs: responseLogsSnap.size,
    legacyScreenerResponses: legacyScreenerSnap.size,
    practiceResponses: practiceResponsesCount,
    diagnosticSessions: diagnosticSessionsCount,
    studyPlans: studyPlansSnap.size,
    globalScores: globalScoresSnap.size,
    betaFeedback: betaFeedbackSnap.size,
    questionReports: questionReportsSnap.size
  };
}

function printSummary(summary: UserCleanupSummary): void {
  const approxTotalDocs =
    (summary.userDocExists ? 1 : 0) +
    summary.responseLogs +
    summary.legacyScreenerResponses +
    summary.practiceResponses +
    summary.diagnosticSessions +
    summary.studyPlans +
    summary.globalScores +
    summary.betaFeedback +
    summary.questionReports;

  console.log(`\nUser ${summary.uid}${summary.email ? ` (${summary.email})` : ''}`);
  console.log(`  users/{uid}: ${summary.userDocExists ? 'present' : 'missing'}`);
  console.log(`  users/{uid}/responses: ${summary.responseLogs}`);
  console.log(`  responses/{uid}/screener: ${summary.legacyScreenerResponses}`);
  console.log(`  practiceResponses/{uid}/**: ${summary.practiceResponses}`);
  console.log(`  diagnosticSessions/{uid}/**: ${summary.diagnosticSessions}`);
  console.log(`  studyPlans/{uid}/plans: ${summary.studyPlans}`);
  console.log(`  userProgress/{uid}/globalScores: ${summary.globalScores}`);
  console.log(`  betaFeedback rows: ${summary.betaFeedback}`);
  console.log(`  questionReports rows: ${summary.questionReports}`);
  console.log(`  Approx docs to remove: ${approxTotalDocs}`);
}

async function deleteUserData(summary: UserCleanupSummary): Promise<void> {
  const db = getFirestore(getAdminApp());
  const uid = summary.uid;

  const rootDocPaths = [
    `users/${uid}`,
    `responses/${uid}`,
    `practiceResponses/${uid}`,
    `diagnosticSessions/${uid}`,
    `studyPlans/${uid}`,
    `userProgress/${uid}`
  ];

  for (const docPath of rootDocPaths) {
    await db.recursiveDelete(db.doc(docPath));
  }

  const [betaFeedbackSnap, questionReportsSnap] = await Promise.all([
    db.collection('betaFeedback').where('userId', '==', uid).get(),
    db.collection('questionReports').where('userId', '==', uid).get()
  ]);

  if (!betaFeedbackSnap.empty) {
    const batch = db.batch();
    betaFeedbackSnap.docs.forEach((docSnapshot) => batch.delete(docSnapshot.ref));
    await batch.commit();
  }

  if (!questionReportsSnap.empty) {
    const batch = db.batch();
    questionReportsSnap.docs.forEach((docSnapshot) => batch.delete(docSnapshot.ref));
    await batch.commit();
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  if (!args.allUsers && args.uids.length === 0 && args.emails.length === 0) {
    printUsage();
    throw new Error('Provide at least one selector: --uid, --email, or --all-users');
  }

  const userIds = await resolveTargetUserIds(args);

  if (userIds.length === 0) {
    console.log('No matching users found.');
    return;
  }

  console.log(args.confirmDelete ? 'DELETE MODE' : 'DRY RUN');
  console.log(`Targets: ${userIds.length} user(s)`);

  const summaries: UserCleanupSummary[] = [];

  for (const uid of userIds) {
    const summary = await buildUserSummary(uid);
    summaries.push(summary);
    printSummary(summary);
  }

  if (!args.confirmDelete) {
    console.log('\nDry run only. Re-run with --confirm-delete to remove this Firestore data.');
    return;
  }

  for (const summary of summaries) {
    console.log(`\nDeleting Firestore data for ${summary.uid}...`);
    await deleteUserData(summary);
    console.log(`Deleted Firestore data for ${summary.uid}.`);
  }

  console.log('\nCleanup complete. Firebase Auth users were not deleted.');
}

main().catch((error) => {
  console.error('\nCleanup failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
