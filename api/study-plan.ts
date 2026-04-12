import { createClient } from '@supabase/supabase-js';
import {
  STUDY_PLAN_API_VERSION,
  StudyPlanApiRequestSchema,
  StudyPlanApiResponseSchema
} from '../src/types/studyPlanApi';

const MODEL = 'claude-sonnet-4-20250514';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase Service Role credentials are not configured.');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

function getBearerToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

function getParsedRequestBody(body: string | null | undefined) {
  if (!body) {
    throw new Error('Request body is missing.');
  }

  const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
  return StudyPlanApiRequestSchema.parse(parsedBody);
}

// Netlify Lambda format: export const handler = async (event) => ({ statusCode, body })
export const handler = async (event: { httpMethod?: string; headers?: Record<string, string>; body?: string | null }) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  try {
    // Netlify lowercases all header keys
    const authHeader = event.headers?.['authorization'] || event.headers?.['Authorization'];
    const idToken = getBearerToken(authHeader);
    if (!idToken) {
      return json(401, { error: 'Missing authentication token.' });
    }

    const supabase = getSupabaseClient();

    // Verify the JWT by getting the user. Supabase's `getUser(jwt)` verifies it securely.
    const { data: { user }, error: authError } = await supabase.auth.getUser(idToken);

    if (authError || !user) {
      console.error('[study-plan api] Supabase Auth Error:', authError);
      return json(401, { error: 'Invalid authentication token.' });
    }

    const requestBody = getParsedRequestBody(event.body);
    if (user.id !== requestBody.userId) {
      return json(403, { error: 'Authenticated user does not match requested study guide owner.' });
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
        max_tokens: 8000,
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
      return json(502, { error: 'Study plan generation failed upstream. Please retry.' });
    }

    const content = Array.isArray(anthropicBody?.content)
      ? anthropicBody.content
          .filter((block: { type?: string; text?: string }) => block?.type === 'text' && typeof block.text === 'string')
          .map((block: { text: string }) => block.text)
          .join('\n')
      : '';

    if (!content) {
      return json(502, { error: 'Study plan generation returned an empty response.' });
    }

    const responseBody = StudyPlanApiResponseSchema.parse({
      content,
      model: MODEL,
      generatedAt: new Date().toISOString(),
      apiVersion: STUDY_PLAN_API_VERSION
    });

    return json(200, responseBody);
  } catch (error) {
    console.error('[study-plan api] Request failed:', error);
    return json(500, {
      error: error instanceof Error ? error.message : 'Study plan generation failed.'
    });
  }
};
