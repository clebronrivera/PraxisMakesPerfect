import { SKILL_MAP } from '../brain/skill-map';
import questionBank from '../data/questions.json';
import questionSkillMap from '../data/question-skill-map.json';
import etsContentTopics from '../data/ets-content-topics.json';

type Question = typeof questionBank[number];
type MappingEntry = typeof questionSkillMap.mappedQuestions[number];
type ETSTopic = typeof etsContentTopics.domains[number]['sections'][number]['topics'][number];
type ETSSection = typeof etsContentTopics.domains[number]['sections'][number];

// Step 1: Reconcile mapping sources
function reconcileMappings() {
  const questionsById = new Map<string, Question>();
  const mapByQuestionId = new Map<string, MappingEntry>();
  const discrepancies: Array<{
    questionId: string;
    questionsJsonSkillId: string | undefined;
    mapJsonSkillId: string | undefined;
    status: 'missing_in_map' | 'missing_in_questions' | 'mismatch';
  }> = [];

  // Load questions.json
  for (const question of questionBank) {
    questionsById.set(question.id, question);
  }

  // Load question-skill-map.json
  for (const entry of questionSkillMap.mappedQuestions) {
    mapByQuestionId.set(entry.questionId, entry);
  }

  // Find all unique question IDs
  const allQuestionIds = new Set([
    ...questionsById.keys(),
    ...mapByQuestionId.keys()
  ]);

  // Compare mappings
  for (const questionId of allQuestionIds) {
    const question = questionsById.get(questionId);
    const mapping = mapByQuestionId.get(questionId);

    const questionsJsonSkillId = question?.skillId;
    const mapJsonSkillId = mapping?.skillId;

    if (!mapping && question?.skillId) {
      discrepancies.push({
        questionId,
        questionsJsonSkillId,
        mapJsonSkillId: undefined,
        status: 'missing_in_map'
      });
    } else if (!question && mapping) {
      discrepancies.push({
        questionId,
        questionsJsonSkillId: undefined,
        mapJsonSkillId,
        status: 'missing_in_questions'
      });
    } else if (question && mapping && questionsJsonSkillId !== mapJsonSkillId) {
      discrepancies.push({
        questionId,
        questionsJsonSkillId,
        mapJsonSkillId,
        status: 'mismatch'
      });
    }
  }

  return {
    totalQuestions: questionsById.size,
    totalMapped: mapByQuestionId.size,
    discrepancies,
    questionsById,
    mapByQuestionId
  };
}

// Step 2: Map ETS topics to skills
function mapTopicsToSkills() {
  const topicToSkills = new Map<string, Set<string>>();
  const skillToTopics = new Map<string, Set<string>>();
  const topicCoverage = new Map<string, {
    topic: ETSTopic;
    skills: string[];
    questionCount: number;
    status: 'covered' | 'partial' | 'not_covered';
  }>();

  // Initialize topic coverage
  for (const domain of etsContentTopics.domains) {
    for (const section of domain.sections) {
      for (const topic of section.topics) {
        topicCoverage.set(topic.code, {
          topic,
          skills: [],
          questionCount: 0,
          status: 'not_covered'
        });
      }
    }
  }

  // Map skills to topics (manual keyword matching + domain alignment)
  for (const [domainIdStr, domain] of Object.entries(SKILL_MAP)) {
    const domainId = parseInt(domainIdStr);
    const etsDomain = etsContentTopics.domains.find(d => d.id === domainId);
    
    if (!etsDomain) continue;

    for (const cluster of domain.clusters) {
      for (const skill of cluster.skills) {
        // Find matching topics by keywords and domain
        const matchingTopics: ETSTopic[] = [];
        
        for (const section of etsDomain.sections) {
          for (const topic of section.topics) {
            const skillText = `${skill.name} ${skill.description} ${skill.decisionRule}`.toLowerCase();
            const topicKeywords = topic.keywords.map(k => k.toLowerCase());
            
            // Check if any topic keyword appears in skill text
            const hasMatch = topicKeywords.some(keyword => 
              skillText.includes(keyword) || keyword.includes(skillText.split(' ')[0])
            );
            
            if (hasMatch) {
              matchingTopics.push(topic);
            }
          }
        }

        // Also check by domain alignment (if no keyword match, assign to domain's general topics)
        if (matchingTopics.length === 0 && etsDomain.sections.length > 0) {
          // Assign to first section as fallback
          const firstSection = etsDomain.sections[0];
          if (firstSection.topics.length > 0) {
            matchingTopics.push(firstSection.topics[0]);
          }
        }

        for (const topic of matchingTopics) {
          if (!topicToSkills.has(topic.code)) {
            topicToSkills.set(topic.code, new Set());
          }
          topicToSkills.get(topic.code)!.add(skill.skillId);

          if (!skillToTopics.has(skill.skillId)) {
            skillToTopics.set(skill.skillId, new Set());
          }
          skillToTopics.get(skill.skillId)!.add(topic.code);
        }
      }
    }
  }

  return { topicToSkills, skillToTopics, topicCoverage };
}

