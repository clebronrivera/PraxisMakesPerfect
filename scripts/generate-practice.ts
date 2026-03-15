import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration ---
const DEFAULT_SKILLS_JSON_PATH = path.join(__dirname, '../FINAL_EXPORT/praxis5403 skills.json');
const SKILLS_JSON_PATH = path.resolve(
  process.cwd(),
  process.env.SKILLS_JSON_PATH || DEFAULT_SKILLS_JSON_PATH
);
const OUTPUT_DIR = path.resolve(
  process.cwd(),
  process.env.GENERATED_PRACTICE_OUTPUT_DIR || path.join(__dirname, '../data/generated_practice_questions')
);
const QUESTIONS_PER_SKILL = Number.parseInt(process.env.QUESTIONS_PER_SKILL || '20', 10);
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const INTER_QUESTION_DELAY_MS = Number.parseInt(process.env.INTER_QUESTION_DELAY_MS || '750', 10);
const INTER_SKILL_DELAY_MS = Number.parseInt(process.env.INTER_SKILL_DELAY_MS || '3000', 10);
const MAX_GENERATION_ATTEMPTS = Number.parseInt(process.env.MAX_GENERATION_ATTEMPTS || '3', 10);
const FORCE_REGENERATE = isTruthy(process.env.FORCE_REGENERATE);
const SKILL_IDS_FILTER = parseCsvEnv(process.env.SKILL_IDS);

type CognitiveComplexity = 'recall' | 'application';
type Difficulty = '1' | '2' | '3';

type SkillParam = {
  skill_id: string;
  skill_name: string;
  area: number;
  question_count?: number;
  recall_count?: number;
  application_count?: number;
  plain_language_definition?: string;
  topics_covered?: string[];
  generation_notes?: {
    tips_for_writing_questions?: string[];
    common_distractor_patterns?: string[];
    edge_cases_and_classification_warnings?: string[];
    key_terms_and_entities?: string[];
  };
};

type QuestionPlan = {
  topic: string;
  variationIndex: number;
  cognitiveComplexity: CognitiveComplexity;
  targetDifficulty: Difficulty;
};

function parseCsvEnv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function isTruthy(value: string | undefined): boolean {
  return /^(1|true|yes|y)$/i.test(value || '');
}

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set.');
    console.error('Set it before running the script, for example:');
    console.error('OPENAI_API_KEY=your_key npm run generate:practice');
    process.exit(1);
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (!Number.isInteger(QUESTIONS_PER_SKILL) || QUESTIONS_PER_SKILL <= 0) {
  console.error(`QUESTIONS_PER_SKILL must be a positive integer. Received: ${process.env.QUESTIONS_PER_SKILL}`);
  process.exit(1);
}

if (!Number.isInteger(INTER_QUESTION_DELAY_MS) || INTER_QUESTION_DELAY_MS < 0) {
  console.error(`INTER_QUESTION_DELAY_MS must be a non-negative integer. Received: ${process.env.INTER_QUESTION_DELAY_MS}`);
  process.exit(1);
}

if (!Number.isInteger(INTER_SKILL_DELAY_MS) || INTER_SKILL_DELAY_MS < 0) {
  console.error(`INTER_SKILL_DELAY_MS must be a non-negative integer. Received: ${process.env.INTER_SKILL_DELAY_MS}`);
  process.exit(1);
}

if (!Number.isInteger(MAX_GENERATION_ATTEMPTS) || MAX_GENERATION_ATTEMPTS <= 0) {
  console.error(`MAX_GENERATION_ATTEMPTS must be a positive integer. Received: ${process.env.MAX_GENERATION_ATTEMPTS}`);
  process.exit(1);
}

// --- Strict Schema Definition (Matching the Build Spec) ---
const OptionSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D']),
  text: z.string(),
  rationale: z.string(),
});

const QuestionSchema = z.object({
  question_id: z.string(),
  exam: z.literal('praxis5403'),
  skill_id: z.string(),
  skill_name: z.string(),
  area: z.number().int(),
  cognitive_complexity: z.enum(['recall', 'application']),
  difficulty: z.enum(['1', '2', '3']),
  stem: z.string(),
  options: z.array(OptionSchema),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  correct_rationale: z.string(),
  student_feedback_correct: z.string(),
  student_feedback_incorrect: z.string(),
  status: z.literal('draft'),
});

const QuestionEnvelopeSchema = z.object({
  question: QuestionSchema,
});

type Question = z.infer<typeof QuestionSchema>;

// --- Helper Functions ---

function zeroPad(num: number, places: number): string {
  return String(num).padStart(places, '0');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) {
      continue;
    }

    const normalized = normalizeText(trimmed);
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(trimmed);
  }

  return unique;
}

function getRequiredOptionOrder(options: Question['options']): string {
  return options.map((option) => option.id).join('');
}

