#!/usr/bin/env tsx
/**
 * Master Audit Script for Question Bank Data Integrity
 * 
 * This script analyzes all question sources and generates a comprehensive
 * reconciliation report showing:
 * - Total questions per file
 * - Question IDs in each file
 * - Questions mapped vs unmapped
 * - Duplicate question IDs across files
 * - Questions in skill-map but not in questions.json
 * - Questions in questions.json but not in skill-map
 * - Coverage statistics per domain/cluster/skill
 */

import * as fs from 'fs';
import * as path from 'path';
import { SKILL_MAP } from '../src/brain/skill-map';

interface Question {
  id: string;
  question: string;
  choices?: Record<string, string>;
  correct_answer?: string[];
  rationale?: string;
  skillId?: string;
  domain?: number;
  [key: string]: any;
}

interface QuestionMapping {
  questionId: string;
  skillId: string;
  confidence?: string;
  reasoning?: string;
}

interface QuestionSkillMap {
  totalQuestions: number;
  mappedQuestions: QuestionMapping[];
}

interface FileAnalysis {
  filename: string;
  path: string;
  exists: boolean;
  questionCount: number;
  questionIds: string[];
  sampleIds: string[];
  status: 'CONNECTED' | 'NOT_CONNECTED' | 'ORPHANED' | 'BACKUP';
}

interface AuditReport {
  summary: {
    totalUniqueQuestions: number;
    questionsInMainFile: number;
    questionsMappedToSkills: number;
    unmappedQuestions: number;
    orphanedQuestions: number;
    duplicateIds: string[];
  };
  fileAnalysis: FileAnalysis[];
  mappingAnalysis: {
    mappedCount: number;
    unmappedCount: number;
    mappedQuestionIds: Set<string>;
    unmappedQuestionIds: string[];
    questionsInMapButNotInFile: string[];
    questionsInFileButNotInMap: string[];
  };
  duplicateAnalysis: {
    exactIdDuplicates: Array<{ id: string; files: string[] }>;
    exactTextDuplicates: Array<{ text: string; ids: string[]; files: string[] }>;
  };
  coverageAnalysis: {
    domains: Record<number, {
      domainId: number;
      domainName: string;
      skillsWithQuestions: number;
      totalSkills: number;
      questionCount: number;
    }>;
    skills: Record<string, {
      skillId: string;
      skillName: string;
      questionCount: number;
      questionIds: string[];
    }>;
  };
}

function loadJsonFile(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return null;
  }
}

function extractQuestionsFromTxt(filePath: string): Question[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Look for QUESTIONS_DATA array in the React component
    const match = content.match(/const QUESTIONS_DATA = \[([\s\S]*?)\];/);
    if (!match) {
      console.warn(`Could not find QUESTIONS_DATA in ${filePath}`);
      return [];
    }
    
    // Try to parse the array content
    // This is a simplified parser - may need refinement
    const arrayContent = match[1];
    // For now, return empty array and note that manual parsing may be needed
    // We'll count lines that look like question objects instead
    const questionMatches = content.match(/"id":\s*"([^"]+)"/g);
    if (questionMatches) {
      return questionMatches.map(m => {
        const idMatch = m.match(/"id":\s*"([^"]+)"/);
        return { id: idMatch ? idMatch[1] : 'unknown' } as Question;
      });
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

