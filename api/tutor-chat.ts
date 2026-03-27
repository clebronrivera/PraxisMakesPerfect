// api/tutor-chat.ts
// Netlify Function — AI Tutor Chat
// Synchronous. Returns full response (not 202).

import { createClient } from '@supabase/supabase-js';
import type {
  TutorChatRequest,
  TutorChatResponse,
  ClaudeResponseShape,
  TutorIntent,
} from '../src/types/tutorChat';
import { classifyIntent } from '../src/utils/tutorIntentClassifier';
import { buildTutorContext, formatContextForPrompt } from '../src/utils/tutorContextBuilder';
import { selectQuizQuestion, evaluateQuizAnswer } from '../src/utils/tutorQuizEngine';
import type { QuestionItem, QuizEvaluationResult } from '../src/utils/tutorQuizEngine';
import { APP_GUIDE_CONTENT, PAGE_CONTEXT_HINTS } from '../src/data/app-guide';
import { skillMetadataV1 } from '../src/data/skill-metadata-v1';
import { PROGRESS_SKILLS } from '../src/utils/progressTaxonomy';
// Static import — Netlify bundles this into the function
import questionsData from '../src/data/questions.json';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1500;
const PROMPT_VERSION = 'tutor_v1';

// ─── Supabase helpers (verbatim from study-plan-background.ts) ───────────────

function getAnonClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase credentials not configured.');
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getUserClient(userJwt: string) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase credentials not configured.');
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getBearerToken(header?: string): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}

// ─── JSON parse with fallback repair ─────────────────────────────────────────

function parseClaudeResponse(raw: string): ClaudeResponseShape {
  // Strip markdown fences if present
  let cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

  // Find first { and last }
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);
    return {
      content: parsed.content || '',
      suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) ? parsed.suggestedFollowUps : [],
      poseQuestion: parsed.poseQuestion || undefined,
      artifact: parsed.artifact || undefined,
    };
  } catch {
    // Fallback: treat entire response as content
    return {
      content: raw.trim(),
      suggestedFollowUps: ['Tell me more', 'Quiz me', 'What should I focus on?'],
    };
  }
}

// ─── System prompt assembly ──────────────────────────────────────────────────

