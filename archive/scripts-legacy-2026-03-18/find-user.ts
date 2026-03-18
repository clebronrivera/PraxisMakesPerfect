import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as serviceAccount from '../serviceAccountKey.json';

async function main() {
  try {
    const app = initializeApp({
      credential: cert(serviceAccount),
    });
    
    const db = getFirestore(app);
    console.log('Connected to Firestore via Admin SDK. Searching for "puppy" users...');
    
    // Attempt to list some users or find one matching puppy heaven LLC
    const usersSnapshot = await db.collection('users').get();
    let found = false;
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const strData = JSON.stringify(data).toLowerCase();
      if (strData.includes('puppy')) {
        console.log(`\n--- Found matching user ---`);
        console.log(`UID: ${doc.id}`);
        console.log(`Email / DisplayName: ${data.authMetrics?.email || 'N/A'} / ${data.authMetrics?.displayName || 'N/A'}`);
        console.log(`Data:`, JSON.stringify(data, null, 2));
        found = true;
        
        // Also check their responses
        console.log('\nFetching responses...');
        const responsesSnap = await db.collection(`users/${doc.id}/responses`).get();
        console.log(`Found ${responsesSnap.size} responses in main collection.`);
        if (responsesSnap.size > 0) {
           console.log('Sample response from main collection:', responsesSnap.docs[0].data());
        }
        
        const screenerSnap = await db.collection(`users/${doc.id}/screener`).get();
        console.log(`Found ${screenerSnap.size} responses in screener collection.`);
        if (screenerSnap.size > 0) {
           console.log('Sample response from screener collection:', screenerSnap.docs[0].data());
        }
      }
    }
    
    if (!found) {
      console.log('No users found matching "puppy". Total users checked:', usersSnapshot.size);
    }
  } catch (error) {
    console.error('Failed to initialize or query:', error);
  }
}

main();
