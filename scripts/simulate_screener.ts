import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables (will be injected by --env-file)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateScreener() {
  const timestamp = Date.now();
  const email = `fictitious_screener_${timestamp}@example.com`;
  const password = 'password123';

  console.log(`[1] Creating user: ${email}`);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    console.error('Failed to create user:', authError);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`User created successfully! ID: ${userId}`);

  console.log('[2] Loading questions...');
  const questionsPath = path.resolve(__dirname, '../src/data/questions.json');
  const questionsRaw = fs.readFileSync(questionsPath, 'utf8');
  const allQuestions = JSON.parse(questionsRaw);

  // Grab the first 50 questions
  const screenerQuestions = allQuestions.slice(0, 50);
  console.log(`Loaded ${screenerQuestions.length} questions for the screener.`);

  const responses = [];
  const domainStats: Record<number, { correct: number; total: number }> = {};
  const options = ['A', 'B', 'C', 'D'];

  console.log('[3] Generating random responses...');
  // Need to process sequentially to ensure ordering if any, or just batch insert
  for (const q of screenerQuestions) {
    // Random answer A, B, C, or D
    const randomOption = options[Math.floor(Math.random() * options.length)];
    
    const questionId = q.UNIQUEID;
    // Check if correct
    const correctAns = q.correct_answers || 'A';
    const isCorrect = Array.isArray(correctAns) 
      ? correctAns.includes(randomOption) 
      : correctAns.includes(randomOption);

    const domainId = parseInt(q.DOMAIN) || Math.floor(Math.random() * 10) + 1;

    if (!domainStats[domainId]) {
      domainStats[domainId] = { correct: 0, total: 0 };
    }
    domainStats[domainId].total += 1;
    if (isCorrect) {
      domainStats[domainId].correct += 1;
    }

    responses.push({
      user_id: userId,
      session_id: 'simulated_screener_session',
      question_id: questionId,
      skill_id: q.current_skill_id || 'unknown-skill',
      domain_id: domainId,
      domain_ids: [domainId],
      assessment_type: 'screener',
      is_correct: isCorrect,
      confidence: 'medium', // Default
      time_spent: Math.floor(Math.random() * 30000) + 10000, // 10-40 seconds
      selected_answers: [randomOption],
      correct_answers: [correctAns],
    });
  }

  console.log('[4] Inserting responses into Supabase...');
  const { error: insertError } = await supabase.from('responses').insert(responses);

  if (insertError) {
    console.error('Failed to insert responses:', insertError);
    process.exit(1);
  }

  console.log('[5] Calculating domain scores and finalizing user progress...');
  const domainScores: Record<number, number> = {};
  for (const [dId, stats] of Object.entries(domainStats)) {
    domainScores[Number(dId)] = Math.round((stats.correct / stats.total) * 100);
  }

  console.log('Domain Scores generated:', domainScores);

  const { error: progressError } = await supabase.from('user_progress').upsert({
    user_id: userId,
    screener_complete: true,
    total_questions_seen: 50,
    domain_scores: domainScores,
    screener_results: {
      domain_scores: domainScores,
      completed_at: new Date().toISOString()
    },
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });

  if (progressError) {
    console.error('Failed to update user_progress:', progressError);
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('✅ Simulation Complete!');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('======================================================\n');
}

simulateScreener().catch(console.error);