// Step 3: Count questions per topic
function countQuestionsPerTopic(
  reconciliation: ReturnType<typeof reconcileMappings>,
  topicMapping: ReturnType<typeof mapTopicsToSkills>
) {
  const { questionsById, mapByQuestionId } = reconciliation;
  const { topicCoverage, skillToTopics } = topicMapping;

  // Count questions for each skill
  const skillQuestionCounts = new Map<string, number>();
  
  for (const question of questionBank) {
    const skillId = question.skillId || mapByQuestionId.get(question.id)?.skillId;
    if (skillId) {
      skillQuestionCounts.set(skillId, (skillQuestionCounts.get(skillId) || 0) + 1);
    }
  }

  // Update topic coverage with question counts
  for (const [topicCode, coverage] of topicCoverage.entries()) {
    const skills = Array.from(topicMapping.topicToSkills.get(topicCode) || []);
    coverage.skills = skills;
    
    const totalQuestions = skills.reduce((sum, skillId) => 
      sum + (skillQuestionCounts.get(skillId) || 0), 0
    );
    
    coverage.questionCount = totalQuestions;
    
    if (totalQuestions === 0) {
      coverage.status = 'not_covered';
    } else if (totalQuestions < 3) {
      coverage.status = 'partial';
    } else {
      coverage.status = 'covered';
    }
  }

  return topicCoverage;
}

// Step 4: Identify out-of-scope questions
function identifyOutOfScopeQuestions(
  reconciliation: ReturnType<typeof reconcileMappings>,
  topicMapping: ReturnType<typeof mapTopicsToSkills>
) {
  const { questionsById, mapByQuestionId } = reconciliation;
  const { skillToTopics } = topicMapping;
  
  const outOfScope: Array<{
    questionId: string;
    skillId: string | undefined;
    domainId: number | undefined;
    reason: string;
  }> = [];

  for (const question of questionBank) {
    const skillId = question.skillId || mapByQuestionId.get(question.id)?.skillId;
    
    if (!skillId) {
      outOfScope.push({
        questionId: question.id,
        skillId: undefined,
        domainId: undefined,
        reason: 'No skill mapping found'
      });
      continue;
    }

    // Find domain for skill
    let domainId: number | undefined;
    for (const [did, domain] of Object.entries(SKILL_MAP)) {
      for (const cluster of domain.clusters) {
        if (cluster.skills.some(s => s.skillId === skillId)) {
          domainId = parseInt(did);
          break;
        }
      }
      if (domainId) break;
    }

    // Check if skill maps to any ETS topic
    const topics = skillToTopics.get(skillId);
    if (!topics || topics.size === 0) {
      outOfScope.push({
        questionId: question.id,
        skillId,
        domainId,
        reason: `Skill ${skillId} does not map to any ETS content topic`
      });
    }
  }

  return outOfScope;
}

// Main analysis function
function analyzeCoverage() {
  console.log('Step 1: Reconciling mapping sources...\n');
  const reconciliation = reconcileMappings();
  
  console.log(`Total questions in questions.json: ${reconciliation.totalQuestions}`);
  console.log(`Total mappings in question-skill-map.json: ${reconciliation.totalMapped}`);
  console.log(`Discrepancies found: ${reconciliation.discrepancies.length}\n`);

  if (reconciliation.discrepancies.length > 0) {
    console.log('Discrepancies:');
    reconciliation.discrepancies.slice(0, 10).forEach(d => {
      console.log(`  ${d.questionId}: ${d.status} (questions.json: ${d.questionsJsonSkillId}, map.json: ${d.mapJsonSkillId})`);
    });
    if (reconciliation.discrepancies.length > 10) {
      console.log(`  ... and ${reconciliation.discrepancies.length - 10} more`);
    }
    console.log();
  }

  console.log('Step 2: Mapping ETS topics to skills...\n');
  const topicMapping = mapTopicsToSkills();
  
  console.log(`Topics mapped: ${topicMapping.topicToSkills.size}`);
  console.log(`Skills with topic mappings: ${topicMapping.skillToTopics.size}\n`);

  console.log('Step 3: Counting questions per topic...\n');
  const topicCoverage = countQuestionsPerTopic(reconciliation, topicMapping);
  
  const covered = Array.from(topicCoverage.values()).filter(t => t.status === 'covered').length;
  const partial = Array.from(topicCoverage.values()).filter(t => t.status === 'partial').length;
  const notCovered = Array.from(topicCoverage.values()).filter(t => t.status === 'not_covered').length;
  
  console.log(`Topic Coverage Status:`);
  console.log(`  Covered (3+ questions): ${covered}`);
  console.log(`  Partial (1-2 questions): ${partial}`);
  console.log(`  Not Covered (0 questions): ${notCovered}\n`);

  console.log('Step 4: Identifying out-of-scope questions...\n');
  const outOfScope = identifyOutOfScopeQuestions(reconciliation, topicMapping);
  
  console.log(`Out-of-scope questions: ${outOfScope.length}`);
  if (outOfScope.length > 0) {
    outOfScope.slice(0, 10).forEach(q => {
      console.log(`  ${q.questionId} (${q.skillId || 'no skill'}): ${q.reason}`);
    });
    if (outOfScope.length > 10) {
      console.log(`  ... and ${outOfScope.length - 10} more`);
    }
  }

  return {
    reconciliation,
    topicMapping,
    topicCoverage,
    outOfScope
  };
}

if (import.meta.main) {
  analyzeCoverage();
}

export { analyzeCoverage, reconcileMappings, mapTopicsToSkills, identifyOutOfScopeQuestions };
