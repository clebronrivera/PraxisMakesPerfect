import { createClient } from '@supabase/supabase-js';
import {
  STUDY_PLAN_API_VERSION,
  StudyPlanApiRequestSchema,
  StudyPlanApiResponseSchema
} from '../src/types/studyPlanApi';

const MODEL = 'claude-sonnet-4-20250514';

function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase Service Role credentials are not configured.');
  }

  // Using service role to bypass RLS, primarily for verification and admin actions
  return createClient(supabaseUrl, supabaseServiceKey);
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

    const supabase = getSupabaseClient();
    
    // Verify the JWT by getting the user. Supabase's `getUser(jwt)` verifies it securely.
    const { data: { user }, error: authError } = await supabase.auth.getUser(idToken);

    if (authError || !user) {
      console.error('[study-plan api] Supabase Auth Error:', authError);
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    const requestBody = getParsedRequestBody(req.body);
    if (user.id !== requestBody.userId) {
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