function computeRecallTarget(skillParam: SkillParam, totalQuestions: number): number {
  const recallCount = skillParam.recall_count || 0;
  const applicationCount = skillParam.application_count || 0;
  const sourceTotal = recallCount + applicationCount;

  if (sourceTotal === 0) {
    return Math.min(totalQuestions, Math.round(totalQuestions * 0.25));
  }

  if (applicationCount === 0) {
    return totalQuestions;
  }

  if (recallCount === 0) {
    return 0;
  }

  const scaledRecall = Math.round((recallCount / sourceTotal) * totalQuestions);
  return Math.max(1, Math.min(totalQuestions - 1, scaledRecall));
}

function buildComplexityPlan(skillParam: SkillParam, totalQuestions: number): CognitiveComplexity[] {
  const recallTarget = computeRecallTarget(skillParam, totalQuestions);

  if (recallTarget === 0) {
    return Array.from({ length: totalQuestions }, () => 'application');
  }

  if (recallTarget === totalQuestions) {
    return Array.from({ length: totalQuestions }, () => 'recall');
  }

  const plan: CognitiveComplexity[] = [];
  let placedRecall = 0;

  for (let i = 0; i < totalQuestions; i++) {
    const expectedRecallByNow = Math.round(((i + 1) * recallTarget) / totalQuestions);
    if (placedRecall < expectedRecallByNow) {
      plan.push('recall');
      placedRecall += 1;
    } else {
      plan.push('application');
    }
  }

  return plan;
}

function getTargetDifficulty(index: number, cognitiveComplexity: CognitiveComplexity): Difficulty {
  if (cognitiveComplexity === 'recall') {
    return index % 3 === 0 ? '1' : '2';
  }

  return index % 4 === 3 ? '3' : '2';
}

function buildMicroTopicPool(skillParam: SkillParam): string[] {
  const primaryTopics = uniqueStrings(skillParam.topics_covered || []);
  const keyTermTopics = uniqueStrings(
    (skillParam.generation_notes?.key_terms_and_entities || []).map(
      (term) => `Focused distinction involving ${term}`
    )
  );

  return uniqueStrings([...primaryTopics, ...keyTermTopics]);
}

function buildQuestionPlan(skillParam: SkillParam, totalQuestions: number): QuestionPlan[] {
  const complexities = buildComplexityPlan(skillParam, totalQuestions);
  const microTopics = buildMicroTopicPool(skillParam);

  if (microTopics.length === 0) {
    throw new Error(`Skill ${skillParam.skill_id} has no usable micro-topics.`);
  }

  return Array.from({ length: totalQuestions }, (_, index) => {
    const topic = microTopics[index % microTopics.length];
    const variationIndex = Math.floor(index / microTopics.length) + 1;
    const cognitiveComplexity = complexities[index];

    return {
      topic,
      variationIndex,
      cognitiveComplexity,
      targetDifficulty: getTargetDifficulty(index, cognitiveComplexity),
    };
  });
}

function getQuestionSemanticIssues(question: Question, plan: QuestionPlan): string[] {
  const issues: string[] = [];
  const correctOption = question.options.find((option) => option.id === question.correct_answer);
  const stem = question.stem.trim();
  const normalizedStem = normalizeText(stem);
  const rationaleBlob = [question.correct_rationale, ...question.options.map((option) => option.rationale)].join(' ');
  const topicAllowsSequenceFraming = /first|initial|entry|sequence|stages|sequencing|operationally define|beginning/i.test(
    plan.topic
  );
  const usesSequenceFraming =
    normalizedStem.includes('first step') ||
    normalizedStem.includes('what should be the first') ||
    normalizedStem.includes('what is the first') ||
    normalizedStem.includes('what should the psychologist do first') ||
    normalizedStem.includes('what should the school psychologist focus on first');
  const asksForConsultationModel =
    normalizedStem.includes('consultation model') &&
    (normalizedStem.startsWith('which') || normalizedStem.startsWith('what'));

  if (question.options.length !== 4) {
    issues.push(`expected 4 options, received ${question.options.length}`);
  }

  if (getRequiredOptionOrder(question.options) !== 'ABCD') {
    issues.push(`option IDs must appear once each in A/B/C/D order, received ${getRequiredOptionOrder(question.options)}`);
  }

  if (!correctOption) {
    issues.push(`correct_answer ${question.correct_answer} does not match an option`);
  }

  if (asksForConsultationModel) {
    const badModelOption = question.options.find((option) => /direct service delivery/i.test(option.text));
    if (badModelOption) {
      issues.push('consultation-model stem includes "Direct Service Delivery" as an answer option');
    }

    if (/not a consultation model/i.test(rationaleBlob)) {
      issues.push('rationale contradicts the stem by stating that an answer is not a consultation model');
    }
  }

  if (correctOption && /direct service delivery/i.test(correctOption.text) && asksForConsultationModel) {
    issues.push('correct answer identifies a non-consultation service as a consultation model');
  }

  if (usesSequenceFraming && !topicAllowsSequenceFraming) {
    issues.push(`item defaulted to sequence framing for non-sequence topic "${plan.topic}"`);
  }

  return issues;
}