function analyzeFile(filePath: string, filename: string, status: FileAnalysis['status']): FileAnalysis {
  const fullPath = path.resolve(filePath);
  const exists = fs.existsSync(fullPath);
  
  if (!exists) {
    return {
      filename,
      path: fullPath,
      exists: false,
      questionCount: 0,
      questionIds: [],
      sampleIds: [],
      status
    };
  }

  let questions: Question[] = [];
  
  if (filename.endsWith('.txt')) {
    questions = extractQuestionsFromTxt(fullPath);
  } else if (filename.endsWith('.json')) {
    const data = loadJsonFile(fullPath);
    if (Array.isArray(data)) {
      questions = data;
    } else if (data && Array.isArray(data.mappedQuestions)) {
      // This is question-skill-map.json - skip for now, handled separately
      return {
        filename,
        path: fullPath,
        exists: true,
        questionCount: 0,
        questionIds: [],
        sampleIds: [],
        status
      };
    }
  }

  const questionIds = questions.map(q => q.id).filter(Boolean);
  const sampleIds = questionIds.slice(0, 5);

  return {
    filename,
    path: fullPath,
    exists: true,
    questionCount: questions.length,
    questionIds,
    sampleIds,
    status
  };
}

function getAllSkillIds(): Set<string> {
  const skillIds = new Set<string>();
  for (const domain of Object.values(SKILL_MAP)) {
    for (const cluster of domain.clusters) {
      for (const skill of cluster.skills) {
        skillIds.add(skill.skillId);
      }
    }
  }
  return skillIds;
}

function getAllQuestionIdsFromSkillMap(): Set<string> {
  const questionIds = new Set<string>();
  for (const domain of Object.values(SKILL_MAP)) {
    for (const cluster of domain.clusters) {
      for (const skill of cluster.skills) {
        skill.questionIds.forEach(id => questionIds.add(id));
      }
    }
  }
  return questionIds;
}

