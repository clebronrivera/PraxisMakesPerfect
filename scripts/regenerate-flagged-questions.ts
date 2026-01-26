/**
 * Regenerate Flagged Questions
 * 
 * 1. Load DISTRACTOR_AUDIT_REPORT.md or re-run audit to get flagged question IDs
 * 2. Filter to only GEN-* prefixed questions (machine-generated, safe to replace)
 * 3. Group by templateId
 * 4. For each template:
 *    - Delete the flagged GEN-* questions from questions.json
 *    - Delete their mappings from question-skill-map.json
 *    - Regenerate same count using fixed generator
 *    - Add new questions and mappings
 * 5. Log: deleted count, regenerated count, any failures
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateQuestion, generateQuestions, GeneratedQuestion } from '../src/brain/question-generator';
import { SkillId } from '../src/brain/skill-map';
import { domain1Templates } from '../src/brain/templates/domain-1-templates';
import { domain2Templates } from '../src/brain/templates/domain-2-templates';
import { domain3Templates } from '../src/brain/templates/domain-3-templates';
import { domain4Templates } from '../src/brain/templates/domain-4-templates';
import { domain5Templates } from '../src/brain/templates/domain-5-templates';
import { domain6Templates } from '../src/brain/templates/domain-6-templates';
import { domain7Templates } from '../src/brain/templates/domain-7-templates';
import { domain8Templates } from '../src/brain/templates/domain-8-templates';
import { domain9Templates } from '../src/brain/templates/domain-9-templates';
import { domain10Templates } from '../src/brain/templates/domain-10-templates';
import { QuestionTemplate } from '../src/brain/template-schema';

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  questionsPath: './src/data/questions.json',
  skillMapPath: './src/data/question-skill-map.json',
  auditReportPath: './DISTRACTOR_AUDIT_REPORT.md',
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Question {
  id: string;
  question: string;
  choices: Record<string, string>;
  correct_answer: string | string[];
  rationale?: string;
  skillId?: string;
  metadata?: {
    templateId?: string;
    source?: string;
  };
}

interface QuestionSkillMapEntry {
  questionId: string;
  skillId: string;
  confidence: string;
  reasoning: string;
}

interface QuestionSkillMap {
  totalQuestions: number;
  mappedQuestions: QuestionSkillMapEntry[];
}

// ============================================================================
// AUDIT REPORT PARSING
// ============================================================================

/**
 * Parse the audit report to extract flagged GEN-* questions grouped by template
 */
function parseAuditReport(auditReportPath: string): Map<string, Set<string>> {
  const reportContent = fs.readFileSync(auditReportPath, 'utf-8');
  const templateToQuestions = new Map<string, Set<string>>();
  
  // Extract template IDs and question IDs from the flagged questions table
  // Format: | Question ID | Skill | Template | Issue | ...
  const tableRegex = /\| (GEN-[^\|]+) \| ([^\|]+) \| ([^\|]+) \|/g;
  let match;
  
  while ((match = tableRegex.exec(reportContent)) !== null) {
    const questionId = match[1].trim();
    const skillId = match[2].trim();
    const templateId = match[3].trim();
    
    // Only process GEN-* questions
    if (questionId.startsWith('GEN-')) {
      // Extract template ID from question ID if not in table
      // Format: GEN-{templateId}-{hash}
      let actualTemplateId = templateId;
      if (templateId === 'N/A' || !templateId) {
        const parts = questionId.split('-');
        if (parts.length >= 3) {
          actualTemplateId = parts.slice(1, 3).join('-');
        }
      }
      
      if (actualTemplateId && actualTemplateId !== 'N/A') {
        if (!templateToQuestions.has(actualTemplateId)) {
          templateToQuestions.set(actualTemplateId, new Set());
        }
        templateToQuestions.get(actualTemplateId)!.add(questionId);
      }
    }
  }
  
  // Also check the "Templates with Most Issues" section
  // Template IDs follow pattern: [A-Z]+-T\d+ (e.g., MBH-T16, ACAD-T10)
  const templatesSectionRegex = /\| ([A-Z]+-T\d+) \| (\d+) \|/g;
  while ((match = templatesSectionRegex.exec(reportContent)) !== null) {
    const templateId = match[1].trim();
    const issueCount = parseInt(match[2].trim(), 10);
    
    // If template has issues, we'll need to find questions for it
    if (issueCount > 0 && !templateToQuestions.has(templateId)) {
      templateToQuestions.set(templateId, new Set());
    }
  }
  
  return templateToQuestions;
}