function postProcessQuestion(
  generatedQuestion: unknown,
  skillParam: SkillParam,
  plan: QuestionPlan,
  questionIndex: number
): Question {
  const q = generatedQuestion as Record<string, unknown>;
  q.question_id = `PQ-${skillParam.skill_id}-${zeroPad(questionIndex + 1, 3)}`;
  q.exam = 'praxis5403';
  q.skill_id = skillParam.skill_id;
  q.skill_name = skillParam.skill_name;
  q.area = skillParam.area;
  q.status = 'draft';

  const validQuestion = QuestionSchema.parse(q);
  const semanticIssues = getQuestionSemanticIssues(validQuestion, plan);

  if (semanticIssues.length > 0) {
    throw new Error(`semantic validation failed: ${semanticIssues.join('; ')}`);
  }

  return validQuestion;
}

function buildSingleQuestionPrompt(
  skillParam: SkillParam,
  plan: QuestionPlan,
  questionIndex: number,
  totalQuestions: number,
  previousStems: string[]
): string {
  const tips = skillParam.generation_notes?.tips_for_writing_questions || [];
  const distractors = skillParam.generation_notes?.common_distractor_patterns || [];
  const edgeCases = skillParam.generation_notes?.edge_cases_and_classification_warnings || [];
  const historyBlock =
    previousStems.length > 0
      ? `
### ALREADY GENERATED QUESTIONS (DO NOT REPEAT THESE SCENARIOS OR CONCEPTS)
${previousStems.map((stem) => `- ${stem}`).join('\n')}
`
      : '';

  return `
You are an expert assessment developer for the Praxis School Psychology (5403) exam.
Your task is to generate EXACTLY 1 formative practice question for a specific skill and one assigned micro-topic.

### TARGET SKILL
- ID: ${skillParam.skill_id}
- Name: ${skillParam.skill_name}
- Area: ${skillParam.area}
- Definition: ${skillParam.plain_language_definition || 'N/A'}

### ASSIGNED MICRO-TOPIC
- Slot: ${questionIndex + 1} of ${totalQuestions}
- Focus only on this topic: ${plan.topic}
- Cognitive complexity target: ${plan.cognitiveComplexity}
- Difficulty target: ${plan.targetDifficulty}
- Variation pass for this topic: ${plan.variationIndex}

### GENERATION NOTES
Tips: ${JSON.stringify(tips)}
Common Distractor Patterns: ${JSON.stringify(distractors)}
Edge Cases: ${JSON.stringify(edgeCases)}
${historyBlock}

### STRICT CONSTRAINTS
1. Generate exactly 1 question.
2. Focus on the assigned micro-topic. Do not drift to other topics unless the assigned topic explicitly requires a boundary distinction.
3. DO NOT reference NASP domains.
4. DO NOT use retired skills.
5. DO NOT create highly complex, diagnostic-caliber trick questions. This is formative practice.
6. DO NOT produce an ambiguous stem.
7. Create exactly 4 options in A, B, C, D order.
8. Only one option may be correct.
9. Every option must have a rationale explaining why it is correct or incorrect.
10. Stay entirely within the boundary of ${skillParam.skill_id}.
11. Use the requested cognitive complexity and difficulty target.
12. Consultation is an indirect service. Do not describe direct student service as a consultation model.
13. If the stem asks the student to identify a consultation model, every option must itself be framed as a consultation model or approach. Never use "Direct Service Delivery" as the correct answer to a consultation-model stem.
14. If the assigned topic is about the boundary between consultation and direct service, write the item so the student identifies the boundary correctly without turning a non-model into a model.
15. If variation pass is greater than 1, use a distinctly different angle, setting, or decision point than a basic restatement of the topic.
16. Do not default to a "What is the first step?" item unless the assigned micro-topic explicitly concerns entry steps, first steps, operational definition, or stage sequencing.
17. You MUST ensure your new question scenario, hypothetical student, and stem are distinctly different from the "ALREADY GENERATED QUESTIONS" list provided above. Do not reuse the same scenarios or specific situational variables.
18. Return exactly one object inside a JSON object named "question".
`;
}

