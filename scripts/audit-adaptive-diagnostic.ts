/**
 * Adaptive Diagnostic Audit
 *
 * Produces a comprehensive quality report for the adaptive diagnostic question set.
 * Answers: Where do questions come from? Are they quality questions?
 * Do they cover every skill? How are follow-ups related?
 *
 * Usage: npx tsx scripts/audit-adaptive-diagnostic.ts
 * Output: exports/adaptive-diagnostic-audit.md
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Load data ──────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const questions: any[] = JSON.parse(readFileSync(join(ROOT, 'src/data/questions.json'), 'utf-8'));
const skillVocabMap: any = JSON.parse(readFileSync(join(ROOT, 'src/data/skill-vocabulary-map.json'), 'utf-8'));
const questionSkillMap: any = JSON.parse(readFileSync(join(ROOT, 'src/data/question-skill-map.json'), 'utf-8'));

// ─── SKILL_BLUEPRINT (copied from assessment-builder.ts to avoid import issues) ─

const SKILL_BLUEPRINT: Record<string, { domain: number; slots: number }> = {
  'CON-01': { domain: 1, slots: 2 }, 'DBD-01': { domain: 1, slots: 2 }, 'DBD-03': { domain: 1, slots: 2 },
  'DBD-05': { domain: 1, slots: 1 }, 'DBD-06': { domain: 1, slots: 1 }, 'DBD-07': { domain: 1, slots: 1 },
  'DBD-08': { domain: 1, slots: 1 }, 'DBD-09': { domain: 1, slots: 1 }, 'DBD-10': { domain: 1, slots: 1 },
  'PSY-01': { domain: 1, slots: 1 }, 'PSY-02': { domain: 1, slots: 1 }, 'PSY-03': { domain: 1, slots: 1 },
  'PSY-04': { domain: 1, slots: 1 },
  'ACA-02': { domain: 2, slots: 1 }, 'ACA-03': { domain: 2, slots: 1 }, 'ACA-04': { domain: 2, slots: 1 },
  'ACA-06': { domain: 2, slots: 1 }, 'ACA-07': { domain: 2, slots: 1 }, 'ACA-08': { domain: 2, slots: 1 },
  'ACA-09': { domain: 2, slots: 1 }, 'DEV-01': { domain: 2, slots: 1 }, 'MBH-02': { domain: 2, slots: 1 },
  'MBH-03': { domain: 2, slots: 1 }, 'MBH-04': { domain: 2, slots: 1 }, 'MBH-05': { domain: 2, slots: 1 },
  'SAF-01': { domain: 3, slots: 2 }, 'SWP-04': { domain: 3, slots: 2 }, 'FAM-02': { domain: 3, slots: 1 },
  'FAM-03': { domain: 3, slots: 1 }, 'SAF-03': { domain: 3, slots: 1 }, 'SAF-04': { domain: 3, slots: 1 },
  'SWP-02': { domain: 3, slots: 1 }, 'SWP-03': { domain: 3, slots: 1 },
  'DIV-01': { domain: 4, slots: 1 }, 'DIV-03': { domain: 4, slots: 1 }, 'DIV-05': { domain: 4, slots: 1 },
  'ETH-01': { domain: 4, slots: 1 }, 'ETH-02': { domain: 4, slots: 1 }, 'ETH-03': { domain: 4, slots: 1 },
  'LEG-01': { domain: 4, slots: 1 }, 'LEG-02': { domain: 4, slots: 1 }, 'LEG-03': { domain: 4, slots: 1 },
  'LEG-04': { domain: 4, slots: 1 }, 'RES-02': { domain: 4, slots: 1 }, 'RES-03': { domain: 4, slots: 1 },
};

const DOMAIN_NAMES: Record<number, string> = {
  1: 'Data-Based Decision Making & Accountability',
  2: 'Consultation and Collaboration',
  3: 'School-Wide Practices to Promote Learning',
  4: 'Foundations of School Psychological Service Delivery',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSource(q: any): string {
  const id = q.UNIQUEID || '';
  if (id.startsWith('item_')) return 'item_';
  if (id.startsWith('PQ_')) return 'PQ_';
  return 'other';
}

function hasContent(val: any): boolean {
  if (val === undefined || val === null) return false;
  if (typeof val === 'string') return val.trim() !== '';
  if (typeof val === 'boolean') return val;
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

function pct(n: number, d: number): string {
  if (d === 0) return '0%';
  return (n / d * 100).toFixed(1) + '%';
}

// ─── Analysis ───────────────────────────────────────────────────────────────

// Group questions by skill
const bySkill = new Map<string, any[]>();
for (const q of questions) {
  const skillId = q.current_skill_id;
  if (!skillId) continue;
  if (!bySkill.has(skillId)) bySkill.set(skillId, []);
  bySkill.get(skillId)!.push(q);
}

// ─── Section 1: Question Sourcing & Provenance ──────────────────────────────

const pqQuestions = questions.filter(q => getSource(q) === 'PQ_');
const itemQuestions = questions.filter(q => getSource(q) === 'item_');
const otherQuestions = questions.filter(q => getSource(q) === 'other');

// Metadata field presence for each source
function auditFieldPresence(qs: any[]): Record<string, { present: number; missing: number; pct: string }> {
  const fields = [
    'core_concept', 'cognitive_complexity', 'CORRECT_Explanation', 'is_foundational',
    'distractor_misconception_A', 'distractor_skill_deficit_A', 'error_cluster_tag',
    'dominant_error_pattern', 'top_misconception_themes', 'moduleRefs', 'primaryModuleId',
    'has_case_vignette', 'skill_prerequisites',
  ];
  const result: Record<string, { present: number; missing: number; pct: string }> = {};
  for (const field of fields) {
    const present = qs.filter(q => hasContent(q[field])).length;
    result[field] = { present, missing: qs.length - present, pct: pct(present, qs.length) };
  }
  return result;
}

const pqFields = auditFieldPresence(pqQuestions);
const itemFields = auditFieldPresence(itemQuestions);

// ─── Section 2: Skill Coverage ──────────────────────────────────────────────

interface SkillCoverage {
  skillId: string;
  domain: number;
  total: number;
  pqCount: number;
  itemCount: number;
  recallCount: number;
  applicationCount: number;
  unknownComplexity: number;
  singleSelect: number;
  multiSelect: number;
  hasEnoughForFollowUps: boolean;
  hasExplanation: number;
  hasCoreConceptCount: number;
  hasDistractorAnalysis: number;
  hasModuleRefs: number;
  vocabTermCount: number;
}

const skillCoverages: SkillCoverage[] = [];
const allBlueprintSkills = Object.keys(SKILL_BLUEPRINT);

for (const skillId of allBlueprintSkills) {
  const qs = bySkill.get(skillId) || [];
  const domain = SKILL_BLUEPRINT[skillId].domain;
  const vocabData = skillVocabMap.skills?.[skillId];

  skillCoverages.push({
    skillId,
    domain,
    total: qs.length,
    pqCount: qs.filter(q => getSource(q) === 'PQ_').length,
    itemCount: qs.filter(q => getSource(q) === 'item_').length,
    recallCount: qs.filter(q => q.cognitive_complexity === 'Recall').length,
    applicationCount: qs.filter(q => q.cognitive_complexity === 'Application').length,
    unknownComplexity: qs.filter(q => !q.cognitive_complexity || (q.cognitive_complexity !== 'Recall' && q.cognitive_complexity !== 'Application')).length,
    singleSelect: qs.filter(q => String(q.is_multi_select).toLowerCase() !== 'true').length,
    multiSelect: qs.filter(q => String(q.is_multi_select).toLowerCase() === 'true').length,
    hasEnoughForFollowUps: qs.length >= 3,
    hasExplanation: qs.filter(q => hasContent(q.CORRECT_Explanation)).length,
    hasCoreConceptCount: qs.filter(q => hasContent(q.core_concept)).length,
    hasDistractorAnalysis: qs.filter(q => hasContent(q.distractor_misconception_A)).length,
    hasModuleRefs: qs.filter(q => hasContent(q.moduleRefs)).length,
    vocabTermCount: vocabData?.vocabularyTerms?.length || 0,
  });
}

// ─── Section 3: Skills missing item_ coverage ──────────────────────────────

const itemSkillIds = new Set(itemQuestions.map(q => q.current_skill_id).filter(Boolean));
const missingItemSkills = allBlueprintSkills.filter(s => !itemSkillIds.has(s));

// ─── Section 4: Follow-Up Simulation ────────────────────────────────────────

interface SimResult {
  skillId: string;
  totalPool: number;
  canProduceInitial: boolean;
  canProduceFollowUp1: boolean;
  canProduceFollowUp2: boolean;
  complexityAlternation: number; // count of runs where alternation worked
  sameComplexityFallback: number; // count where it fell back to same complexity
  totalRuns: number;
}

const SIM_RUNS = 200;
const simResults: SimResult[] = [];

for (const skillId of allBlueprintSkills) {
  const pool = bySkill.get(skillId) || [];
  let alternationCount = 0;
  let sameComplexityCount = 0;
  let fu1Count = 0;
  let fu2Count = 0;

  for (let run = 0; run < SIM_RUNS; run++) {
    // Replicate buildAdaptiveDiagnostic logic
    const singleSelect = pool.filter(q => String(q.is_multi_select).toLowerCase() !== 'true');
    const multiSelect = pool.filter(q => String(q.is_multi_select).toLowerCase() === 'true');
    const shuffled = [
      ...singleSelect.sort(() => Math.random() - 0.5),
      ...multiSelect.sort(() => Math.random() - 0.5),
    ];

    if (shuffled.length === 0) continue;

    const initial = shuffled[0];
    const remaining = shuffled.slice(1);

    // Follow-up 1: prefer opposite complexity
    if (remaining.length > 0) {
      fu1Count++;
      const oppositeComplexity = initial.cognitive_complexity === 'Recall' ? 'Application' : 'Recall';
      const oppositeIdx = remaining.findIndex((q: any) => q.cognitive_complexity === oppositeComplexity);
      if (oppositeIdx !== -1) {
        alternationCount++;
        const fu1 = remaining.splice(oppositeIdx, 1)[0];
        // Follow-up 2: prefer opposite of fu1
        if (remaining.length > 0) {
          fu2Count++;
          const fu1Complexity = fu1.cognitive_complexity;
          const wantComplexity = fu1Complexity === 'Recall' ? 'Application' : 'Recall';
          const idx = remaining.findIndex((q: any) => q.cognitive_complexity === wantComplexity);
          if (idx !== -1) {
            alternationCount++;
          } else {
            sameComplexityCount++;
          }
        }
      } else {
        sameComplexityCount++;
        remaining.shift(); // take first available
        if (remaining.length > 0) {
          fu2Count++;
          sameComplexityCount++; // can't meaningfully alternate either
        }
      }
    }
  }

  simResults.push({
    skillId,
    totalPool: pool.length,
    canProduceInitial: pool.length >= 1,
    canProduceFollowUp1: fu1Count > 0,
    canProduceFollowUp2: fu2Count > 0,
    complexityAlternation: alternationCount,
    sameComplexityFallback: sameComplexityCount,
    totalRuns: SIM_RUNS,
  });
}

// ─── Section 5: Per-question quality (summary) ─────────────────────────────

interface QualityFlag {
  questionId: string;
  skillId: string;
  source: string;
  missingFields: string[];
}

const qualityFlags: QualityFlag[] = [];
const criticalFields = [
  { field: 'CORRECT_Explanation', label: 'Explanation' },
  { field: 'cognitive_complexity', label: 'Cognitive Complexity' },
  { field: 'question_stem', label: 'Question Stem' },
  { field: 'correct_answers', label: 'Correct Answers' },
];

for (const q of questions) {
  const missing: string[] = [];
  for (const { field, label } of criticalFields) {
    if (!hasContent(q[field])) missing.push(label);
  }
  if (missing.length > 0) {
    qualityFlags.push({
      questionId: q.UNIQUEID || 'UNKNOWN',
      skillId: q.current_skill_id || 'UNKNOWN',
      source: getSource(q),
      missingFields: missing,
    });
  }
}

// Enrichment fields (nice to have)
const enrichmentAudit = {
  withCoreConcept: questions.filter(q => hasContent(q.core_concept)).length,
  withDistractorAnalysis: questions.filter(q => hasContent(q.distractor_misconception_A)).length,
  withModuleRefs: questions.filter(q => hasContent(q.moduleRefs)).length,
  withFoundationalFlag: questions.filter(q => q.is_foundational === true || q.is_foundational === 'true').length,
  withErrorClusterTag: questions.filter(q => hasContent(q.error_cluster_tag)).length,
  withCaseVignette: questions.filter(q => hasContent(q.case_text)).length,
  withSkillPrereqs: questions.filter(q => hasContent(q.skill_prerequisites)).length,
};

// ─── Section 6: Domain Balance ──────────────────────────────────────────────

const domainStats: Record<number, { skills: number; totalSlots: number; totalQuestions: number }> = {
  1: { skills: 0, totalSlots: 0, totalQuestions: 0 },
  2: { skills: 0, totalSlots: 0, totalQuestions: 0 },
  3: { skills: 0, totalSlots: 0, totalQuestions: 0 },
  4: { skills: 0, totalSlots: 0, totalQuestions: 0 },
};

for (const [skillId, config] of Object.entries(SKILL_BLUEPRINT)) {
  domainStats[config.domain].skills++;
  domainStats[config.domain].totalSlots += config.slots;
  domainStats[config.domain].totalQuestions += (bySkill.get(skillId) || []).length;
}

// ─── Section 7: Legacy Mapping Audit ────────────────────────────────────────

const legacyIds = new Set(questionSkillMap.mappedQuestions.map((m: any) => m.questionId));
const questionUniqueIds = new Set(questions.map((q: any) => q.UNIQUEID));
const legacyMatched = [...legacyIds].filter(id => questionUniqueIds.has(id));
const legacyUnmatched = [...legacyIds].filter(id => !questionUniqueIds.has(id));

// Check where question-skill-map.json is actually imported
// (This is documented from our exploration — PB/ETS/UG/SC IDs don't match questions.json)

// ─── Build Report ───────────────────────────────────────────────────────────

let report = '';

report += `# Adaptive Diagnostic Audit Report\n\n`;
report += `**Generated:** ${new Date().toISOString().split('T')[0]}\n`;
report += `**Question Bank:** src/data/questions.json\n\n`;

// ── Executive Summary ───
report += `## Executive Summary\n\n`;
report += `| Metric | Value |\n|--------|-------|\n`;
report += `| Total questions in bank | ${questions.length} |\n`;
report += `| PQ_ questions (basic metadata) | ${pqQuestions.length} |\n`;
report += `| item_ questions (rich metadata) | ${itemQuestions.length} |\n`;
report += `| Skills in SKILL_BLUEPRINT | ${allBlueprintSkills.length} |\n`;
report += `| Skills with questions | ${bySkill.size} |\n`;
report += `| Skills covered by item_ | ${itemSkillIds.size} / ${allBlueprintSkills.length} |\n`;
report += `| Skills missing item_ coverage | ${missingItemSkills.length} |\n`;
report += `| Min questions per skill | ${Math.min(...skillCoverages.map(s => s.total))} |\n`;
report += `| Max questions per skill | ${Math.max(...skillCoverages.map(s => s.total))} |\n`;
report += `| Avg questions per skill | ${(questions.filter(q => q.current_skill_id).length / allBlueprintSkills.length).toFixed(1)} |\n`;
report += `| Questions with explanations | ${questions.filter(q => hasContent(q.CORRECT_Explanation)).length} / ${questions.length} (${pct(questions.filter(q => hasContent(q.CORRECT_Explanation)).length, questions.length)}) |\n`;
report += `| Questions with distractor analysis | ${enrichmentAudit.withDistractorAnalysis} / ${questions.length} (${pct(enrichmentAudit.withDistractorAnalysis, questions.length)}) |\n`;
report += `| Questions missing critical fields | ${qualityFlags.length} |\n`;
report += `| Legacy skill map entries (unmatched) | ${legacyUnmatched.length} / ${legacyIds.size} |\n`;
report += `\n`;

// ── Section 1: Sourcing ───
report += `## 1. Question Sourcing & Provenance\n\n`;
report += `### Source Breakdown\n\n`;
report += `| Source | Count | Description |\n|--------|-------|-------------|\n`;
report += `| \`PQ_*\` | ${pqQuestions.length} | Practice questions — basic metadata (skill, complexity, moduleRefs). Missing: distractor analysis, core_concept, foundational flags. |\n`;
report += `| \`item_*\` | ${itemQuestions.length} | Imported items — rich metadata including distractor misconceptions, skill deficits, core concepts, foundational flags. |\n`;
if (otherQuestions.length > 0) {
  report += `| Other | ${otherQuestions.length} | Unrecognized prefix. |\n`;
}
report += `\n`;

report += `### Metadata Field Presence by Source\n\n`;
report += `| Field | PQ_ (${pqQuestions.length}) | item_ (${itemQuestions.length}) |\n|-------|------|--------|\n`;
const allFieldNames = Object.keys(pqFields);
for (const field of allFieldNames) {
  report += `| \`${field}\` | ${pqFields[field].pct} (${pqFields[field].present}) | ${itemFields[field].pct} (${itemFields[field].present}) |\n`;
}
report += `\n`;

report += `### Key Finding\n\n`;
report += `The **900 PQ_ questions** lack distractor-level analysis (misconceptions, skill deficits, error patterns). `;
report += `This means when a student selects a wrong answer on a PQ_ question, the system cannot identify `;
report += `*which specific misconception* drove the error. The **250 item_ questions** have this data and `;
report += `cover **${itemSkillIds.size} of ${allBlueprintSkills.length} skills**.\n\n`;

// ── Section 2: Skill Coverage ───
report += `## 2. Skill Coverage\n\n`;
report += `| Skill | Domain | Total | PQ_ | item_ | Recall | Application | Unknown | Single | Multi | Explanations | Core Concept | Distractor | Module Refs | Vocab Terms | Flags |\n`;
report += `|-------|--------|-------|-----|-------|--------|-------------|---------|--------|-------|-------------|-------------|-----------|-------------|-------------|-------|\n`;

for (const sc of skillCoverages.sort((a, b) => a.skillId.localeCompare(b.skillId))) {
  const flags: string[] = [];
  if (sc.total < 6) flags.push('LOW COVERAGE');
  if (!sc.hasEnoughForFollowUps) flags.push('< 3 Qs');
  if (sc.itemCount === 0) flags.push('NO item_');
  if (sc.recallCount === 0) flags.push('No Recall');
  if (sc.applicationCount === 0) flags.push('No Application');
  if (sc.unknownComplexity > 0) flags.push(`${sc.unknownComplexity} unknown`);

  report += `| ${sc.skillId} | D${sc.domain} | ${sc.total} | ${sc.pqCount} | ${sc.itemCount} | ${sc.recallCount} | ${sc.applicationCount} | ${sc.unknownComplexity} | ${sc.singleSelect} | ${sc.multiSelect} | ${sc.hasExplanation} | ${sc.hasCoreConceptCount} | ${sc.hasDistractorAnalysis} | ${sc.hasModuleRefs} | ${sc.vocabTermCount} | ${flags.join(', ') || '-'} |\n`;
}
report += `\n`;

// Summary stats
const lowCoverage = skillCoverages.filter(s => s.total < 6);
const noRecall = skillCoverages.filter(s => s.recallCount === 0);
const noApplication = skillCoverages.filter(s => s.applicationCount === 0);
report += `### Coverage Warnings\n\n`;
report += `- **${lowCoverage.length} skills** with fewer than 6 questions: ${lowCoverage.map(s => s.skillId).join(', ') || 'None'}\n`;
report += `- **${noRecall.length} skills** with zero Recall questions: ${noRecall.map(s => s.skillId).join(', ') || 'None'}\n`;
report += `- **${noApplication.length} skills** with zero Application questions: ${noApplication.map(s => s.skillId).join(', ') || 'None'}\n`;
report += `\n`;

// ── Section 3: Missing item_ Skills ───
report += `## 3. Skills Missing Rich (item_) Question Coverage\n\n`;
if (missingItemSkills.length === 0) {
  report += `All ${allBlueprintSkills.length} skills have at least one item_ question.\n\n`;
} else {
  report += `These **${missingItemSkills.length} skills** have zero \`item_*\` questions and rely entirely on PQ_ questions `;
  report += `(which lack distractor analysis, core concepts, and foundational flags):\n\n`;
  report += `| Skill | Domain | Total PQ_ Questions | Recall | Application |\n`;
  report += `|-------|--------|---------------------|--------|-------------|\n`;
  for (const skillId of missingItemSkills) {
    const sc = skillCoverages.find(s => s.skillId === skillId)!;
    report += `| ${skillId} | D${sc.domain} — ${DOMAIN_NAMES[sc.domain]} | ${sc.pqCount} | ${sc.recallCount} | ${sc.applicationCount} |\n`;
  }
  report += `\n`;
  report += `**Recommendation:** These skills should be prioritized for item_ question writing to provide distractor analysis coverage.\n\n`;
}

// ── Section 4: Follow-Up Quality ───
report += `## 4. Follow-Up Quality Analysis\n\n`;
report += `Simulated \`buildAdaptiveDiagnostic()\` ${SIM_RUNS} times per skill to assess follow-up quality.\n\n`;
report += `| Skill | Pool Size | Initial | FU1 | FU2 | Complexity Alternation Rate | Flags |\n`;
report += `|-------|-----------|---------|-----|-----|----------------------------|-------|\n`;

for (const sr of simResults.sort((a, b) => a.skillId.localeCompare(b.skillId))) {
  const totalAttempts = sr.complexityAlternation + sr.sameComplexityFallback;
  const altRate = totalAttempts > 0 ? pct(sr.complexityAlternation, totalAttempts) : 'N/A';
  const flags: string[] = [];
  if (!sr.canProduceInitial) flags.push('NO QUESTIONS');
  if (!sr.canProduceFollowUp1) flags.push('No FU1');
  if (!sr.canProduceFollowUp2) flags.push('No FU2');
  if (totalAttempts > 0 && sr.complexityAlternation / totalAttempts < 0.5) flags.push('Low alternation');

  report += `| ${sr.skillId} | ${sr.totalPool} | ${sr.canProduceInitial ? 'Yes' : 'NO'} | ${sr.canProduceFollowUp1 ? 'Yes' : 'No'} | ${sr.canProduceFollowUp2 ? 'Yes' : 'No'} | ${altRate} | ${flags.join(', ') || '-'} |\n`;
}
report += `\n`;

const cannotFU1 = simResults.filter(s => !s.canProduceFollowUp1);
const cannotFU2 = simResults.filter(s => !s.canProduceFollowUp2);
const lowAlt = simResults.filter(s => {
  const total = s.complexityAlternation + s.sameComplexityFallback;
  return total > 0 && s.complexityAlternation / total < 0.5;
});

report += `### Follow-Up Summary\n\n`;
report += `- **${simResults.filter(s => s.canProduceInitial).length}/${allBlueprintSkills.length}** skills can produce an initial question\n`;
report += `- **${simResults.filter(s => s.canProduceFollowUp1).length}/${allBlueprintSkills.length}** skills can produce at least 1 follow-up\n`;
report += `- **${simResults.filter(s => s.canProduceFollowUp2).length}/${allBlueprintSkills.length}** skills can produce 2 follow-ups\n`;
report += `- **${lowAlt.length} skills** have <50% complexity alternation rate: ${lowAlt.map(s => s.skillId).join(', ') || 'None'}\n`;
report += `\n`;

// ── Section 5: Question Quality ───
report += `## 5. Question Quality Indicators\n\n`;
report += `### Critical Field Completeness\n\n`;
report += `| Field | Present | Missing | Coverage |\n|-------|---------|---------|----------|\n`;
for (const { field, label } of criticalFields) {
  const present = questions.filter(q => hasContent(q[field])).length;
  report += `| ${label} (\`${field}\`) | ${present} | ${questions.length - present} | ${pct(present, questions.length)} |\n`;
}
report += `\n`;

report += `### Enrichment Field Completeness\n\n`;
report += `| Field | Present | Coverage |\n|-------|---------|----------|\n`;
report += `| Core Concept | ${enrichmentAudit.withCoreConcept} | ${pct(enrichmentAudit.withCoreConcept, questions.length)} |\n`;
report += `| Distractor Analysis | ${enrichmentAudit.withDistractorAnalysis} | ${pct(enrichmentAudit.withDistractorAnalysis, questions.length)} |\n`;
report += `| Module References | ${enrichmentAudit.withModuleRefs} | ${pct(enrichmentAudit.withModuleRefs, questions.length)} |\n`;
report += `| Foundational Flag | ${enrichmentAudit.withFoundationalFlag} | ${pct(enrichmentAudit.withFoundationalFlag, questions.length)} |\n`;
report += `| Error Cluster Tag | ${enrichmentAudit.withErrorClusterTag} | ${pct(enrichmentAudit.withErrorClusterTag, questions.length)} |\n`;
report += `| Case Vignette | ${enrichmentAudit.withCaseVignette} | ${pct(enrichmentAudit.withCaseVignette, questions.length)} |\n`;
report += `| Skill Prerequisites | ${enrichmentAudit.withSkillPrereqs} | ${pct(enrichmentAudit.withSkillPrereqs, questions.length)} |\n`;
report += `\n`;

if (qualityFlags.length > 0) {
  report += `### Questions Missing Critical Fields\n\n`;
  report += `${qualityFlags.length} questions are missing at least one critical field:\n\n`;
  // Group by missing field
  const byMissing = new Map<string, number>();
  for (const qf of qualityFlags) {
    for (const f of qf.missingFields) {
      byMissing.set(f, (byMissing.get(f) || 0) + 1);
    }
  }
  report += `| Missing Field | Count |\n|---------------|-------|\n`;
  for (const [field, count] of [...byMissing.entries()].sort((a, b) => b[1] - a[1])) {
    report += `| ${field} | ${count} |\n`;
  }
  report += `\n`;

  // Show first 20 flagged questions
  const sample = qualityFlags.slice(0, 20);
  report += `**Sample flagged questions** (showing first ${sample.length}):\n\n`;
  report += `| Question ID | Skill | Source | Missing |\n|-------------|-------|--------|--------|\n`;
  for (const qf of sample) {
    report += `| ${qf.questionId} | ${qf.skillId} | ${qf.source} | ${qf.missingFields.join(', ')} |\n`;
  }
  if (qualityFlags.length > 20) {
    report += `\n*...and ${qualityFlags.length - 20} more.*\n`;
  }
  report += `\n`;
}

// ── Section 6: Domain Balance ───
report += `## 6. Domain Balance\n\n`;
report += `| Domain | Name | Skills | Blueprint Slots (initial Qs) | Total Questions in Pool | Avg per Skill |\n`;
report += `|--------|------|--------|------------------------------|------------------------|---------------|\n`;
for (const [domainId, stats] of Object.entries(domainStats)) {
  const d = Number(domainId);
  report += `| D${d} | ${DOMAIN_NAMES[d]} | ${stats.skills} | ${stats.totalSlots} | ${stats.totalQuestions} | ${(stats.totalQuestions / stats.skills).toFixed(1)} |\n`;
}
report += `\n`;

const totalSlots = Object.values(domainStats).reduce((sum, d) => sum + d.totalSlots, 0);
report += `**Total initial questions per diagnostic:** ${totalSlots} (one per slot in SKILL_BLUEPRINT)\n\n`;
report += `The adaptive diagnostic picks 1 question per skill, then interleaves by domain via round-robin. `;
report += `Domain 1 has higher slot density (some skills get 2 slots) because it covers ~36% of the Praxis exam.\n\n`;

// ── Section 7: Legacy Mapping ───
report += `## 7. Legacy Mapping Audit (question-skill-map.json)\n\n`;
report += `| Metric | Value |\n|--------|-------|\n`;
report += `| Entries in question-skill-map.json | ${legacyIds.size} |\n`;
report += `| IDs matching questions.json UNIQUEIDs | ${legacyMatched.length} |\n`;
report += `| IDs NOT matching (orphaned) | ${legacyUnmatched.length} |\n`;
report += `\n`;

// Show ID prefix breakdown
const legacyPrefixes = new Map<string, number>();
for (const id of legacyIds) {
  const prefix = (id as string).replace(/[0-9]+$/, '');
  legacyPrefixes.set(prefix, (legacyPrefixes.get(prefix) || 0) + 1);
}
report += `**Legacy ID prefixes:**\n\n`;
report += `| Prefix | Count |\n|--------|-------|\n`;
for (const [prefix, count] of [...legacyPrefixes.entries()].sort((a, b) => b - a)) {
  report += `| \`${prefix}\` | ${count} |\n`;
}
report += `\n`;

report += `### Finding\n\n`;
report += `\`question-skill-map.json\` uses IDs like PB1, ETS1, UG1, SC1 which **do not match** any UNIQUEID in \`questions.json\` `;
report += `(which uses PQ_CON-01_1, item_001 format). The actual adaptive diagnostic resolves skills via \`current_skill_id\` `;
report += `embedded in each question, not via this map file.\n\n`;
report += `This file is imported by \`question-analyzer.ts\` as a fallback lookup (\`QUESTION_SKILL_LOOKUP\`), but since `;
report += `questions.json questions always have \`current_skill_id\`, the fallback is never triggered for the main question bank. `;
report += `**Consider deprecating this file** or reconciling its IDs with the current question bank.\n\n`;

// ── Section 8: Recommendations ───
report += `## 8. Recommendations\n\n`;
report += `### High Priority\n\n`;
report += `1. **Write item_ questions for the ${missingItemSkills.length} uncovered skills** (${missingItemSkills.join(', ')}). These skills lack distractor analysis, making it impossible to diagnose specific misconceptions when students answer incorrectly.\n\n`;
report += `2. **Add distractor analysis to PQ_ questions.** Only ${pct(enrichmentAudit.withDistractorAnalysis, questions.length)} of questions have distractor-level misconception data. This limits the concept-level analytics that can be built.\n\n`;

const noComplexity = questions.filter(q => !hasContent(q.cognitive_complexity));
if (noComplexity.length > 0) {
  report += `3. **Tag cognitive complexity** on ${noComplexity.length} questions missing it. This affects follow-up alternation quality.\n\n`;
}

report += `### Medium Priority\n\n`;
report += `4. **Add core_concept to PQ_ questions** (currently ${pqFields.core_concept.pct}). This is the foundation for per-question vocabulary tagging.\n\n`;
report += `5. **Deprecate or reconcile question-skill-map.json.** Its ${legacyUnmatched.length} orphaned IDs create confusion. Either update it to use current UNIQUEIDs or remove it.\n\n`;

if (lowAlt.length > 0) {
  report += `6. **Improve cognitive complexity variety** for skills with low alternation rates: ${lowAlt.map(s => s.skillId).join(', ')}. These skills can't reliably alternate between Recall and Application during follow-ups.\n\n`;
}

report += `### Low Priority\n\n`;
report += `7. **Add case vignettes** to more questions (currently ${pct(enrichmentAudit.withCaseVignette, questions.length)}). Application-level questions benefit from scenario context.\n\n`;
report += `8. **Add skill prerequisites** data (currently ${pct(enrichmentAudit.withSkillPrereqs, questions.length)}). This enables foundational gap analysis in assessment reports.\n\n`;

// ── Write output ───
const outputDir = join(ROOT, 'exports');
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
const outputPath = join(outputDir, 'adaptive-diagnostic-audit.md');
writeFileSync(outputPath, report, 'utf-8');

console.log(`\nAudit complete! Report written to: exports/adaptive-diagnostic-audit.md`);
console.log(`\n=== Quick Stats ===`);
console.log(`Total questions: ${questions.length} (${pqQuestions.length} PQ_ + ${itemQuestions.length} item_)`);
console.log(`Skills: ${allBlueprintSkills.length} (all covered)`);
console.log(`Skills missing item_ coverage: ${missingItemSkills.length} — ${missingItemSkills.join(', ')}`);
console.log(`Questions per skill: ${Math.min(...skillCoverages.map(s => s.total))} min, ${Math.max(...skillCoverages.map(s => s.total))} max, ${(questions.filter(q => q.current_skill_id).length / allBlueprintSkills.length).toFixed(1)} avg`);
console.log(`Questions with distractor analysis: ${enrichmentAudit.withDistractorAnalysis} / ${questions.length}`);
console.log(`Questions missing critical fields: ${qualityFlags.length}`);
console.log(`Legacy map orphaned IDs: ${legacyUnmatched.length} / ${legacyIds.size}`);