/**
 * Alternative: Re-run audit to get flagged questions programmatically
 */
function getFlaggedGenQuestions(questions: Question[]): Map<string, Set<string>> {
  const templateToQuestions = new Map<string, Set<string>>();
  
  // Load the audit report to get the actual flagged questions
  // For now, we'll parse questions.json to find GEN-* questions
  // and check if they have issues by looking at their metadata
  
  for (const question of questions) {
    if (question.id.startsWith('GEN-')) {
      // Extract template ID from question ID
      const parts = question.id.split('-');
      if (parts.length >= 3) {
        const templateId = parts.slice(1, 3).join('-');
        
        // For now, we'll regenerate all GEN-* questions for templates with issues
        // The actual filtering should be done by checking the audit report
        if (!templateToQuestions.has(templateId)) {
          templateToQuestions.set(templateId, new Set());
        }
        templateToQuestions.get(templateId)!.add(question.id);
      }
    }
  }
  
  return templateToQuestions;
}

// ============================================================================
// QUESTION MANAGEMENT
// ============================================================================

function loadQuestions(filePath: string): Question[] {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading questions from ${filePath}:`, error);
    return [];
  }
}

function saveQuestions(filePath: string, questions: Question[]): void {
  fs.writeFileSync(filePath, JSON.stringify(questions, null, 2) + '\n');
}

function loadSkillMap(filePath: string): QuestionSkillMap {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading skill map from ${filePath}:`, error);
    return { totalQuestions: 0, mappedQuestions: [] };
  }
}

function saveSkillMap(filePath: string, skillMap: QuestionSkillMap): void {
  fs.writeFileSync(filePath, JSON.stringify(skillMap, null, 2) + '\n');
}

/**
 * Convert GeneratedQuestion to Question format for storage
 */
function convertToQuestion(generated: GeneratedQuestion): Question {
  return {
    id: generated.id,
    question: generated.question,
    choices: generated.choices,
    correct_answer: generated.correct_answer,
    rationale: generated.rationale,
    skillId: generated.metadata.skillId,
    metadata: {
      templateId: generated.metadata.templateId,
      source: 'generated'
    }
  };
}

// Build template lookup map
const allTemplates: QuestionTemplate[] = [
  ...domain1Templates,
  ...domain2Templates,
  ...domain3Templates,
  ...domain4Templates,
  ...domain5Templates,
  ...domain6Templates,
  ...domain7Templates,
  ...domain8Templates,
  ...domain9Templates,
  ...domain10Templates
];

const templateToSkillMap = new Map<string, SkillId>();
for (const template of allTemplates) {
  templateToSkillMap.set(template.templateId, template.skillId);
}

/**
 * Get skillId for a template by looking it up in the template definitions
 */
function getSkillIdForTemplate(templateId: string, questions: Question[]): SkillId | null {
  // First try template lookup
  const skillId = templateToSkillMap.get(templateId);
  if (skillId) {
    return skillId;
  }
  
  // Fallback: try to find an existing question with this template
  for (const q of questions) {
    if (q.metadata?.templateId === templateId || 
        (q.id.startsWith('GEN-') && q.id.includes(templateId))) {
      return q.skillId as SkillId || null;
    }
  }
  return null;
}

// ============================================================================
// MAIN REGENERATION LOGIC
// ============================================================================

