import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as serviceAccount from '../serviceAccountKey.json';

async function main() {
  try {
    const app = initializeApp({
      credential: cert(serviceAccount),
    });
    
    const db = getFirestore(app);
    console.log('Starting migration of screener responses...');
    
    const usersSnapshot = await db.collection('users').get();
    let migratedUsersCount = 0;
    let totalResponsesMigrated = 0;
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const screenerComplete = data.screenerComplete || (data.screenerItemIds && data.screenerItemIds.length > 0);
      
      if (!screenerComplete) continue;
      
      const userId = doc.id;
      const screenerSnap = await db.collection(`responses/${userId}/screener`).get();
      
      if (screenerSnap.empty) {
        continue;
      }

      console.log(`Processing user ${userId} (${data.authMetrics?.email || 'unknown'}): ${screenerSnap.size} screener responses found.`);
      
      const batch = db.batch();
      let userMigratedCount = 0;
      
      const sessionId = data.lastPreAssessmentSessionId || `migrated-screener-${Date.now()}`;
      
      for (const responseDoc of screenerSnap.docs) {
        const screenerData = responseDoc.data();
        
        const timestampMillis = screenerData.timestamp || Date.now();
        
        const newResponseLog = {
           questionId: screenerData.question_id,
           skillId: screenerData.skill_id || '',
           domainIds: typeof screenerData.domain_id === 'number' ? [screenerData.domain_id] : [],
           assessmentType: 'screener',
           sessionId: sessionId,
           isCorrect: screenerData.is_correct === true,
           confidence: screenerData.confidence || 'medium',
           timeSpent: 30, // Fallback since it wasn't tracked here originally
           timestamp: timestampMillis,
           createdAt: screenerData.createdAt || Timestamp.fromMillis(timestampMillis),
           selectedAnswers: screenerData.selected_answer ? screenerData.selected_answer.split(',') : [],
           correctAnswers: screenerData.correct_answer ? screenerData.correct_answer.split(',') : []
        };
        
        // Use a deterministic ID to make the script idempotent
        const newDocRef = db.collection(`users/${userId}/responses`).doc(`${sessionId}_${screenerData.question_id}`);
        batch.set(newDocRef, newResponseLog, { merge: true });
        userMigratedCount++;
      }
      
      if (userMigratedCount > 0) {
        await batch.commit();
        console.log(`Successfully migrated ${userMigratedCount} responses for user ${userId}.`);
        migratedUsersCount++;
        totalResponsesMigrated += userMigratedCount;
      }
    }
    
    console.log(`\nMigration complete! Migrated ${totalResponsesMigrated} responses across ${migratedUsersCount} users.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

main();
