import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as serviceAccount from '../serviceAccountKey.json';

async function main() {
  try {
    const app = initializeApp({
      credential: cert(serviceAccount),
    });
    
    const db = getFirestore(app);
    console.log('Starting recalculation of domainScores...');
    
    const usersSnapshot = await db.collection('users').get();
    let updatedUsersCount = 0;
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const screenerComplete = data.screenerComplete || (data.screenerItemIds && data.screenerItemIds.length > 0);
      
      if (!screenerComplete) continue;
      
      const userId = doc.id;
      // Get all shared assessment responses, then prefer the latest screener session.
      const responsesSnap = await db.collection(`users/${userId}/responses`).get();
      
      if (responsesSnap.empty) {
        continue;
      }

      // Group responses by sessionId to find the most recent complete screener or legacy quick diagnostic session
      const responsesBySession = new Map<string, any[]>();
      responsesSnap.forEach(rDoc => {
        const rData = rDoc.data();
        if (rData.assessmentType !== 'screener' && rData.assessmentType !== 'diagnostic') {
          return;
        }
        if (rData.sessionId) {
          const sessionLogs = responsesBySession.get(rData.sessionId) || [];
          sessionLogs.push(rData);
          responsesBySession.set(rData.sessionId, sessionLogs);
        }
      });
      
      let latestSessionId = null;
      let latestTimestamp = -Infinity;
      
      responsesBySession.forEach((logs, sessionId) => {
        const sessionLatestTimestamp = Math.max(...logs.map(log => log.timestamp || 0));
        if (sessionLatestTimestamp > latestTimestamp) {
          latestTimestamp = sessionLatestTimestamp;
          latestSessionId = sessionId;
        }
      });
      
      if (!latestSessionId) continue;
      
      const latestResponses = responsesBySession.get(latestSessionId) || [];
      
      const newDomainScores: Record<number, { correct: number; total: number }> = {};
      
      latestResponses.forEach(r => {
        const domainIds = r.domainIds || [];
        domainIds.forEach((domainId: number) => {
          if (!newDomainScores[domainId]) {
            newDomainScores[domainId] = { correct: 0, total: 0 };
          }
          newDomainScores[domainId].total++;
          if (r.isCorrect) {
            newDomainScores[domainId].correct++;
          }
        });
      });
      
      // Calculate weakest domains
      const weakestDomains = Object.entries(newDomainScores)
        .map(([domain, stats]) => ({
          domain: Number(domain),
          accuracy: stats.total > 0 ? stats.correct / stats.total : 0
        }))
        .sort((a, b) => a.accuracy - b.accuracy)
        .map(entry => entry.domain);

      const updateData = {
        domainScores: newDomainScores,
        weakestDomains: weakestDomains,
      };
      
      console.log(`Updating user ${userId} (${data.authMetrics?.email}). Old scores:`, data.domainScores, `New scores:`, newDomainScores);
      
      await db.collection('users').doc(userId).update(updateData);
      
      updatedUsersCount++;
    }
    
    console.log(`\nRecalculation complete! Updated ${updatedUsersCount} users.`);
    
  } catch (error) {
    console.error('Recalculation failed:', error);
  }
}

main();
