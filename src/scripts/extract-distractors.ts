// Distractor Extraction and Skill Mapping Script
// Extracts all distractors from questions.json and maps them to skills

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { SKILL_MAP, getSkillById, Skill } from '../brain/skill-map.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Question {
  id: string;
  question: string;
  choices: Record<string, string>;
  correct_answer: string[];
  rationale: string;
  skillId: string;
}

interface DistractorMapping {
  term: string;
  sourceQuestion: string;
  sourceSkill: string;
  mapsToSkill: string | null;
  mapsToSameSkill: boolean;
  flippable: boolean;
  contextWhenCorrect?: string;
  distractorType?: string;
  reason?: string;
}

interface DistractorStats {
  totalDistractors: number;
  totalFlippable: number;
  totalDiscarded: number;
  byDomain: Record<number, number>;
  bySkill: Record<string, number>;
  sameSkillCount: number;
  differentSkillCount: number;
}

// Load questions
const questionsPath = join(__dirname, '../data/questions.json');
const questions: Question[] = JSON.parse(readFileSync(questionsPath, 'utf-8'));

// Build skill index for matching
function buildSkillIndex(): Map<string, Skill> {
  const index = new Map<string, Skill>();
  
  for (const domain of Object.values(SKILL_MAP)) {
    for (const cluster of domain.clusters) {
      for (const skill of cluster.skills) {
        index.set(skill.skillId, skill);
      }
    }
  }
  
  return index;
}

// Extract keywords and concepts from skill for matching
function extractSkillKeywords(skill: Skill): string[] {
  const keywords: string[] = [];
  
  // Add skill name words
  keywords.push(...skill.name.toLowerCase().split(/\s+/));
  
  // Add description words
  keywords.push(...skill.description.toLowerCase().split(/\s+/));
  
  // Add decision rule words
  keywords.push(...skill.decisionRule.toLowerCase().split(/\s+/));
  
  // Add common wrong rules words
  skill.commonWrongRules.forEach(rule => {
    keywords.push(...rule.toLowerCase().split(/\s+/));
  });
  
  return keywords.filter(w => w.length > 2); // Filter out very short words
}

// Check if distractor text matches a skill
function findMatchingSkill(
  distractorText: string,
  sourceSkillId: string,
  skillIndex: Map<string, Skill>
): { skillId: string | null; confidence: 'high' | 'medium' | 'low' } {
  const distractorLower = distractorText.toLowerCase();
  const distractorWords = distractorLower.split(/\s+/).filter(w => w.length > 2);
  
  let bestMatch: { skillId: string; score: number } | null = null;
  
  // Check each skill
  for (const [skillId, skill] of skillIndex.entries()) {
    const skillKeywords = extractSkillKeywords(skill);
    const skillText = `${skill.name} ${skill.description} ${skill.decisionRule}`.toLowerCase();
    
    // Calculate match score
    let score = 0;
    
    // Direct text match
    if (skillText.includes(distractorLower) || distractorLower.includes(skillText)) {
      score += 10;
    }
    
    // Keyword overlap
    const matchingKeywords = distractorWords.filter(word => 
      skillKeywords.some(sk => sk.includes(word) || word.includes(sk))
    );
    score += matchingKeywords.length;
    
    // Check if distractor appears in decision rule or common wrong rules
    if (skill.decisionRule.toLowerCase().includes(distractorLower)) {
      score += 5;
    }
    
    skill.commonWrongRules.forEach(rule => {
      if (rule.toLowerCase().includes(distractorLower)) {
        score += 3;
      }
    });
    
    // Special handling for same-skill matches
    if (skillId === sourceSkillId) {
      score += 2; // Boost for same skill
    }
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { skillId, score };
    }
  }
  
  if (!bestMatch || bestMatch.score < 2) {
    return { skillId: null, confidence: 'low' };
  }
  
  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (bestMatch.score >= 8) {
    confidence = 'high';
  } else if (bestMatch.score >= 4) {
    confidence = 'medium';
  }
  
  return { skillId: bestMatch.skillId, confidence };
}

