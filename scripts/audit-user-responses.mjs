/**
 * Audit all responses for a given user email and produce a CSV.
 * Usage: node scripts/audit-user-responses.mjs clebronrivera@icloud.com
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://ypsownmsoyljlqhcnrwa.supabase.co';
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SERVICE_ROLE_KEY env var');
  console.error('Usage: SERVICE_ROLE_KEY="eyJ..." node scripts/audit-user-responses.mjs <user-email>');
  process.exit(1);
}

const targetEmail = process.argv[2] || 'clebronrivera@icloud.com';

const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Skill ID → full label mapping (from progressTaxonomy.ts)
const SKILL_LABELS = {
  'CON-01': 'Consultation Models and Methods',
  'DBD-01': 'RIOT Framework and Multi-Method Information Gathering',
  'DBD-03': 'Cognitive and Intellectual Assessment',
  'DBD-05': 'Diagnostic and Processing Measures',
  'DBD-06': 'Emotional and Behavioral Assessment Instruments',
  'DBD-07': 'Functional Behavioral Assessment',
  'DBD-08': 'Curriculum-Based Measurement and Progress Monitoring',
  'DBD-09': 'Ecological Assessment and Contextual Factors',
  'DBD-10': 'Background Information and Records Review',
  'PSY-01': 'Test Scores, Norms, and Interpretation',
  'PSY-02': 'Reliability and Validity Principles',
  'PSY-03': 'Problem-Solving Framework and MTSS in Assessment',
  'PSY-04': 'Assessment of Culturally and Linguistically Diverse Students',
  'ACA-02': 'Curricular Accommodations and Modifications',
  'ACA-03': 'Self-Regulated Learning, Metacognition, and Study Skills',
  'ACA-04': 'Instructional Strategies and Effective Pedagogy',
  'ACA-06': 'Learning Theories and Cognitive Development',
  'ACA-07': 'Language Development and Literacy',
  'ACA-08': 'Cognitive Processes and Executive Functioning',
  'ACA-09': 'Health Conditions and Educational Impact',
  'DEV-01': 'Child and Adolescent Development (Erikson, Piaget, Developmental Milestones)',
  'MBH-02': 'Individual and Group Counseling Interventions',
  'MBH-03': 'Theoretical Models of Intervention (CBT, ABA, Solution-Focused)',
  'MBH-04': 'Child and Adolescent Psychopathology',
  'MBH-05': 'Biological Bases of Behavior and Mental Health',
  'FAM-02': 'Family Involvement and Advocacy',
  'FAM-03': 'Interagency Collaboration',
  'SAF-01': 'Schoolwide Prevention Practices (PBIS, Bullying, School Climate)',
  'SAF-03': 'Crisis and Threat Assessment',
  'SAF-04': 'Crisis Prevention, Intervention, Response, and Recovery',
  'SWP-02': 'Educational Policy and Practice (Retention, Promotion, Tracking)',
  'SWP-03': 'Evidence-Based Schoolwide Practices',
  'SWP-04': 'Multi-Tiered Systems of Support (MTSS) at Systems Level',
  'DIV-01': 'Cultural and Individual Factors in Intervention Design',
  'DIV-03': 'Implicit and Explicit Bias in Decision Making',
  'DIV-05': 'Special Education Services and Diverse Needs',
  'ETH-01': 'NASP Ethics and Ethical Problem-Solving',
  'ETH-02': 'Professional Liability and Supervision',
  'ETH-03': 'Advocacy, Lifelong Learning, and Professional Growth',
  'LEG-01': 'FERPA and Educational Records Confidentiality',
  'LEG-02': 'IDEA and Special Education Law',
  'LEG-03': 'Section 504 and ADA Protections',
  'LEG-04': 'Case Law and Student Rights',
  'RES-02': 'Applying Research to Practice',
  'RES-03': 'Research Designs and Basic Statistics',
};

// Load question bank
const questionsPath = resolve(__dirname, '../src/data/questions.json');
const questions = JSON.parse(readFileSync(questionsPath, 'utf8'));
const questionMap = new Map(questions.map(q => [q.UNIQUEID, q]));

async function main() {
  console.log(`Looking up user: ${targetEmail}`);

  // Find user by email via auth admin API
  const { data: { users }, error: listErr } = await svc.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error('Failed to list users:', listErr.message);
    process.exit(1);
  }

  const user = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
  if (!user) {
    console.error(`No user found with email: ${targetEmail}`);
    process.exit(1);
  }

  console.log(`Found user: ${user.id}`);

  // Fetch all responses ordered by created_at
  const { data: responses, error: respErr } = await svc
    .from('responses')
    .select('question_id, skill_id, domain_id, assessment_type, is_correct, confidence, time_on_item_seconds, selected_answers, correct_answers, session_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (respErr) {
    console.error('Failed to fetch responses:', respErr.message);
    process.exit(1);
  }

  console.log(`Fetched ${responses.length} responses`);

  // Group by skill for display, but keep original order number
  // Build CSV rows
  const rows = responses.map((r, idx) => {
    const q = questionMap.get(r.question_id);
    const stem = q ? q.question_stem : `[Question not found: ${r.question_id}]`;
    const skillId = r.skill_id || (q ? q.current_skill_id : 'unknown');
    const skillName = SKILL_LABELS[skillId] || skillId;
    const result = r.is_correct ? 'Correct' : 'Incorrect';
    const selectedRaw = r.selected_answers;
    let selectedLabel = '';
    if (Array.isArray(selectedRaw) && selectedRaw.length > 0 && q) {
      selectedLabel = selectedRaw.map(letter => `${letter}: ${q[letter] || ''}`).join(' | ');
    } else if (typeof selectedRaw === 'string' && q) {
      selectedLabel = `${selectedRaw}: ${q[selectedRaw] || ''}`;
    }

    return {
      order: idx + 1,
      skill_id: skillId,
      skill_name: skillName,
      assessment_type: r.assessment_type || '',
      question_id: r.question_id,
      question_stem: stem,
      result,
      selected_answer: selectedLabel,
      correct_answer: r.correct_answers || (q ? q.correct_answers : ''),
      time_seconds: r.time_on_item_seconds || '',
      confidence: r.confidence || '',
      created_at: r.created_at,
    };
  });

  // Sort by skill_id for grouped view, but keep order number
  const rowsBySkill = [...rows].sort((a, b) => a.skill_id.localeCompare(b.skill_id));

  // Write chronological CSV
  const chronoPath = resolve(__dirname, `../exports/audit_${targetEmail.replace(/@/g, '_at_')}_chronological.csv`);
  const skillPath = resolve(__dirname, `../exports/audit_${targetEmail.replace(/@/g, '_at_')}_by_skill.csv`);

  // Ensure exports dir
  import('fs').then(({ mkdirSync }) => {
    try { mkdirSync(resolve(__dirname, '../exports'), { recursive: true }); } catch {}
  });

  const { mkdirSync } = await import('fs');
  try { mkdirSync(resolve(__dirname, '../exports'), { recursive: true }); } catch {}

  const headers = ['Order','Skill ID','Skill Name','Assessment Type','Question ID','Question Stem','Result','Selected Answer','Correct Answer','Time (sec)','Confidence','Timestamp'];

  function toCsvRow(r) {
    return [
      r.order,
      r.skill_id,
      r.skill_name,
      r.assessment_type,
      r.question_id,
      `"${(r.question_stem || '').replace(/"/g, '""')}"`,
      r.result,
      `"${(r.selected_answer || '').replace(/"/g, '""')}"`,
      r.correct_answer,
      r.time_seconds,
      r.confidence,
      r.created_at,
    ].join(',');
  }

  const chronoCsv = [headers.join(','), ...rows.map(toCsvRow)].join('\n');
  const skillCsv = [headers.join(','), ...rowsBySkill.map(toCsvRow)].join('\n');

  writeFileSync(chronoPath, chronoCsv, 'utf8');
  writeFileSync(skillPath, skillCsv, 'utf8');

  console.log(`\nDone!`);
  console.log(`  Chronological: ${chronoPath}`);
  console.log(`  By skill:      ${skillPath}`);
  console.log(`\nSummary:`);
  console.log(`  Total questions: ${rows.length}`);
  console.log(`  Correct: ${rows.filter(r => r.result === 'Correct').length}`);
  console.log(`  Incorrect: ${rows.filter(r => r.result === 'Incorrect').length}`);

  // Skill summary
  const skillMap = {};
  for (const r of rows) {
    if (!skillMap[r.skill_id]) skillMap[r.skill_id] = { correct: 0, total: 0 };
    skillMap[r.skill_id].total++;
    if (r.result === 'Correct') skillMap[r.skill_id].correct++;
  }
  console.log(`\nSkills covered: ${Object.keys(skillMap).length}`);
  for (const [sid, stats] of Object.entries(skillMap).sort()) {
    console.log(`  ${sid}: ${stats.correct}/${stats.total} correct`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