function buildSystemPrompt(
  intent: TutorIntent,
  userContext: string,
  sessionType: 'page-tutor' | 'floating',
  pageContext?: TutorChatRequest['pageContext'],
  quizEvaluation?: QuizEvaluationResult,
  quizQuestion?: QuestionItem,
  skillMetadataSnippet?: string,
): string {
  const sections: string[] = [];

  // Section A — Identity + scope + format
  sections.push(`You are PraxisBot, an AI study assistant for the Praxis 5403 (School Psychology) licensure exam.

SCOPE: Only answer questions about Praxis 5403 content, this user's study progress, and app navigation. Redirect off-topic questions politely.
DISCLAIMER: You are not affiliated with ETS. Information is for study purposes only.
EXAM: 4 domains, 45 skills, single-select and multi-select questions.
PROFICIENCY LEVELS: Demonstrating (≥80%), Approaching (60–79%), Emerging (<60%), Not started.

GROUNDING RULES:
- Only reference the user's skill profile and supplied metadata. Do not invent performance trends or exam rules not present in the context.
- When evidence is thin (attempts < 6), say the skill assessment is tentative or based on limited data.
- Cite actual skill names and IDs when discussing weak areas.

RESPONSE FORMAT: Always respond with valid JSON:
{ "content": "<markdown string>", "suggestedFollowUps": ["q1", "q2", "q3"] }
Optional fields: "poseQuestion": { "questionId": "...", "skillId": "..." }, "artifact": { "type": "...", "payload": {} }

${sessionType === 'floating' ? 'Keep content under 250 words.' : 'Keep content under 400 words.'}
Use **bold** and bullets freely. Be warm, encouraging, and specific.`);

  // Section B — User skill snapshot
  sections.push(userContext);

  // Section C — Skill metadata (when relevant)
  if (skillMetadataSnippet) {
    sections.push(`RELEVANT SKILL CONTENT:\n${skillMetadataSnippet}`);
  }

  // Section D — Page context (floating widget)
  if (sessionType === 'floating' && pageContext) {
    const pageHint = PAGE_CONTEXT_HINTS[pageContext.page] || '';
    sections.push(`USER'S CURRENT CONTEXT: ${pageHint}
${pageContext.questionId ? `Viewing question: ${pageContext.questionId}` : ''}
${pageContext.skillId ? `Skill context: ${pageContext.skillId}` : ''}`);
  }

  // Section E — App guide (when intent is app-guide)
  if (intent === 'app-guide') {
    sections.push(APP_GUIDE_CONTENT);
  }

  // Section F — Quiz evaluation context
  if (quizEvaluation) {
    sections.push(`QUIZ EVALUATION (pre-computed — do NOT change the correctness):
Result: ${quizEvaluation.isCorrect ? 'CORRECT' : 'INCORRECT'}
Correct answer(s): ${quizEvaluation.correctAnswers.join(', ')}
User selected: ${quizEvaluation.selectedAnswers.join(', ')}
Explanation: ${quizEvaluation.explanation}
${quizEvaluation.misconceptions.length > 0 ? `Misconceptions triggered: ${quizEvaluation.misconceptions.join(' | ')}` : ''}
Skill: ${quizEvaluation.skillId}

Your job: Explain WHY the correct answer is right, address the specific misconception if the user chose a wrong answer, and tie it back to the skill. Do NOT change the scored result.`);
  }

  // Section G — Quiz question to pose
  if (quizQuestion) {
    const choiceLines = Object.entries(quizQuestion.choices)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}. ${v}`)
      .join('\n');
    sections.push(`POSE THIS QUESTION to the user conversationally. Include the stem and all choices. Add poseQuestion to your JSON response.
Question ID: ${quizQuestion.id}
Skill: ${quizQuestion.skillId}
Stem: ${quizQuestion.question}
${choiceLines}
`);
  }

  return sections.join('\n\n---\n\n');
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function handler(event: { httpMethod: string; headers?: Record<string, string>; body?: string }) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const startTime = Date.now();

  try {
    // 1. Auth
    const idToken = getBearerToken(event.headers?.authorization || event.headers?.Authorization);
    if (!idToken) return json(401, { error: 'Missing authorization token' });

    const anonClient = getAnonClient();
    const { data: { user }, error: authError } = await anonClient.auth.getUser(idToken);
    if (authError || !user) return json(401, { error: 'Invalid token' });

    const userClient = getUserClient(idToken);

    // 2. Parse request
    const body: TutorChatRequest = JSON.parse(event.body || '{}');
    if (!body.message?.trim()) return json(400, { error: 'Message required' });

    // 3. Intent classification
    const intent = classifyIntent(body);

    // 4. Session management
    let sessionId = body.sessionId;
    if (!sessionId) {
      const title = body.message.slice(0, 60);
      const { data: newSession, error: sessionError } = await userClient
        .from('chat_sessions')
        .insert({ user_id: user.id, title, session_type: body.sessionType })
        .select('id')
        .single();
      if (sessionError || !newSession) return json(500, { error: 'Failed to create session' });
      sessionId = newSession.id;
    }

    // 5. Load conversation history (sliding window)
    const historyLimit = body.sessionType === 'floating' ? 5 : 10;
    const { data: recentMessages } = await userClient
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(historyLimit);
    const conversationHistory = (recentMessages || []).reverse();

    // 6. Load user progress
    const { data: userProgress } = await userClient
      .from('user_progress')
      .select('skill_scores, total_questions_seen, diagnostic_complete, adaptive_diagnostic_complete, preferred_display_name, full_name')
      .eq('user_id', user.id)
      .single();

    const skillScores = userProgress?.skill_scores || {};
    const diagnosticComplete = userProgress?.diagnostic_complete || userProgress?.adaptive_diagnostic_complete || false;
    const totalQuestionsSeen = userProgress?.total_questions_seen || 0;
    const displayName = userProgress?.preferred_display_name || userProgress?.full_name || null;

    // 7. Build tutor context (uses PROGRESS_SKILLS from progressTaxonomy)
    const tutorContext = buildTutorContext(
      user.id, displayName, diagnosticComplete, totalQuestionsSeen, skillScores,
    );
    const userContextPrompt = formatContextForPrompt(tutorContext);

    // 8. Handle quiz logic
    let quizQuestion: QuestionItem | null = null;
    let quizEvaluation: QuizEvaluationResult | undefined;
    const questions = questionsData as QuestionItem[];

    if (intent === 'quiz-answer' && body.quizAnswerFor) {
      const q = questions.find(q => q.id === body.quizAnswerFor!.questionId);
      if (q) {
        quizEvaluation = evaluateQuizAnswer(q, body.quizAnswerFor.selectedAnswers);
      }
    }

    if (intent === 'quiz-request') {
      // Get already-used question IDs in this session
      const { data: sessionQuizMessages } = await userClient
        .from('chat_messages')
        .select('quiz_question_id')
        .eq('session_id', sessionId)
        .not('quiz_question_id', 'is', null);
      const usedIds = new Set((sessionQuizMessages || []).map((m: { quiz_question_id: string }) => m.quiz_question_id));

      const selected = selectQuizQuestion(tutorContext, questions, usedIds);
      if (selected) {
        quizQuestion = selected.question;
      }
    }

    // 9. Skill metadata snippet (for relevant skills)
    let skillMetadataSnippet: string | undefined;
    const relevantSkillIds = new Set<string>();

    if (quizQuestion) relevantSkillIds.add(quizQuestion.skillId);
    if (quizEvaluation) relevantSkillIds.add(quizEvaluation.skillId);
    if (body.pageContext?.skillId) relevantSkillIds.add(body.pageContext.skillId);

    // Add top 3 emerging skills for general/artifact context
    if (intent === 'general' || intent === 'artifact-request') {
      tutorContext.emergingSkills.slice(0, 3).forEach(s => relevantSkillIds.add(s.skillId));
    }

    if (relevantSkillIds.size > 0) {
      const snippets = Array.from(relevantSkillIds).slice(0, 3).map(skillId => {
        const meta = skillMetadataV1[skillId];
        if (!meta) return '';
        const skillDef = PROGRESS_SKILLS.find(s => s.skillId === skillId);
        const skillName = skillDef?.fullLabel || skillId;
        return `${skillId} — ${skillName}:
  Vocabulary: ${meta.vocabulary.join(', ')}
  Misconceptions: ${meta.commonMisconceptions.join(' | ')}
  Case types: ${meta.caseArchetypes.join(' | ')}`;
      }).filter(Boolean);
      skillMetadataSnippet = snippets.join('\n\n');
    }

    // 10. Build system prompt
    const systemPrompt = buildSystemPrompt(
      intent, userContextPrompt, body.sessionType, body.pageContext,
      quizEvaluation, quizQuestion ?? undefined, skillMetadataSnippet,
    );

    // 11. Build messages for Claude
    const claudeMessages: { role: string; content: string }[] = [];
    for (const msg of conversationHistory) {
      claudeMessages.push({ role: msg.role, content: msg.content });
    }
    claudeMessages.push({ role: 'user', content: body.message });

    // 12. Call Claude
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return json(500, { error: 'API key not configured' });

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0.3,
        system: systemPrompt,
        messages: claudeMessages,
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error('[TutorChat] Claude API error:', errText);
      return json(502, { error: 'AI service error' });
    }

    const claudeData = await claudeResponse.json() as { content?: { text: string }[]; usage?: { input_tokens: number; output_tokens: number } };
    const rawContent = claudeData.content?.[0]?.text || '';
    const parsed = parseClaudeResponse(rawContent);

    // 13. Persist messages
    const latencyMs = Date.now() - startTime;
    const msgMetadata = {
      prompt_version: PROMPT_VERSION,
      model: MODEL,
      latency_ms: latencyMs,
      input_tokens: claudeData.usage?.input_tokens,
      output_tokens: claudeData.usage?.output_tokens,
    };

    // Insert user message
    await userClient.from('chat_messages').insert({
      session_id: sessionId,
      user_id: user.id,
      role: 'user',
      content: body.message,
      page_context: body.pageContext || null,
    });

    // Insert assistant message
    const { data: assistantMsg } = await userClient.from('chat_messages').insert({
      session_id: sessionId,
      user_id: user.id,
      role: 'assistant',
      content: parsed.content,
      assistant_intent: intent,
      quiz_question_id: quizQuestion?.id || parsed.poseQuestion?.questionId || null,
      quiz_skill_id: quizQuestion?.skillId || parsed.poseQuestion?.skillId || null,
      quiz_answered: intent === 'quiz-answer' ? true : null,
      artifact_type: parsed.artifact?.type || null,
      artifact_payload: parsed.artifact?.payload || null,
      metadata: msgMetadata,
    }).select('id').single();

    // Update session
    await userClient.from('chat_sessions').update({
      updated_at: new Date().toISOString(),
      message_count: (recentMessages?.length ?? 0) + 2,
    }).eq('id', sessionId);

    // 14. Build response
    const response: TutorChatResponse = {
      sessionId: sessionId!,
      messageId: assistantMsg?.id || '',
      content: parsed.content,
      suggestedFollowUps: parsed.suggestedFollowUps,
    };

    // Add quiz question data if posing a question
    if (quizQuestion) {
      const correctParts = quizQuestion.correct_answer.split(',').map((s: string) => s.trim());
      response.quizQuestion = {
        questionId: quizQuestion.id,
        skillId: quizQuestion.skillId,
        stem: quizQuestion.question,
        choices: Object.entries(quizQuestion.choices)
          .filter(([, v]) => v)
          .map(([k, v]) => ({ label: k, text: v as string })),
        isMultiSelect: correctParts.length > 1,
      };
    }

    if (parsed.artifact) {
      response.artifact = parsed.artifact;
    }

    return json(200, response);

  } catch (err: unknown) {
    console.error('[TutorChat] Error:', err);
    return json(500, { error: 'Internal server error' });
  }
}
