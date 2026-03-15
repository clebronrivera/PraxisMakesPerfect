import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  STUDY_PLAN_API_VERSION,
  StudyPlanApiRequestSchema,
  StudyPlanApiResponseSchema
} from '../src/types/studyPlanApi';

const MODEL = 'claude-sonnet-4-20250514';

function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials are not configured.');
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
}

function getBearerToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

function getParsedRequestBody(body: unknown) {
  if (!body) {
    throw new Error('Request body is missing.');
  }

  const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
  return StudyPlanApiRequestSchema.parse(parsedBody);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const idToken = getBearerToken(req.headers.authorization);
    if (!idToken) {
      return res.status(401).json({ error: 'Missing authentication token.' });
    }

    const app = getFirebaseAdminApp();
    const decodedToken = await getAuth(app).verifyIdToken(idToken);

    const requestBody = getParsedRequestBody(req.body);
    if (decodedToken.uid !== requestBody.userId) {
      return res.status(403).json({ error: 'Authenticated user does not match requested study guide owner.' });
    }

    const prompt = requestBody.prompt;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured.');
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 3000,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const anthropicBody = await anthropicResponse.json().catch(() => null);

    if (!anthropicResponse.ok) {
      console.error('[study-plan api] Anthropic request failed:', anthropicBody);
      return res.status(502).json({ error: 'Study plan generation failed upstream. Please retry.' });
    }

    const content = Array.isArray(anthropicBody?.content)
      ? anthropicBody.content
          .filter((block: { type?: string; text?: string }) => block?.type === 'text' && typeof block.text === 'string')
          .map((block: { text: string }) => block.text)
          .join('\n')
      : '';

    if (!content) {
      return res.status(502).json({ error: 'Study plan generation returned an empty response.' });
    }

    const responseBody = StudyPlanApiResponseSchema.parse({
      content,
      model: MODEL,
      generatedAt: new Date().toISOString(),
      apiVersion: STUDY_PLAN_API_VERSION
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    console.error('[study-plan api] Request failed:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Study plan generation failed.'
    });
  }
}