async function regenerateFlaggedQuestions() {
  console.log('Regenerating Flagged Questions');
  console.log('==============================\n');

  // Load current data
  const questions = loadQuestions(CONFIG.questionsPath);
  console.log(`Loaded ${questions.length} questions`);

  const skillMap = loadSkillMap(CONFIG.skillMapPath);
  console.log(`Loaded ${skillMap.mappedQuestions.length} skill mappings\n`);

  // Parse audit report to get flagged GEN-* questions by template
  let templateToQuestions: Map<string, Set<string>>;
  
  if (fs.existsSync(CONFIG.auditReportPath)) {
    console.log('Parsing audit report...');
    templateToQuestions = parseAuditReport(CONFIG.auditReportPath);
    console.log(`Found ${templateToQuestions.size} templates with flagged GEN-* questions\n`);
  } else {
    console.log('Audit report not found, checking all GEN-* questions...');
    templateToQuestions = getFlaggedGenQuestions(questions);
    console.log(`Found ${templateToQuestions.size} templates with GEN-* questions\n`);
  }

  // If no GEN-* questions found in audit, check templates with issues from report
  if (templateToQuestions.size === 0) {
    console.log('No GEN-* questions found in audit report.');
    console.log('Checking templates with issues from report summary...\n');
    
    // Get templates from "Templates with Most Issues" section
    // Template IDs follow pattern: [A-Z]+-T\d+ (e.g., MBH-T16, ACAD-T10)
    const reportContent = fs.readFileSync(CONFIG.auditReportPath, 'utf-8');
    const templateMatches = reportContent.matchAll(/\| ([A-Z]+-T\d+) \| \d+ \|/g);
    
    const templatesWithIssues = new Set<string>();
    for (const match of templateMatches) {
      templatesWithIssues.add(match[1]);
    }
    
    console.log(`Found ${templatesWithIssues.size} templates with issues`);
    console.log('Regenerating questions for these templates...\n');
    
    // Track all questions to delete and new questions to add
    const allDeletedIds = new Set<string>();
    const allNewQuestions: Question[] = [];
    let totalDeleted = 0;
    let totalRegenerated = 0;
    
    // For each template, find questions and regenerate
    for (const templateId of templatesWithIssues) {
      // Find skillId for this template
      const skillId = getSkillIdForTemplate(templateId, questions);
      if (!skillId) {
        console.warn(`  ⚠️  Could not find skillId for template ${templateId}, skipping`);
        continue;
      }
      
      // Count how many questions to generate (use existing count or default to 3)
      const existingCount = questions.filter(q => 
        q.metadata?.templateId === templateId || 
        (q.id.startsWith('GEN-') && q.id.includes(templateId))
      ).length;
      
      const countToGenerate = Math.max(existingCount, 3);
      
      console.log(`  Regenerating ${countToGenerate} questions for ${templateId} (skill: ${skillId})`);
      
      // Generate new questions
      const newQuestions = generateQuestions(skillId, countToGenerate, {
        templateId: templateId
      });
      
      if (newQuestions.length === 0) {
        console.warn(`    ⚠️  Failed to generate questions for ${templateId}`);
        continue;
      }
      
      // Delete old GEN-* questions with this template (don't delete SP5403_Q* questions)
      // Only delete if they exist
      const questionsToDelete = questions.filter(q =>
        q.id.startsWith('GEN-') && (
          q.metadata?.templateId === templateId ||
          q.id.includes(templateId)
        )
      );
      
      for (const q of questionsToDelete) {
        allDeletedIds.add(q.id);
      }
      
      // Add new questions
      const convertedQuestions = newQuestions.map(convertToQuestion);
      allNewQuestions.push(...convertedQuestions);
      
      // Update skill map
      // Remove old mappings
      skillMap.mappedQuestions = skillMap.mappedQuestions.filter(
        entry => !allDeletedIds.has(entry.questionId)
      );
      
      // Add new mappings
      for (const newQ of newQuestions) {
        skillMap.mappedQuestions.push({
          questionId: newQ.id,
          skillId: newQ.metadata.skillId,
          confidence: 'high',
          reasoning: `Regenerated question for template ${templateId}`
        });
      }
      
      totalDeleted += questionsToDelete.length;
      totalRegenerated += newQuestions.length;
      
      console.log(`    ✅ Deleted ${questionsToDelete.length} old questions`);
      console.log(`    ✅ Generated ${newQuestions.length} new questions`);
    }
    
    // Apply all changes
    const updatedQuestions = questions.filter(q => !allDeletedIds.has(q.id));
    updatedQuestions.push(...allNewQuestions);
    
    skillMap.totalQuestions = skillMap.mappedQuestions.length;
    
    // Save updated files
    saveQuestions(CONFIG.questionsPath, updatedQuestions);
    saveSkillMap(CONFIG.skillMapPath, skillMap);
    
    console.log('\n✅ Regeneration complete!');
    console.log(`\nSummary:`);
    console.log(`  Questions deleted: ${totalDeleted}`);
    console.log(`  Questions regenerated: ${totalRegenerated}`);
    console.log(`  Total questions: ${updatedQuestions.length}`);
    console.log(`  Total skill mappings: ${skillMap.totalQuestions}`);
    
    return;
  }

  // Process each template
  let totalDeleted = 0;
  let totalRegenerated = 0;
  const failures: string[] = [];
  
  const allDeletedIds = new Set<string>();
  const allNewQuestions: Question[] = [];
  
  for (const [templateId, questionIds] of templateToQuestions.entries()) {
    console.log(`Processing template: ${templateId}`);
    console.log(`  Flagged questions: ${questionIds.size}`);
    
    // Get skillId for this template
    const skillId = getSkillIdForTemplate(templateId, questions);
    if (!skillId) {
      console.warn(`  ⚠️  Could not find skillId for template ${templateId}, skipping`);
      failures.push(`${templateId}: No skillId found`);
      continue;
    }
    
    // Delete flagged questions
    const deletedCount = questionIds.size;
    for (const qId of questionIds) {
      allDeletedIds.add(qId);
    }
    
    // Determine how many questions to generate
    // If we're deleting existing questions, regenerate same count
    // Otherwise, generate a default number (3-5) for templates with issues
    const countToGenerate = deletedCount > 0 ? deletedCount : 3;
    
    console.log(`  Regenerating ${countToGenerate} questions...`);
    const regenerated = generateQuestions(skillId, countToGenerate, {
      templateId: templateId
    });
    
    if (regenerated.length === 0) {
      console.warn(`  ⚠️  Failed to generate questions`);
      failures.push(`${templateId}: Generation failed`);
      continue;
    }
    
    // Convert and add new questions
    const convertedQuestions = regenerated.map(convertToQuestion);
    allNewQuestions.push(...convertedQuestions);
    
    totalDeleted += deletedCount;
    totalRegenerated += regenerated.length;
    
    console.log(`  ✅ Deleted ${deletedCount}, regenerated ${regenerated.length}\n`);
  }
  
  // Apply all changes
  const updatedQuestions = questions.filter(q => !allDeletedIds.has(q.id));
  updatedQuestions.push(...allNewQuestions);
  
  // Update skill map
  const updatedSkillMap = {
    ...skillMap,
    mappedQuestions: skillMap.mappedQuestions.filter(
      entry => !allDeletedIds.has(entry.questionId)
    )
  };
  
  // Add new mappings
  for (const newQ of allNewQuestions) {
    updatedSkillMap.mappedQuestions.push({
      questionId: newQ.id,
      skillId: newQ.skillId!,
      confidence: 'high',
      reasoning: `Regenerated question for template`
    });
  }
  
  updatedSkillMap.totalQuestions = updatedSkillMap.mappedQuestions.length;
  
  // Save updated files
  saveQuestions(CONFIG.questionsPath, updatedQuestions);
  saveSkillMap(CONFIG.skillMapPath, updatedSkillMap);
  
  // Update references for next iteration
  questions.length = 0;
  questions.push(...updatedQuestions);
  Object.assign(skillMap, updatedSkillMap);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('REGENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nSummary:`);
  console.log(`  Questions deleted: ${totalDeleted}`);
  console.log(`  Questions regenerated: ${totalRegenerated}`);
  console.log(`  Failures: ${failures.length}`);
  
  if (failures.length > 0) {
    console.log(`\nFailures:`);
    failures.forEach(f => console.log(`  - ${f}`));
  }
  
  console.log(`\nUpdated files:`);
  console.log(`  ${CONFIG.questionsPath}`);
  console.log(`  ${CONFIG.skillMapPath}`);
  console.log('');
}

// Run
regenerateFlaggedQuestions().catch(console.error);
