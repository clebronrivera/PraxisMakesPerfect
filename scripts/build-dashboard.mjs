/**
 * build-dashboard.mjs
 *
 * Reads questions.json + Phase A CSVs, merges classifications,
 * and writes a self-contained content-authoring/dashboard.html.
 *
 * Run: node scripts/build-dashboard.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── 1. Skill name lookup from progressTaxonomy ────────────────────────────────
const SKILL_NAMES = {
  'CON-01': { short: 'Consultation Models',      full: 'Consultation Models and Methods',                                         domain: 1 },
  'DBD-01': { short: 'RIOT Framework',            full: 'RIOT Framework and Multi-Method Information Gathering',                   domain: 1 },
  'DBD-03': { short: 'Cognitive Assessment',      full: 'Cognitive and Intellectual Assessment',                                   domain: 1 },
  'DBD-05': { short: 'Processing Measures',       full: 'Diagnostic and Processing Measures',                                     domain: 1 },
  'DBD-06': { short: 'Behavioral Assessment',     full: 'Emotional and Behavioral Assessment Instruments',                        domain: 1 },
  'DBD-07': { short: 'FBA',                       full: 'Functional Behavioral Assessment',                                       domain: 1 },
  'DBD-08': { short: 'Progress Monitoring',       full: 'Curriculum-Based Measurement and Progress Monitoring',                   domain: 1 },
  'DBD-09': { short: 'Ecological Assessment',     full: 'Ecological Assessment and Contextual Factors',                           domain: 1 },
  'DBD-10': { short: 'Records Review',            full: 'Background Information and Records Review',                              domain: 1 },
  'PSY-01': { short: 'Score Interpretation',      full: 'Test Scores, Norms, and Interpretation',                                 domain: 1 },
  'PSY-02': { short: 'Reliability and Validity',  full: 'Reliability and Validity Principles',                                    domain: 1 },
  'PSY-03': { short: 'MTSS in Assessment',        full: 'Problem-Solving Framework and MTSS in Assessment',                      domain: 1 },
  'PSY-04': { short: 'CLD Assessment',            full: 'Assessment of Culturally and Linguistically Diverse Students',           domain: 1 },
  'ACA-02': { short: 'Accommodations',            full: 'Curricular Accommodations and Modifications',                            domain: 2 },
  'ACA-03': { short: 'Study Skills',              full: 'Self-Regulated Learning, Metacognition, and Study Skills',               domain: 2 },
  'ACA-04': { short: 'Instructional Strategies',  full: 'Instructional Strategies and Effective Pedagogy',                       domain: 2 },
  'ACA-06': { short: 'Learning Theory',           full: 'Learning Theories and Cognitive Development',                            domain: 2 },
  'ACA-07': { short: 'Language and Literacy',     full: 'Language Development and Literacy',                                      domain: 2 },
  'ACA-08': { short: 'Executive Function',        full: 'Cognitive Processes and Executive Functioning',                          domain: 2 },
  'ACA-09': { short: 'Health Impact',             full: 'Health Conditions and Educational Impact',                               domain: 2 },
  'DEV-01': { short: 'Development',               full: 'Child and Adolescent Development (Erikson, Piaget, Milestones)',         domain: 2 },
  'MBH-02': { short: 'Counseling Supports',       full: 'Individual and Group Counseling Interventions',                          domain: 2 },
  'MBH-03': { short: 'Intervention Models',       full: 'Theoretical Models of Intervention (CBT, ABA, Solution-Focused)',       domain: 2 },
  'MBH-04': { short: 'Psychopathology',           full: 'Child and Adolescent Psychopathology',                                   domain: 2 },
  'MBH-05': { short: 'Biological Bases',          full: 'Biological Bases of Behavior and Mental Health',                         domain: 2 },
  'FAM-02': { short: 'Family Advocacy',           full: 'Family Involvement and Advocacy',                                        domain: 3 },
  'FAM-03': { short: 'Interagency Collaboration', full: 'Interagency Collaboration',                                              domain: 3 },
  'SAF-01': { short: 'Schoolwide Prevention',     full: 'Schoolwide Prevention Practices (PBIS, Bullying, School Climate)',       domain: 3 },
  'SAF-03': { short: 'Threat Assessment',         full: 'Crisis and Threat Assessment',                                           domain: 3 },
  'SAF-04': { short: 'Crisis Response',           full: 'Crisis Prevention, Intervention, Response, and Recovery',                domain: 3 },
  'SWP-02': { short: 'Policy and Practice',       full: 'Educational Policy and Practice (Retention, Promotion, Tracking)',      domain: 3 },
  'SWP-03': { short: 'Schoolwide Practices',      full: 'Evidence-Based Schoolwide Practices',                                    domain: 3 },
  'SWP-04': { short: 'Systems MTSS',              full: 'Multi-Tiered Systems of Support (MTSS) at Systems Level',               domain: 3 },
  'DIV-01': { short: 'Cultural Factors',          full: 'Cultural and Individual Factors in Intervention Design',                 domain: 4 },
  'DIV-03': { short: 'Bias in Decisions',         full: 'Implicit and Explicit Bias in Decision Making',                          domain: 4 },
  'DIV-05': { short: 'Diverse Needs',             full: 'Special Education Services and Diverse Needs',                           domain: 4 },
  'ETH-01': { short: 'Ethical Problem-Solving',   full: 'NASP Ethics and Ethical Problem-Solving',                               domain: 4 },
  'ETH-02': { short: 'Liability and Supervision', full: 'Professional Liability and Supervision',                                 domain: 4 },
  'ETH-03': { short: 'Advocacy and Growth',       full: 'Advocacy, Lifelong Learning, and Professional Growth',                  domain: 4 },
  'LEG-01': { short: 'FERPA',                     full: 'FERPA and Educational Records Confidentiality',                          domain: 4 },
  'LEG-02': { short: 'IDEA',                      full: 'IDEA and Special Education Law',                                         domain: 4 },
  'LEG-03': { short: 'Section 504 and ADA',       full: 'Section 504 and ADA Protections',                                        domain: 4 },
  'LEG-04': { short: 'Case Law',                  full: 'Case Law and Student Rights',                                             domain: 4 },
  'RES-02': { short: 'Research to Practice',      full: 'Applying Research to Practice',                                          domain: 4 },
  'RES-03': { short: 'Research Design',           full: 'Research Designs and Basic Statistics',                                  domain: 4 },
};

const DOMAIN_NAMES = {
  1: 'Professional Practices',
  2: 'Student-Level Services',
  3: 'Systems-Level Services',
  4: 'Foundations',
};

// ── 2. Parse Phase A CSVs ─────────────────────────────────────────────────────
// Returns: Map<UNIQUEID, Map<letter, { tier, error_type, misconception, skill_deficit }>>
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const rows = [];
  // Simple CSV parser that handles quoted fields
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        if (inQuotes && line[c + 1] === '"') { current += '"'; c++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current); current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current);
    if (fields.length >= 6) {
      rows.push({
        uniqueId: fields[0].replace(/^"|"$/g, '').trim(),
        letter:   fields[1].replace(/^"|"$/g, '').trim().toUpperCase(),
        tier:     fields[2].replace(/^"|"$/g, '').trim(),
        errorType:fields[3].replace(/^"|"$/g, '').trim(),
        misconception: fields[4].replace(/^"|"$/g, '').trim(),
        skillDeficit:  fields[5].replace(/^"|"$/g, '').trim(),
      });
    }
  }
  return rows;
}

const phaseADir = path.join(ROOT, 'content-authoring/output/phase-A');
// Map: uniqueId -> { A: {...}, B: {...}, C: {...}, D: {...} }
const csvData = {};

if (fs.existsSync(phaseADir)) {
  const csvFiles = fs.readdirSync(phaseADir).filter(f => f.endsWith('-phase-A.csv'));
  for (const file of csvFiles) {
    const content = fs.readFileSync(path.join(phaseADir, file), 'utf8');
    const rows = parseCSV(content);
    for (const row of rows) {
      if (!csvData[row.uniqueId]) csvData[row.uniqueId] = {};
      csvData[row.uniqueId][row.letter] = {
        tier: row.tier,
        errorType: row.errorType,
        misconception: row.misconception,
        skillDeficit: row.skillDeficit,
      };
    }
  }
  console.log(`Loaded Phase A CSV data for ${Object.keys(csvData).length} question-distractor sets from ${csvFiles.length} files`);
} else {
  console.warn('Phase A directory not found:', phaseADir);
}

// ── 3. Load and merge questions ───────────────────────────────────────────────
const questionsRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/questions.json'), 'utf8'));
console.log(`Loaded ${questionsRaw.length} questions from questions.json`);

function getDistractorFromCsv(uniqueId, letter) {
  return csvData[uniqueId]?.[letter] || null;
}

function getDistractorFromJson(q, letter) {
  const tier = q[`distractor_tier_${letter}`];
  const errorType = q[`distractor_error_type_${letter}`];
  const misconception = q[`distractor_misconception_${letter}`];
  const skillDeficit = q[`distractor_skill_deficit_${letter}`];
  if (!tier && !errorType && !misconception && !skillDeficit) return null;
  return { tier, errorType, misconception, skillDeficit };
}

function buildDistractor(q, letter) {
  // CSV takes precedence over questions.json
  const csv = getDistractorFromCsv(q.UNIQUEID, letter);
  if (csv) return csv;
  return getDistractorFromJson(q, letter);
}

// Build merged question objects
const questions = questionsRaw.map(q => {
  const correctLetters = (q.correct_answers || '')
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);

  const options = {};
  const distractors = {};

  for (const letter of ['A', 'B', 'C', 'D']) {
    const text = q[letter];
    if (!text || !text.trim()) continue;
    options[letter] = text.trim();
    if (!correctLetters.includes(letter)) {
      distractors[letter] = buildDistractor(q, letter);
    }
  }

  const skillId = q.current_skill_id || q.original_skill_id || '';
  const skillMeta = SKILL_NAMES[skillId] || null;

  return {
    id: q.UNIQUEID,
    skillId,
    skillShort: skillMeta?.short || skillId,
    skillFull: skillMeta?.full || skillId,
    domain: skillMeta?.domain || 0,
    hasCaseVignette: q.has_case_vignette === 'True' || (q.case_text && q.case_text.trim().length > 0),
    caseText: q.case_text || '',
    stem: q.question_stem || '',
    options,
    correctLetters,
    distractors, // letter -> { tier, errorType, misconception, skillDeficit } | null
    cognitiveComplexity: q.cognitive_complexity || '',
    isMultiSelect: q.is_multi_select === 'True',
    auditStatus: q.audit_status || '',
    errorClusterTag: q.error_cluster_tag || '',
  };
});

// ── 4. Group by skill, compute stats ─────────────────────────────────────────
const skillGroups = {};

for (const q of questions) {
  if (!skillGroups[q.skillId]) {
    skillGroups[q.skillId] = {
      skillId: q.skillId,
      skillShort: q.skillShort,
      skillFull: q.skillFull,
      domain: q.domain,
      questions: [],
    };
  }
  skillGroups[q.skillId].questions.push(q);
}

// Compute classification coverage per skill
for (const skill of Object.values(skillGroups)) {
  let totalWrongSlots = 0;
  let classifiedSlots = 0;
  for (const q of skill.questions) {
    for (const [letter, distractor] of Object.entries(q.distractors)) {
      totalWrongSlots++;
      if (distractor && distractor.tier) classifiedSlots++;
    }
  }
  skill.totalWrongSlots = totalWrongSlots;
  skill.classifiedSlots = classifiedSlots;
  skill.coveragePct = totalWrongSlots > 0 ? Math.round((classifiedSlots / totalWrongSlots) * 100) : 0;
}

// Sort skills by domain then skill ID
const sortedSkillIds = Object.keys(skillGroups).sort((a, b) => {
  const da = skillGroups[a].domain, db = skillGroups[b].domain;
  if (da !== db) return da - db;
  return a.localeCompare(b);
});

console.log(`Built ${sortedSkillIds.length} skill groups`);

// ── 5. Serialize data for embedding ──────────────────────────────────────────
const embeddedData = {
  skills: sortedSkillIds.map(id => ({
    skillId: id,
    skillShort: skillGroups[id].skillShort,
    skillFull: skillGroups[id].skillFull,
    domain: skillGroups[id].domain,
    domainName: DOMAIN_NAMES[skillGroups[id].domain] || '',
    coveragePct: skillGroups[id].coveragePct,
    classifiedSlots: skillGroups[id].classifiedSlots,
    totalWrongSlots: skillGroups[id].totalWrongSlots,
    questionCount: skillGroups[id].questions.length,
  })),
  questionsBySkill: Object.fromEntries(
    sortedSkillIds.map(id => [id, skillGroups[id].questions])
  ),
  domainNames: DOMAIN_NAMES,
};

const dataJson = JSON.stringify(embeddedData);

// ── 6. Build HTML ─────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Question Bank Review Dashboard</title>
<style>
/* ── Reset & Base ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; background: #f0f2f5; color: #1a1a2e; line-height: 1.5; }

/* ── Layout ── */
.app { display: flex; height: 100vh; overflow: hidden; }