// Determine if distractor is flippable (could be correct in different context)
function isFlippable(
  distractorText: string,
  mappedSkill: Skill | null,
  sourceSkill: Skill
): boolean {
  if (!mappedSkill) {
    return false;
  }
  
  // Check if it's a professional practice that could be correct
  const alwaysWrongPatterns = [
    /tell.*try harder/i,
    /do nothing/i,
    /ignore.*behavior/i,
    /punish.*student/i,
    /refuse.*evaluation/i,
    /skip.*assessment/i,
    /avoid.*contact/i,
    /not.*report/i,
    /decline.*evaluate/i,
    /proceeding.*without/i,
    /taking over/i,
    /making.*final decision/i,
  ];
  
  for (const pattern of alwaysWrongPatterns) {
    if (pattern.test(distractorText)) {
      return false;
    }
  }
  
  // If it maps to a skill, it's potentially flippable
  return true;
}

// Generate context when correct
function generateContextWhenCorrect(
  distractorText: string,
  mappedSkill: Skill | null
): string | undefined {
  if (!mappedSkill) {
    return undefined;
  }
  
  // Try to infer context from skill description and decision rule
  const decisionRule = mappedSkill.decisionRule.toLowerCase();
  
  // Look for context clues in decision rule
  if (decisionRule.includes('when')) {
    const whenMatch = decisionRule.match(/when[^.]*(?:\.|$)/i);
    if (whenMatch) {
      return whenMatch[0].trim();
    }
  }
  
  // Generic context based on skill
  return `When the context matches ${mappedSkill.name.toLowerCase()}`;
}

// Determine distractor type
function determineDistractorType(
  mapsToSameSkill: boolean,
  mappedSkill: Skill | null,
  sourceSkill: Skill
): string {
  if (!mappedSkill) {
    return 'no-skill-match';
  }
  
  if (mapsToSameSkill) {
    return 'same-category-different-context';
  } else {
    return 'cross-domain-connection';
  }
}

// Extract all distractors
function extractDistractors(): DistractorMapping[] {
  const skillIndex = buildSkillIndex();
  const distractors: DistractorMapping[] = [];
  
  for (const question of questions) {
    const sourceSkill = skillIndex.get(question.skillId);
    if (!sourceSkill) {
      console.warn(`Source skill not found: ${question.skillId} for question ${question.id}`);
      continue;
    }
    
    // Get all non-empty choices
    const allChoices = Object.entries(question.choices)
      .filter(([_, text]) => text && text.trim().length > 0)
      .map(([key, text]) => ({ key, text: text.trim() }));
    
    // Identify incorrect choices (distractors)
    const correctKeys = new Set(question.correct_answer);
    const incorrectChoices = allChoices.filter(choice => !correctKeys.has(choice.key));
    
    for (const choice of incorrectChoices) {
      // Try to map to a skill
      const match = findMatchingSkill(choice.text, question.skillId, skillIndex);
      const mappedSkill = match.skillId ? skillIndex.get(match.skillId) : null;
      
      const mapsToSameSkill = match.skillId === question.skillId;
      const flippable = isFlippable(choice.text, mappedSkill || null, sourceSkill);
      
      const mapping: DistractorMapping = {
        term: choice.text,
        sourceQuestion: question.id,
        sourceSkill: question.skillId,
        mapsToSkill: match.skillId,
        mapsToSameSkill,
        flippable: flippable && match.skillId !== null,
        distractorType: determineDistractorType(mapsToSameSkill, mappedSkill || null, sourceSkill),
      };
      
      if (mapping.flippable && mappedSkill) {
        mapping.contextWhenCorrect = generateContextWhenCorrect(choice.text, mappedSkill);
      } else if (!mapping.flippable) {
        mapping.reason = mappedSkill 
          ? 'Does not represent a testable competency in this context'
          : 'Not a professional practice or testable concept';
      }
      
      distractors.push(mapping);
    }
  }
  
  return distractors;
}

// Calculate statistics
function calculateStats(distractors: DistractorMapping[]): DistractorStats {
  const stats: DistractorStats = {
    totalDistractors: distractors.length,
    totalFlippable: 0,
    totalDiscarded: 0,
    byDomain: {},
    bySkill: {},
    sameSkillCount: 0,
    differentSkillCount: 0,
  };
  
  for (const distractor of distractors) {
    if (distractor.flippable) {
      stats.totalFlippable++;
      
      if (distractor.mapsToSkill) {
        const skill = getSkillById(distractor.mapsToSkill);
        if (skill) {
          // Find domain
          for (const domain of Object.values(SKILL_MAP)) {
            for (const cluster of domain.clusters) {
              if (cluster.skills.some(s => s.skillId === distractor.mapsToSkill)) {
                stats.byDomain[domain.domainId] = (stats.byDomain[domain.domainId] || 0) + 1;
                break;
              }
            }
          }
          
          stats.bySkill[distractor.mapsToSkill] = (stats.bySkill[distractor.mapsToSkill] || 0) + 1;
        }
      }
    } else {
      stats.totalDiscarded++;
    }
    
    if (distractor.mapsToSameSkill) {
      stats.sameSkillCount++;
    } else if (distractor.mapsToSkill) {
      stats.differentSkillCount++;
    }
  }
  
  return stats;
}

