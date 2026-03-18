import { readFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from '../src/config/firebase.js';
import { writeBatch, doc, collection } from 'firebase/firestore';
import type { Question, Skill, Option, DistractorInfo } from '../src/types/content.js';

async function ingestData(questionsPath: string, skillsPath: string) {
  if (!existsSync(questionsPath)) {
    console.error(`Questions file not found: ${questionsPath}`);
    return;
  }
  if (!existsSync(skillsPath)) {
    console.error(`Skills file not found: ${skillsPath}`);
    return;
  }

  console.log(`Loading questions from ${questionsPath}...`);
  const questionsCsv = readFileSync(questionsPath, 'utf8');
  const questionsData = parse(questionsCsv, { columns: true, skip_empty_lines: true }) as any[];

  console.log(`Loading skills from ${skillsPath}...`);
  const skillsCsv = readFileSync(skillsPath, 'utf8');
  const skillsData = parse(skillsCsv, { columns: true, skip_empty_lines: true }) as any[];

  console.log(`Parsed ${questionsData.length} questions and ${skillsData.length} skills.`);

  // 1. Map skill_id -> domainId from questions CSV
  const skillToDomainMap = new Map<string, string>();
  for (const row of questionsData) {
    const sId = row.current_skill_id || row.skill_id || '';
    const dId = row.DOMAIN || row.domain || '';
    if (sId && dId && !skillToDomainMap.has(sId)) {
      skillToDomainMap.set(sId, String(dId));
    }
  }

  // 2. Track valid skill IDs for validation
  const validSkillIds = new Set<string>();
  for (const row of skillsData) {
    const sId = row.skill_id || row.current_skill_id || row.ID;
    if (sId) validSkillIds.add(sId);
  }

  let batch = writeBatch(db);
  const questionsRef = collection(db, 'questions');
  const skillsRef = collection(db, 'skills');

  let operationCount = 0;

  // Process Skills
  for (const row of skillsData) {
    const sId = row.skill_id || row.current_skill_id || row.ID;
    const skill: Skill = {
      id: sId,
      name: row.skill_name || row.Name || 'Unknown Skill',
      domainId: skillToDomainMap.get(sId) || 'Unknown Domain',
      conceptLabel: row.concept_label || '',
      prerequisites: row.prerequisites ? row.prerequisites.split('|').map((p: string) => p.trim()) : [],
      prerequisiteReasoning: row.prerequisite_reasoning || ''
    };
    if (!skill.id) continue;

    batch.set(doc(skillsRef, skill.id), skill);
    operationCount++;

    if (operationCount >= 490) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }
  }

  // Process Questions
  for (const row of questionsData) {
    const isMultiSelect = row.is_multi_select === 'True' || row.is_multi_select === 'true';
    const rawOptions: string[] = ['A', 'B', 'C', 'D', 'E', 'F'];
    const options: Option[] = [];
    
    for (const letter of rawOptions) {
      if (row[letter] && String(row[letter]).trim() !== '') {
        options.push({ letter, text: String(row[letter]).trim() });
      }
    }

    const distractors: DistractorInfo[] = [];
    for (const letter of rawOptions) {
       if (row[`distractor_tier_${letter}`]) {
         distractors.push({
           letter,
           tier: row[`distractor_tier_${letter}`],
           errorType: row[`distractor_error_type_${letter}`],
           misconception: row[`distractor_misconception_${letter}`],
           skillDeficit: row[`distractor_skill_deficit_${letter}`]
         });
       }
    }

    const correctAnswers = row.correct_answers ? String(row.correct_answers).split('|').map((s: string) => s.trim()) : [];
    const skillId = row.current_skill_id || String(row.skillId || '');

    // Validation: Log warning for missing skill_id mapping
    if (skillId && !validSkillIds.has(skillId)) {
      console.warn(`[INGEST WARNING] Question ${row.UNIQUEID || row.id} references skill_id "${skillId}" which is missing from skills CSV.`);
    }

    const domainVal = row.DOMAIN || row.domain || '';
    const domainId = !isNaN(parseInt(domainVal)) ? parseInt(domainVal) : domainVal;

    const question: Question = {
      id: row.UNIQUEID || row.id,
      itemFormat: row.item_format || 'Single-Select',
      isMultiSelect,
      correctAnswerCount: parseInt(row.correct_answer_count) || 1,
      optionCountExpected: parseInt(row.option_count_expected) || options.length,
      hasCaseVignette: row.has_case_vignette === 'True' || row.has_case_vignette === 'true',
      caseText: row.case_text || '',
      questionStem: row.question_stem || row.stem || '',
      options,
      correctAnswers,
      correctExplanation: row.CORRECT_Explanation || row.correctText || '',
      coreConcept: row.core_concept || '',
      contentLimit: row.content_limit || '',
      domain: domainId,
      domainName: row.domain_name || String(row.DOMAIN || ''),
      skillId,
      skillName: row.skill_name || 'Generic Skill',
      cognitiveComplexity: row.cognitive_complexity || '',
      complexityRationale: row.complexity_rationale || '',
      rationale: row.rationale || '',
      distractors,
      isFoundational: row.is_foundational === 'True' || row.is_foundational === 'true',
    };

    if (!question.id) continue;

    batch.set(doc(questionsRef, question.id), question);
    operationCount++;

    if (operationCount >= 490) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
     await batch.commit();
  }

  console.log('Successfully ingested all data into Firestore.');
}

const args = process.argv.slice(2);
const qPath = args[0] || 'data/export_questions.csv';
const sPath = args[1] || 'data/export_skills.csv';

ingestData(qPath, sPath)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