async function generateQuestionForPlan(
  openai: OpenAI,
  skillParam: SkillParam,
  plan: QuestionPlan,
  questionIndex: number,
  totalQuestions: number,
  previousStems: string[]
): Promise<Question> {
  const promptText = buildSingleQuestionPrompt(skillParam, plan, questionIndex, totalQuestions, previousStems);

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    try {
      console.log(
        `   ↳ Q${questionIndex + 1}/${totalQuestions} attempt ${attempt}/${MAX_GENERATION_ATTEMPTS} | ${plan.cognitiveComplexity} | diff ${plan.targetDifficulty} | ${plan.topic}`
      );

      const completion = await openai.chat.completions.parse({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are a specialized JSON data generator for educational assessments.' },
          { role: 'user', content: promptText },
        ],
        response_format: zodResponseFormat(QuestionEnvelopeSchema, 'practice_question'),
        temperature: 0.6,
      });

      const parsed = completion.choices[0]?.message.parsed;
      if (!parsed?.question) {
        throw new Error('API returned null or malformed parsed data.');
      }

      return postProcessQuestion(parsed.question, skillParam, plan, questionIndex);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`   ✗ Question ${questionIndex + 1} failed on attempt ${attempt}: ${message}`);

      if (attempt === MAX_GENERATION_ATTEMPTS) {
        throw error;
      }

      await sleep(500 * attempt);
    }
  }

  throw new Error(`Unreachable retry state for question ${questionIndex + 1}.`);
}

// --- Main Generation Logic ---

async function generateForSkill(openai: OpenAI, skillParam: SkillParam) {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Generation for Skill: ${skillParam.skill_id} - ${skillParam.skill_name}`);
  console.log(`======================================================`);

  const plan = buildQuestionPlan(skillParam, QUESTIONS_PER_SKILL);
  const recallPlanned = plan.filter((item) => item.cognitiveComplexity === 'recall').length;
  const applicationPlanned = plan.length - recallPlanned;
  const uniqueTopics = new Set(plan.map((item) => normalizeText(item.topic))).size;

  console.log(
    `Planned ${plan.length} questions across ${uniqueTopics} micro-topics (${recallPlanned} recall / ${applicationPlanned} application).`
  );

  const generatedQuestions: Question[] = [];
  const acceptedStems: string[] = [];

  for (let i = 0; i < plan.length; i++) {
    const question = await generateQuestionForPlan(openai, skillParam, plan[i], i, plan.length, acceptedStems);
    generatedQuestions.push(question);
    acceptedStems.push(question.stem);

    if (INTER_QUESTION_DELAY_MS > 0 && i < plan.length - 1) {
      await sleep(INTER_QUESTION_DELAY_MS);
    }
  }

  const outputFile = path.join(OUTPUT_DIR, `${skillParam.skill_id}_practice.json`);
  fs.writeFileSync(outputFile, JSON.stringify(generatedQuestions, null, 2), 'utf-8');
  console.log(`✅ Saved ${generatedQuestions.length} questions to ${outputFile}`);
}

async function main() {
  if (!fs.existsSync(SKILLS_JSON_PATH)) {
    console.error(`Source JSON not found at ${SKILLS_JSON_PATH}`);
    console.error('Set SKILLS_JSON_PATH to the correct file before running the script.');
    process.exit(1);
  }

  const sourceData = JSON.parse(fs.readFileSync(SKILLS_JSON_PATH, 'utf-8'));
  let activeSkills: SkillParam[] = sourceData.skills || [];

  if (SKILL_IDS_FILTER.length > 0) {
    const requestedSkillIds = new Set(SKILL_IDS_FILTER);
    activeSkills = activeSkills.filter((skill) => requestedSkillIds.has(skill.skill_id));
    console.log(`SKILL_IDS filter applied. Running for: ${Array.from(requestedSkillIds).join(', ')}`);
  }

  if (process.env.SKILL_LIMIT) {
    activeSkills = activeSkills.slice(0, Number.parseInt(process.env.SKILL_LIMIT, 10));
    console.log(`SKILL_LIMIT is set. Only running for the first ${activeSkills.length} skills.`);
  }

  if (activeSkills.length === 0) {
    console.error('No skills parsed from JSON after filtering.');
    process.exit(1);
  }

  console.log(`Found ${activeSkills.length} active skills. Beginning systematic generation...`);

  const openai = getOpenAIClient();

  for (const skill of activeSkills) {
    const outputFile = path.join(OUTPUT_DIR, `${skill.skill_id}_practice.json`);
    if (!FORCE_REGENERATE && fs.existsSync(outputFile)) {
      console.log(`⏭️ Skipping ${skill.skill_id} - output already exists.`);
      continue;
    }

    try {
      await generateForSkill(openai, skill);
    } catch (error) {
      console.error(`🚨 Fatal API/Generation Error for ${skill.skill_id}:`, error);
    }

    if (INTER_SKILL_DELAY_MS > 0) {
      console.log(`Waiting ${INTER_SKILL_DELAY_MS}ms before next skill...`);
      await sleep(INTER_SKILL_DELAY_MS);
    }
  }

  console.log('\n🎉 Generation script finished running through all skills.');
}

main().catch(console.error);