/* ── Sidebar ── */
.sidebar {
  width: 260px; min-width: 260px;
  background: #1e2a3a;
  color: #e8edf3;
  display: flex; flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}
.sidebar-header {
  padding: 18px 16px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}
.sidebar-header h1 {
  font-size: 13px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: #94a3c0; margin-bottom: 2px;
}
.sidebar-header .subtitle {
  font-size: 11px; color: #5a6e8a;
}
.sidebar-search {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.sidebar-search input {
  width: 100%; padding: 7px 10px;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px; color: #e8edf3; font-size: 13px; outline: none;
  transition: border-color 0.15s;
}
.sidebar-search input::placeholder { color: #4a5e78; }
.sidebar-search input:focus { border-color: #4f7fba; }

.domain-group { border-bottom: 1px solid rgba(255,255,255,0.05); }
.domain-label {
  padding: 8px 14px 4px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: #4a6080;
}
.skill-list { overflow-y: auto; flex: 1; }
.skill-item {
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.12s;
  border-left: 3px solid transparent;
  position: relative;
}
.skill-item:hover { background: rgba(255,255,255,0.05); }
.skill-item.active {
  background: rgba(79,127,186,0.18);
  border-left-color: #4f7fba;
}
.skill-item-top {
  display: flex; align-items: center; justify-content: space-between;
  gap: 6px;
}
.skill-id {
  font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
  color: #5a7faa; flex-shrink: 0;
}
.skill-short {
  font-size: 12px; font-weight: 500; color: #c8d4e3;
  flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.skill-q-count {
  font-size: 10px; color: #4a5e78; flex-shrink: 0;
}
.skill-progress-bar {
  margin-top: 4px; height: 3px; background: rgba(255,255,255,0.08);
  border-radius: 2px; overflow: hidden;
}
.skill-progress-fill {
  height: 100%; border-radius: 2px;
  transition: width 0.3s ease;
}
.skill-item.hidden { display: none; }

/* ── Main area ── */
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.top-bar {
  background: #fff; border-bottom: 1px solid #e2e8f0;
  padding: 14px 24px;
  display: flex; align-items: center; gap: 16px;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.top-bar-left { flex: 1; min-width: 0; }
.top-bar-skill-id {
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: #4f7fba; margin-bottom: 1px;
}
.top-bar-skill-name {
  font-size: 16px; font-weight: 700; color: #1a2540;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.top-bar-meta {
  display: flex; align-items: center; gap: 12px; margin-top: 2px;
}
.top-bar-meta span { font-size: 12px; color: #64748b; }
.progress-bar-wrap {
  width: 140px; height: 5px; background: #e2e8f0;
  border-radius: 3px; overflow: hidden;
}
.progress-bar-fill {
  height: 100%; background: #4f7fba; border-radius: 3px;
  transition: width 0.2s ease;
}

.nav-controls {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
.nav-btn {
  padding: 7px 16px; border-radius: 7px; border: 1px solid #e2e8f0;
  background: #fff; color: #374151; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.12s;
}
.nav-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #cbd5e1; }
.nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.nav-counter {
  font-size: 13px; font-weight: 600; color: #374151;
  min-width: 60px; text-align: center;
}

.content-area {
  flex: 1; overflow-y: auto; padding: 24px;
}

/* ── Empty State ── */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; color: #94a3b8; text-align: center; padding: 40px;
}
.empty-state .icon { font-size: 48px; margin-bottom: 12px; }
.empty-state h2 { font-size: 18px; color: #64748b; margin-bottom: 6px; }
.empty-state p { font-size: 14px; }

/* ── Question Card ── */
.question-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04);
  overflow: hidden;
  max-width: 860px;
  margin: 0 auto;
}

.card-header {
  padding: 14px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.card-header-left {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 100px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.03em;
}
.badge-id { background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe; }
.badge-complexity-application { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.badge-complexity-analysis { background: #fce7f3; color: #9d174d; border: 1px solid #fbcfe8; }
.badge-complexity-recall { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.badge-complexity-default { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
.badge-multi { background: #ede9fe; color: #6d28d9; border: 1px solid #ddd6fe; }

.quality-badge {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
  border: 2px solid transparent;
}
.quality-green { background: #d1fae5; border-color: #6ee7b7; }
.quality-yellow { background: #fef3c7; border-color: #fcd34d; }
.quality-red { background: #fee2e2; border-color: #fca5a5; }

.card-body { padding: 20px; }

/* Vignette */
.vignette-block {
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-left: 4px solid #94a3b8;
  border-radius: 8px; padding: 14px 16px;
  margin-bottom: 18px;
}
.vignette-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: #64748b; margin-bottom: 6px;
}
.vignette-text {
  font-size: 14px; color: #374151; line-height: 1.7;
}

/* Stem */
.stem-text {
  font-size: 16px; font-weight: 500; color: #111827;
  line-height: 1.6; margin-bottom: 20px;
}

/* Answer choices */
.choices { display: flex; flex-direction: column; gap: 10px; }

.choice-group { display: flex; flex-direction: column; gap: 0; }

.choice-pill {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 16px; border-radius: 8px;
  border: 2px solid transparent;
  position: relative;
}
.choice-correct {
  background: #ecfdf5; border-color: #6ee7b7;
}
.choice-wrong {
  background: #fff7f7; border-color: #fca5a5;
  border-bottom-left-radius: 0; border-bottom-right-radius: 0;
  border-bottom: none;
}
.choice-wrong-no-class {
  background: #fffbeb; border-color: #fcd34d;
}
.choice-letter {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; flex-shrink: 0; margin-top: 1px;
}
.choice-correct .choice-letter { background: #6ee7b7; color: #065f46; }
.choice-wrong .choice-letter,
.choice-wrong-no-class .choice-letter { background: #fca5a5; color: #7f1d1d; }
.choice-text { font-size: 14px; color: #1f2937; line-height: 1.55; flex: 1; }
.choice-marker {
  font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 3px;
}
.choice-correct .choice-marker { color: #059669; }
.choice-wrong .choice-marker { color: #dc2626; }
.choice-wrong-no-class .choice-marker { color: #d97706; }

/* Classification block */
.classification-block {
  background: #fff;
  border: 2px solid #fca5a5;
  border-top: none;
  border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;
  padding: 12px 16px 14px 54px; /* left pad aligns with text */
}
.classification-unclassified {
  border-color: #fcd34d;
  background: #fffdf0;
}
.classification-row {
  display: flex; align-items: flex-start; gap: 8px;
  margin-bottom: 8px; flex-wrap: wrap;
}
.classification-row:last-child { margin-bottom: 0; }
.tier-badge {
  display: inline-flex; align-items: center;
  padding: 2px 8px; border-radius: 100px;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
}
.tier-L1 { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
.tier-L2 { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.tier-L3 { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
.tier-unknown { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }
.error-type-badge {
  display: inline-flex; align-items: center;
  padding: 2px 8px; border-radius: 100px;
  font-size: 11px; font-weight: 600; flex-shrink: 0;
}
.error-Conceptual { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.error-Procedural { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.error-Lexical { background: #fdf4ff; color: #7e22ce; border: 1px solid #e9d5ff; }
.error-unknown { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }

.class-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: #94a3b8; min-width: 80px; flex-shrink: 0;
  margin-top: 3px;
}
.class-value {
  font-size: 13px; color: #374151; line-height: 1.5;
}
.unclassified-warning {
  color: #b45309; font-size: 13px; font-weight: 600;
  display: flex; align-items: center; gap: 6px;
}

/* Skill sidebar progress bar fill colors */
.fill-high { background: #34d399; }   /* >= 80% */
.fill-mid  { background: #f59e0b; }   /* >= 40% */
.fill-low  { background: #f87171; }   /* < 40% */

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }

/* Responsive min-width guard */
@media (max-width: 900px) {
  .sidebar { width: 220px; min-width: 220px; }
}
</style>
</head>
<body>
<div class="app">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1>Question Bank</h1>
      <div class="subtitle">Review Dashboard — 45 Skills</div>
    </div>
    <div class="sidebar-search">
      <input type="text" id="skillSearch" placeholder="Search skills..." autocomplete="off">
    </div>
    <div class="skill-list" id="skillList">
      <!-- Populated by JS -->
    </div>
  </aside>

  <!-- Main -->
  <main class="main">
    <div class="top-bar" id="topBar">
      <div class="top-bar-left">
        <div class="top-bar-skill-id" id="topSkillId">—</div>
        <div class="top-bar-skill-name" id="topSkillName">Select a skill to begin</div>
        <div class="top-bar-meta">
          <span id="topCoverage"></span>
          <div class="progress-bar-wrap" id="topProgressWrap" style="display:none">
            <div class="progress-bar-fill" id="topProgressFill"></div>
          </div>
        </div>
      </div>
      <div class="nav-controls">
        <button class="nav-btn" id="btnPrev" disabled>&#8592; Prev</button>
        <div class="nav-counter" id="navCounter">—</div>
        <button class="nav-btn" id="btnNext" disabled>Next &#8594;</button>
      </div>
    </div>
    <div class="content-area" id="contentArea">
      <div class="empty-state">
        <div class="icon">&#128196;</div>
        <h2>Choose a skill from the sidebar</h2>
        <p>Click any skill on the left to browse its questions.</p>
      </div>
    </div>
  </main>
</div>

<script>
// ── Embedded Data ─────────────────────────────────────────────────────────────
const DATA = ${dataJson};

// ── State ─────────────────────────────────────────────────────────────────────
let activeSkillId = null;
let activeQuestions = [];
let activeIndex = 0;

// ── Sidebar rendering ─────────────────────────────────────────────────────────
function buildSidebar() {
  const list = document.getElementById('skillList');
  list.innerHTML = '';

  // Group by domain
  const byDomain = {};
  for (const skill of DATA.skills) {
    if (!byDomain[skill.domain]) byDomain[skill.domain] = [];
    byDomain[skill.domain].push(skill);
  }

  for (const domainId of [1, 2, 3, 4]) {
    const skills = byDomain[domainId];
    if (!skills || skills.length === 0) continue;

    const group = document.createElement('div');
    group.className = 'domain-group';
    group.dataset.domain = domainId;

    const label = document.createElement('div');
    label.className = 'domain-label';
    label.textContent = 'Domain ' + domainId + ' — ' + (DATA.domainNames[domainId] || '');
    group.appendChild(label);

    for (const skill of skills) {
      const item = document.createElement('div');
      item.className = 'skill-item';
      item.dataset.skillId = skill.skillId;

      const pct = skill.coveragePct;
      const fillClass = pct >= 80 ? 'fill-high' : pct >= 40 ? 'fill-mid' : 'fill-low';

      item.innerHTML =
        '<div class="skill-item-top">' +
          '<span class="skill-id">' + escHtml(skill.skillId) + '</span>' +
          '<span class="skill-short">' + escHtml(skill.skillShort) + '</span>' +
          '<span class="skill-q-count">' + skill.questionCount + 'q</span>' +
        '</div>' +
        '<div class="skill-progress-bar">' +
          '<div class="skill-progress-fill ' + fillClass + '" style="width:' + pct + '%"></div>' +
        '</div>';

      item.addEventListener('click', () => selectSkill(skill.skillId));
      group.appendChild(item);
    }

    list.appendChild(group);
  }
}

// ── Skill search filter ───────────────────────────────────────────────────────
document.getElementById('skillSearch').addEventListener('input', function() {
  const q = this.value.toLowerCase().trim();
  document.querySelectorAll('.skill-item').forEach(el => {
    const skillId = el.dataset.skillId || '';
    const skillMeta = DATA.skills.find(s => s.skillId === skillId);
    const text = (skillId + ' ' + (skillMeta?.skillShort || '') + ' ' + (skillMeta?.skillFull || '')).toLowerCase();
    el.classList.toggle('hidden', q.length > 0 && !text.includes(q));
  });
  // Hide domain labels if all children hidden
  document.querySelectorAll('.domain-group').forEach(group => {
    const items = group.querySelectorAll('.skill-item');
    const anyVisible = [...items].some(i => !i.classList.contains('hidden'));
    group.style.display = anyVisible ? '' : 'none';
  });
});

// ── Select a skill ────────────────────────────────────────────────────────────
function selectSkill(skillId) {
  activeSkillId = skillId;
  activeQuestions = DATA.questionsBySkill[skillId] || [];
  activeIndex = 0;

  // Sidebar highlight
  document.querySelectorAll('.skill-item').forEach(el => {
    el.classList.toggle('active', el.dataset.skillId === skillId);
  });

  // Update top bar
  const skillMeta = DATA.skills.find(s => s.skillId === skillId);
  document.getElementById('topSkillId').textContent = skillId;
  document.getElementById('topSkillName').textContent = skillMeta?.skillFull || skillId;

  if (skillMeta) {
    const pct = skillMeta.coveragePct;
    document.getElementById('topCoverage').textContent =
      skillMeta.classifiedSlots + ' / ' + skillMeta.totalWrongSlots + ' distractors classified (' + pct + '%)';
    document.getElementById('topProgressWrap').style.display = 'block';
    document.getElementById('topProgressFill').style.width = pct + '%';
  }

  // Scroll sidebar item into view
  const activeItem = document.querySelector('.skill-item.active');
  if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

  renderQuestion();
}

// ── Render current question ───────────────────────────────────────────────────
function renderQuestion() {
  const area = document.getElementById('contentArea');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const counter = document.getElementById('navCounter');

  if (!activeSkillId || activeQuestions.length === 0) {
    area.innerHTML = '<div class="empty-state"><div class="icon">&#128196;</div><h2>No questions for this skill</h2></div>';
    counter.textContent = '0 / 0';
    btnPrev.disabled = true;
    btnNext.disabled = true;
    return;
  }

  const q = activeQuestions[activeIndex];
  const total = activeQuestions.length;
  counter.textContent = (activeIndex + 1) + ' / ' + total;
  btnPrev.disabled = activeIndex === 0;
  btnNext.disabled = activeIndex === total - 1;

  // Quality badge
  const letters = Object.keys(q.options);
  const wrongLetters = letters.filter(l => !q.correctLetters.includes(l));
  let classifiedCount = 0;
  for (const l of wrongLetters) {
    if (q.distractors[l] && q.distractors[l].tier) classifiedCount++;
  }
  let qualityClass, qualityChar;
  if (wrongLetters.length === 0 || classifiedCount === wrongLetters.length) {
    qualityClass = 'quality-green'; qualityChar = '&#10003;';
  } else if (classifiedCount === 0) {
    qualityClass = 'quality-red'; qualityChar = '&#9679;';
  } else {
    qualityClass = 'quality-yellow'; qualityChar = '&#9679;';
  }

  // Complexity badge
  const comp = q.cognitiveComplexity || '';
  let compClass = 'badge-complexity-default';
  if (comp.toLowerCase().includes('application')) compClass = 'badge-complexity-application';
  else if (comp.toLowerCase().includes('analysis')) compClass = 'badge-complexity-analysis';
  else if (comp.toLowerCase().includes('recall') || comp.toLowerCase().includes('knowledge')) compClass = 'badge-complexity-recall';

  // Vignette block
  let vignetteHtml = '';
  if (q.hasCaseVignette && q.caseText && q.caseText.trim()) {
    vignetteHtml =
      '<div class="vignette-block">' +
        '<div class="vignette-label">Case Vignette</div>' +
        '<div class="vignette-text">' + escHtml(q.caseText.trim()) + '</div>' +
      '</div>';
  }

  // Answer choices
  let choicesHtml = '<div class="choices">';
  const optionLetters = Object.keys(q.options).sort();
  for (const letter of optionLetters) {
    const text = q.options[letter];
    const isCorrect = q.correctLetters.includes(letter);
    const distractor = isCorrect ? null : q.distractors[letter];

    if (isCorrect) {
      choicesHtml +=
        '<div class="choice-group">' +
        '<div class="choice-pill choice-correct">' +
          '<div class="choice-letter">' + escHtml(letter) + '</div>' +
          '<div class="choice-text">' + escHtml(text) + '</div>' +
          '<div class="choice-marker">&#10003; Correct</div>' +
        '</div>' +
        '</div>';
    } else {
      const classified = distractor && distractor.tier;
      const pillClass = classified ? 'choice-wrong' : 'choice-wrong-no-class';
      const marker = '&#10007; Wrong';

      choicesHtml +=
        '<div class="choice-group">' +
        '<div class="choice-pill ' + pillClass + '">' +
          '<div class="choice-letter">' + escHtml(letter) + '</div>' +
          '<div class="choice-text">' + escHtml(text) + '</div>' +
          '<div class="choice-marker">' + marker + '</div>' +
        '</div>';

      // Classification block
      if (classified) {
        const tier = distractor.tier || '';
        const tierClass = 'tier-' + tier.replace(/[^A-Za-z0-9]/g, '') || 'tier-unknown';
        const et = (distractor.errorType || '').trim();
        const etClass = 'error-' + (et || 'unknown');
        const misconception = (distractor.misconception || '').trim();
        const skillDef = (distractor.skillDeficit || '').trim();

        choicesHtml +=
          '<div class="classification-block">' +
            '<div class="classification-row">' +
              '<span class="tier-badge ' + tierClass + '">' + escHtml(tier) + '</span>' +
              (et ? '<span class="error-type-badge ' + etClass + '">' + escHtml(et) + '</span>' : '') +
            '</div>' +
            (misconception ?
              '<div class="classification-row">' +
                '<span class="class-label">Misconception</span>' +
                '<span class="class-value">' + escHtml(misconception) + '</span>' +
              '</div>' : '') +
            (skillDef ?
              '<div class="classification-row">' +
                '<span class="class-label">Skill Deficit</span>' +
                '<span class="class-value">' + escHtml(skillDef) + '</span>' +
              '</div>' : '') +
          '</div>';
      } else {
        choicesHtml +=
          '<div class="classification-block classification-unclassified">' +
            '<div class="unclassified-warning">&#9888; Not yet classified</div>' +
          '</div>';
      }

      choicesHtml += '</div>'; // .choice-group
    }
  }
  choicesHtml += '</div>';

  // Assemble card
  area.innerHTML =
    '<div class="question-card">' +
      '<div class="card-header">' +
        '<div class="card-header-left">' +
          '<span class="badge badge-id">' + escHtml(q.id) + '</span>' +
          (comp ? '<span class="badge ' + compClass + '">' + escHtml(comp) + '</span>' : '') +
          (q.isMultiSelect ? '<span class="badge badge-multi">Multi-Select</span>' : '') +
          (q.hasCaseVignette ? '<span class="badge" style="background:#f0fdf4;color:#166534;border:1px solid #bbf7d0">Vignette</span>' : '') +
        '</div>' +
        '<div class="quality-badge ' + qualityClass + '">' + qualityChar + '</div>' +
      '</div>' +
      '<div class="card-body">' +
        vignetteHtml +
        '<div class="stem-text">' + escHtml(q.stem) + '</div>' +
        choicesHtml +
      '</div>' +
    '</div>';

  // Scroll to top
  area.scrollTop = 0;
}

// ── Navigation ────────────────────────────────────────────────────────────────
document.getElementById('btnPrev').addEventListener('click', () => {
  if (activeIndex > 0) { activeIndex--; renderQuestion(); }
});
document.getElementById('btnNext').addEventListener('click', () => {
  if (activeIndex < activeQuestions.length - 1) { activeIndex++; renderQuestion(); }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    if (activeIndex < activeQuestions.length - 1) { activeIndex++; renderQuestion(); }
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    if (activeIndex > 0) { activeIndex--; renderQuestion(); }
  }
});

// ── Utilities ─────────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Init ──────────────────────────────────────────────────────────────────────
buildSidebar();

// Select first skill automatically
if (DATA.skills.length > 0) {
  selectSkill(DATA.skills[0].skillId);
}
</script>
</body>
</html>`;

// ── 7. Write output ───────────────────────────────────────────────────────────
const outDir = path.join(ROOT, 'content-authoring');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, 'dashboard.html');
fs.writeFileSync(outFile, html, 'utf8');

const fileSizeKB = Math.round(fs.statSync(outFile).size / 1024);
console.log('');
console.log('Dashboard written to:', outFile);
console.log('File size:', fileSizeKB + ' KB');
console.log('Total questions embedded:', questions.length);
console.log('Skills:', sortedSkillIds.length);
console.log('Phase A CSV rows loaded:', Object.keys(csvData).length, 'question-id sets');