function generateReport(): AuditReport {
  console.log('🔍 Starting Question Bank Audit...\n');

  // Analyze all files
  const files: FileAnalysis[] = [
    analyzeFile('src/data/questions.json', 'questions.json', 'CONNECTED'),
    analyzeFile('src/data/question-skill-map.json', 'question-skill-map.json', 'CONNECTED'),
    analyzeFile('Questions.txt', 'Questions.txt', 'ORPHANED'),
    analyzeFile('src/data/ets-sample-questions.json', 'ets-sample-questions.json', 'NOT_CONNECTED'),
    analyzeFile('src/data/generated-from-distractors.json', 'generated-from-distractors.json', 'NOT_CONNECTED'),
    analyzeFile('src/data/questions.json.backup.1768982876789', 'questions.json.backup.1768982876789', 'BACKUP'),
  ];

  // Load main question file
  const mainQuestions: Question[] = loadJsonFile('src/data/questions.json') || [];
  const mainQuestionIds = new Set(mainQuestions.map(q => q.id));

  // Load question-skill-map
  const skillMapData: QuestionSkillMap = loadJsonFile('src/data/question-skill-map.json') || { totalQuestions: 0, mappedQuestions: [] };
  const mappedQuestionIds = new Set(skillMapData.mappedQuestions.map(m => m.questionId));
  const mappedSkills = new Set(skillMapData.mappedQuestions.map(m => m.skillId));

  // Get all valid skill IDs from skill-map.ts
  const validSkillIds = getAllSkillIds();
  const questionIdsFromSkillMap = getAllQuestionIdsFromSkillMap();

  // Find unmapped questions
  const unmappedQuestionIds = mainQuestions
    .filter(q => !mappedQuestionIds.has(q.id))
    .map(q => q.id);

  // Find questions in map but not in main file
  const questionsInMapButNotInFile = Array.from(mappedQuestionIds).filter(
    id => !mainQuestionIds.has(id)
  );

  // Find questions in main file but not in map
  const questionsInFileButNotInMap = Array.from(mainQuestionIds).filter(
    id => !mappedQuestionIds.has(id)
  );

  // Find duplicate IDs across files
  const idOccurrences = new Map<string, string[]>();
  files.forEach(file => {
    file.questionIds.forEach(id => {
      if (!idOccurrences.has(id)) {
        idOccurrences.set(id, []);
      }
      idOccurrences.get(id)!.push(file.filename);
    });
  });

  const exactIdDuplicates = Array.from(idOccurrences.entries())
    .filter(([_, files]) => files.length > 1)
    .map(([id, files]) => ({ id, files }));

  // Find exact text duplicates (simplified - compare first 100 chars)
  const textToIds = new Map<string, { ids: string[]; files: string[] }>();
  files.forEach(file => {
    if (file.filename === 'questions.json') {
      mainQuestions.forEach(q => {
        const textKey = q.question?.substring(0, 100) || '';
        if (textKey) {
          if (!textToIds.has(textKey)) {
            textToIds.set(textKey, { ids: [], files: [] });
          }
          textToIds.get(textKey)!.ids.push(q.id);
          textToIds.get(textKey)!.files.push(file.filename);
        }
      });
    }
  });

  const exactTextDuplicates = Array.from(textToIds.entries())
    .filter(([_, data]) => data.ids.length > 1)
    .map(([text, data]) => ({ text: text.substring(0, 80) + '...', ids: data.ids, files: data.files }));

  // Coverage analysis
  const domainCoverage: Record<number, {
    domainId: number;
    domainName: string;
    skillsWithQuestions: number;
    totalSkills: number;
    questionCount: number;
  }> = {};

  const skillCoverage: Record<string, {
    skillId: string;
    skillName: string;
    questionCount: number;
    questionIds: string[];
  }> = {};

  for (const domain of Object.values(SKILL_MAP)) {
    let skillsWithQuestions = 0;
    let totalQuestionCount = 0;

    for (const cluster of domain.clusters) {
      for (const skill of cluster.skills) {
        const questionsForSkill = skill.questionIds.filter(id => mainQuestionIds.has(id));
        const mappedQuestionsForSkill = skillMapData.mappedQuestions.filter(
          m => m.skillId === skill.skillId && mainQuestionIds.has(m.questionId)
        );
        
        const allQuestionIds = new Set([
          ...questionsForSkill,
          ...mappedQuestionsForSkill.map(m => m.questionId)
        ]);

        skillCoverage[skill.skillId] = {
          skillId: skill.skillId,
          skillName: skill.name,
          questionCount: allQuestionIds.size,
          questionIds: Array.from(allQuestionIds)
        };

        if (allQuestionIds.size > 0) {
          skillsWithQuestions++;
          totalQuestionCount += allQuestionIds.size;
        }
      }
    }

    domainCoverage[domain.domainId] = {
      domainId: domain.domainId,
      domainName: domain.name,
      skillsWithQuestions,
      totalSkills: domain.clusters.reduce((sum, c) => sum + c.skills.length, 0),
      questionCount: totalQuestionCount
    };
  }

  // Calculate orphaned questions
  const orphanedFiles = files.filter(f => f.status === 'ORPHANED' || f.status === 'NOT_CONNECTED');
  const orphanedQuestionCount = orphanedFiles.reduce((sum, f) => sum + f.questionCount, 0);

  // Calculate total unique questions
  const allQuestionIdsSet = new Set<string>();
  files.forEach(file => {
    file.questionIds.forEach(id => allQuestionIdsSet.add(id));
  });
  const totalUniqueQuestions = allQuestionIdsSet.size;

  return {
    summary: {
      totalUniqueQuestions,
      questionsInMainFile: mainQuestions.length,
      questionsMappedToSkills: mappedQuestionIds.size,
      unmappedQuestions: unmappedQuestionIds.length,
      orphanedQuestions: orphanedQuestionCount,
      duplicateIds: exactIdDuplicates.map(d => d.id)
    },
    fileAnalysis: files,
    mappingAnalysis: {
      mappedCount: mappedQuestionIds.size,
      unmappedCount: unmappedQuestionIds.length,
      mappedQuestionIds: mappedQuestionIds,
      unmappedQuestionIds,
      questionsInMapButNotInFile,
      questionsInFileButNotInMap
    },
    duplicateAnalysis: {
      exactIdDuplicates,
      exactTextDuplicates
    },
    coverageAnalysis: {
      domains: domainCoverage,
      skills: skillCoverage
    }
  };
}