// Main execution
export function extractAndMapDistractors() {
  console.log('Extracting distractors...');
  const allDistractors = extractDistractors();
  console.log(`Extracted ${allDistractors.length} distractors`);

  console.log('Calculating statistics...');
  const stats = calculateStats(allDistractors);

  console.log('\n=== STATISTICS ===');
  console.log(`Total distractors: ${stats.totalDistractors}`);
  console.log(`Flippable (map to skills): ${stats.totalFlippable}`);
  console.log(`Discarded (no skill match): ${stats.totalDiscarded}`);
  console.log(`Same skill: ${stats.sameSkillCount}`);
  console.log(`Different skill: ${stats.differentSkillCount}`);

  console.log('\n=== BY DOMAIN ===');
  for (const [domainId, count] of Object.entries(stats.byDomain).sort((a, b) => Number(b[1]) - Number(a[1]))) {
    const domain = SKILL_MAP[Number(domainId) as keyof typeof SKILL_MAP];
    console.log(`Domain ${domainId} (${domain.name}): ${count}`);
  }

  console.log('\n=== TOP 10 SKILLS ===');
  const topSkills = Object.entries(stats.bySkill)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
    
  for (const [skillId, count] of topSkills) {
    const skill = getSkillById(skillId);
    console.log(`${skillId}: ${count} (${skill?.name || 'Unknown'})`);
  }

  console.log('\n=== EXAMPLE FLIPPABLE DISTRACTORS ===');
  const flippableExamples = allDistractors
    .filter(d => d.flippable)
    .slice(0, 10);
    
  for (const distractor of flippableExamples) {
    const skill = distractor.mapsToSkill ? getSkillById(distractor.mapsToSkill) : null;
    console.log(`\nTerm: "${distractor.term}"`);
    console.log(`  Source: ${distractor.sourceQuestion} (${distractor.sourceSkill})`);
    console.log(`  Maps to: ${distractor.mapsToSkill || 'None'} ${distractor.mapsToSameSkill ? '(SAME SKILL)' : '(DIFFERENT SKILL)'}`);
    console.log(`  Context when correct: ${distractor.contextWhenCorrect || 'N/A'}`);
    if (skill) {
      console.log(`  Skill name: ${skill.name}`);
    }
  }

  console.log('\n=== EXAMPLE DISCARDED DISTRACTORS ===');
  const discardedExamples = allDistractors
    .filter(d => !d.flippable)
    .slice(0, 5);
    
  for (const distractor of discardedExamples) {
    console.log(`\nTerm: "${distractor.term}"`);
    console.log(`  Source: ${distractor.sourceQuestion} (${distractor.sourceSkill})`);
    console.log(`  Reason: ${distractor.reason || 'No skill match'}`);
  }

  // Generate output files
  const outputDir = join(__dirname, '../data');

  // File 1: Complete distractor map
  const distractorMap = {
    totalDistractors: stats.totalDistractors,
    distractors: allDistractors,
  };

  // File 2: Flippable distractors only
  const flippableDistractors = {
    totalFlippable: stats.totalFlippable,
    byDomain: stats.byDomain,
    distractors: allDistractors.filter(d => d.flippable),
  };

  // File 3: Discarded distractors
  const discardedDistractors = {
    totalDiscarded: stats.totalDiscarded,
    distractors: allDistractors.filter(d => !d.flippable),
  };

  console.log('\n=== WRITING OUTPUT FILES ===');
  writeFileSync(
    join(outputDir, 'distractor-map.json'),
    JSON.stringify(distractorMap, null, 2)
  );
  console.log('✓ distractor-map.json');

  writeFileSync(
    join(outputDir, 'flippable-distractors.json'),
    JSON.stringify(flippableDistractors, null, 2)
  );
  console.log('✓ flippable-distractors.json');

  writeFileSync(
    join(outputDir, 'discard-distractors.json'),
    JSON.stringify(discardedDistractors, null, 2)
  );
  console.log('✓ discard-distractors.json');

  console.log('\n✅ Extraction complete!');
  
  return { stats, allDistractors };
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  extractAndMapDistractors();
}