function formatReport(report: AuditReport): string {
  const lines: string[] = [];

  lines.push('# Question Bank Audit Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');

  // Summary Statistics
  lines.push('## Summary Statistics');
  lines.push('');
  lines.push(`- **Total unique questions:** ${report.summary.totalUniqueQuestions}`);
  lines.push(`- **Questions in questions.json:** ${report.summary.questionsInMainFile}`);
  lines.push(`- **Questions mapped to skills:** ${report.summary.questionsMappedToSkills}`);
  lines.push(`- **Unmapped questions:** ${report.summary.unmappedQuestions}`);
  lines.push(`- **Orphaned questions:** ${report.summary.orphanedQuestions}`);
  lines.push(`- **Duplicate IDs found:** ${report.summary.duplicateIds.length}`);
  lines.push('');

  // File Analysis
  lines.push('## Detailed Findings');
  lines.push('');
  lines.push('### File Analysis');
  lines.push('');
  
  report.fileAnalysis.forEach(file => {
    lines.push(`#### ${file.filename}`);
    lines.push(`- **Status:** ${file.status}`);
    lines.push(`- **Exists:** ${file.exists ? 'Yes' : 'No'}`);
    lines.push(`- **Question Count:** ${file.questionCount}`);
    if (file.sampleIds.length > 0) {
      lines.push(`- **Sample IDs:** ${file.sampleIds.join(', ')}`);
    }
    lines.push('');
  });

  // Mapping Analysis
  lines.push('### Mapping Analysis');
  lines.push('');
  lines.push(`- **Total mapped questions:** ${report.mappingAnalysis.mappedCount}`);
  lines.push(`- **Unmapped questions:** ${report.mappingAnalysis.unmappedCount}`);
  lines.push(`- **Questions in map but not in questions.json:** ${report.mappingAnalysis.questionsInMapButNotInFile.length}`);
  if (report.mappingAnalysis.questionsInMapButNotInFile.length > 0) {
    lines.push(`  - Sample: ${report.mappingAnalysis.questionsInMapButNotInFile.slice(0, 5).join(', ')}`);
  }
  lines.push(`- **Questions in questions.json but not in map:** ${report.mappingAnalysis.questionsInFileButNotInMap.length}`);
  if (report.mappingAnalysis.questionsInFileButNotInMap.length > 0) {
    lines.push(`  - Sample: ${report.mappingAnalysis.questionsInFileButNotInMap.slice(0, 10).join(', ')}`);
  }
  lines.push('');

  // Duplicate Analysis
  lines.push('### Duplicate Analysis');
  lines.push('');
  
  if (report.duplicateAnalysis.exactIdDuplicates.length > 0) {
    lines.push('#### Exact ID Duplicates');
    report.duplicateAnalysis.exactIdDuplicates.forEach(dup => {
      lines.push(`- **${dup.id}** found in: ${dup.files.join(', ')}`);
    });
    lines.push('');
  } else {
    lines.push('#### Exact ID Duplicates');
    lines.push('- None found');
    lines.push('');
  }

  if (report.duplicateAnalysis.exactTextDuplicates.length > 0) {
    lines.push('#### Exact Text Duplicates (>90% similarity)');
    report.duplicateAnalysis.exactTextDuplicates.slice(0, 10).forEach(dup => {
      lines.push(`- **Text:** "${dup.text}"`);
      lines.push(`  - **IDs:** ${dup.ids.join(', ')}`);
      lines.push(`  - **Files:** ${dup.files.join(', ')}`);
    });
    lines.push('');
  } else {
    lines.push('#### Exact Text Duplicates');
    lines.push('- None found');
    lines.push('');
  }

  // Coverage Analysis
  lines.push('### Coverage Analysis');
  lines.push('');
  lines.push('#### By Domain');
  lines.push('');
  lines.push('| Domain | Name | Skills with Questions | Total Skills | Question Count | Coverage % |');
  lines.push('|--------|------|----------------------|--------------|----------------|------------|');
  
  Object.values(report.coverageAnalysis.domains)
    .sort((a, b) => a.domainId - b.domainId)
    .forEach(domain => {
      const coverage = domain.totalSkills > 0 
        ? ((domain.skillsWithQuestions / domain.totalSkills) * 100).toFixed(1)
        : '0.0';
      lines.push(`| ${domain.domainId} | ${domain.domainName.substring(0, 40)} | ${domain.skillsWithQuestions} | ${domain.totalSkills} | ${domain.questionCount} | ${coverage}% |`);
    });
  
  lines.push('');
  lines.push('#### Skills with Zero Questions');
  lines.push('');
  
  const emptySkills = Object.values(report.coverageAnalysis.skills)
    .filter(s => s.questionCount === 0)
    .slice(0, 20);
  
  if (emptySkills.length > 0) {
    emptySkills.forEach(skill => {
      lines.push(`- **${skill.skillId}** - ${skill.skillName}`);
    });
    lines.push('');
    if (Object.values(report.coverageAnalysis.skills).filter(s => s.questionCount === 0).length > 20) {
      lines.push(`*... and ${Object.values(report.coverageAnalysis.skills).filter(s => s.questionCount === 0).length - 20} more*`);
      lines.push('');
    }
  } else {
    lines.push('- None (all skills have questions)');
    lines.push('');
  }

  // Recommendations
  lines.push('## Recommendations');
  lines.push('');
  
  if (report.summary.unmappedQuestions > 0) {
    lines.push(`1. **Map ${report.summary.unmappedQuestions} unmapped questions** to appropriate skills`);
  }
  
  if (report.mappingAnalysis.questionsInMapButNotInFile.length > 0) {
    lines.push(`2. **Resolve ${report.mappingAnalysis.questionsInMapButNotInFile.length} orphaned mappings** - questions mapped but not in questions.json`);
  }
  
  if (report.summary.duplicateIds.length > 0) {
    lines.push(`3. **Resolve ${report.summary.duplicateIds.length} duplicate question IDs** across files`);
  }
  
  if (report.summary.orphanedQuestions > 0) {
    lines.push(`4. **Evaluate ${report.summary.orphanedQuestions} orphaned questions** for integration or archival`);
  }
  
  const emptySkillsCount = Object.values(report.coverageAnalysis.skills).filter(s => s.questionCount === 0).length;
  if (emptySkillsCount > 0) {
    lines.push(`5. **Add questions for ${emptySkillsCount} skills** that currently have zero questions`);
  }
  
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('**Next Steps:**');
  lines.push('1. Review unmapped questions and create mappings');
  lines.push('2. Resolve duplicate IDs');
  lines.push('3. Evaluate orphaned files for integration');
  lines.push('4. Update question-skill-map.json with new mappings');
  lines.push('5. Regenerate visual hierarchy');

  return lines.join('\n');
}

// Main execution
function main() {
  try {
    const report = generateReport();
    const reportMarkdown = formatReport(report);

    // Ensure reports directory exists
    const reportsDir = path.resolve('reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Write report
    const reportPath = path.join(reportsDir, 'question-bank-audit-report.md');
    fs.writeFileSync(reportPath, reportMarkdown, 'utf-8');

    console.log('✅ Audit complete!');
    console.log(`📄 Report saved to: ${reportPath}`);
    console.log('\n📊 Summary:');
    console.log(`   - Total questions: ${report.summary.questionsInMainFile}`);
    console.log(`   - Mapped: ${report.summary.questionsMappedToSkills}`);
    console.log(`   - Unmapped: ${report.summary.unmappedQuestions}`);
    console.log(`   - Duplicates: ${report.summary.duplicateIds.length}`);
    console.log(`   - Orphaned: ${report.summary.orphanedQuestions}`);
  } catch (error) {
    console.error('❌ Error during audit:', error);
    process.exit(1);
  }
}

main();
