import { analyzeCoverage } from './analyze-coverage-gaps';
import { SKILL_MAP } from '../brain/skill-map';
import etsContentTopics from '../data/ets-content-topics.json';
import questionBank from '../data/questions.json';
import questionSkillMap from '../data/question-skill-map.json';

function generateReport(): string {
  const analysis = analyzeCoverage();
  const { reconciliation, topicCoverage, outOfScope } = analysis;

  let report = '# Domain Coverage Gap Analysis Report\n\n';
  report += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  report += `**Total Questions:** ${reconciliation.totalQuestions}\n`;
  report += `**Total Mappings:** ${reconciliation.totalMapped}\n`;
  report += `**Mapping Discrepancies:** ${reconciliation.discrepancies.length}\n\n`;
  report += '---\n\n';

  // Executive Summary
  report += '## Executive Summary\n\n';
  
  const covered = Array.from(topicCoverage.values()).filter(t => t.status === 'covered').length;
  const partial = Array.from(topicCoverage.values()).filter(t => t.status === 'partial').length;
  const notCovered = Array.from(topicCoverage.values()).filter(t => t.status === 'not_covered').length;
  const totalTopics = topicCoverage.size;
  
  report += `### Coverage Statistics\n\n`;
  report += `- **Total ETS Content Topics:** ${totalTopics}\n`;
  report += `- **Covered (3+ questions):** ${covered} (${Math.round(covered/totalTopics*100)}%)\n`;
  report += `- **Partially Covered (1-2 questions):** ${partial} (${Math.round(partial/totalTopics*100)}%)\n`;
  report += `- **Not Covered (0 questions):** ${notCovered} (${Math.round(notCovered/totalTopics*100)}%)\n\n`;
  
  report += `### Mapping Discrepancies\n\n`;
  report += `Found ${reconciliation.discrepancies.length} discrepancies between \`questions.json\` and \`question-skill-map.json\`:\n\n`;
  
  const mismatchCount = reconciliation.discrepancies.filter(d => d.status === 'mismatch').length;
  const missingInMapCount = reconciliation.discrepancies.filter(d => d.status === 'missing_in_map').length;
  const missingInQuestionsCount = reconciliation.discrepancies.filter(d => d.status === 'missing_in_questions').length;
  
  report += `- **Mismatches (different skillId):** ${mismatchCount}\n`;
  report += `- **Missing in map.json:** ${missingInMapCount}\n`;
  report += `- **Missing in questions.json:** ${missingInQuestionsCount}\n\n`;
  
  report += `### Out-of-Scope Questions\n\n`;
  report += `Found ${outOfScope.length} questions that do not map to any ETS content topic.\n\n`;
  report += '---\n\n';

  // Detailed Domain Analysis
  report += '## Detailed Domain Analysis\n\n';

  for (const etsDomain of etsContentTopics.domains) {
    const domainId = etsDomain.id;
    const domain = SKILL_MAP[domainId as keyof typeof SKILL_MAP];
    
    if (!domain) continue;

    report += `### Domain ${domainId}: ${domain.name} (${domain.shortName})\n\n`;
    
    // Count questions for this domain
    const domainQuestions = questionBank.filter(q => {
      const skillId = q.skillId || questionSkillMap.mappedQuestions.find(m => m.questionId === q.id)?.skillId;
      if (!skillId) return false;
      for (const cluster of domain.clusters) {
        if (cluster.skills.some(s => s.skillId === skillId)) return true;
      }
      return false;
    }).length;

    report += `**Total Questions:** ${domainQuestions}\n\n`;

    // Analyze each section
    for (const section of etsDomain.sections) {
      report += `#### ${section.code}: ${section.name}\n\n`;
      
      const sectionTopics: typeof topicCoverage.values extends Array<infer T> ? T[] : never = [];
      for (const topic of section.topics) {
        const coverage = topicCoverage.get(topic.code);
        if (coverage) sectionTopics.push(coverage);
      }

      const sectionCovered = sectionTopics.filter(t => t.status === 'covered').length;
      const sectionPartial = sectionTopics.filter(t => t.status === 'partial').length;
      const sectionNotCovered = sectionTopics.filter(t => t.status === 'not_covered').length;

      report += `**Coverage:** ${sectionCovered} covered, ${sectionPartial} partial, ${sectionNotCovered} not covered\n\n`;

      // List topics with status
      for (const topic of section.topics) {
        const coverage = topicCoverage.get(topic.code);
        if (!coverage) continue;

        const statusIcon = coverage.status === 'covered' ? '✅' : 
                          coverage.status === 'partial' ? '⚠️' : '❌';
        
        report += `${statusIcon} **${topic.code}**: ${topic.text}\n`;
        report += `   - Questions: ${coverage.questionCount}\n`;
        
        if (coverage.skills.length > 0) {
          report += `   - Skills: ${coverage.skills.join(', ')}\n`;
        } else {
          report += `   - Skills: *None mapped*\n`;
        }
        
        if (coverage.status === 'not_covered' || coverage.status === 'partial') {
          report += `   - **Opportunity:** Generate ${coverage.status === 'not_covered' ? '3-5' : '1-2'} questions targeting this topic\n`;
        }
        
        report += '\n';
      }
    }

    report += '---\n\n';
  }

  // Mapping Discrepancies Detail
  if (reconciliation.discrepancies.length > 0) {
    report += '## Mapping Discrepancies Detail\n\n';
    report += 'The following questions have different skill mappings between the two sources:\n\n';
    report += '| Question ID | questions.json | question-skill-map.json | Status |\n';
    report += '|-------------|----------------|-------------------------|--------|\n';
    
    for (const d of reconciliation.discrepancies.slice(0, 50)) {
      report += `| ${d.questionId} | ${d.questionsJsonSkillId || '*none*'} | ${d.mapJsonSkillId || '*none*'} | ${d.status} |\n`;
    }
    
    if (reconciliation.discrepancies.length > 50) {
      report += `\n*... and ${reconciliation.discrepancies.length - 50} more discrepancies*\n`;
    }
    
    report += '\n---\n\n';
  }

  // Out-of-Scope Questions
  if (outOfScope.length > 0) {
    report += '## Out-of-Scope Questions\n\n';
    report += 'The following questions do not map to any ETS content topic:\n\n';
    report += '| Question ID | Skill ID | Domain | Reason |\n';
    report += '|-------------|----------|--------|--------|\n';
    
    for (const q of outOfScope) {
      report += `| ${q.questionId} | ${q.skillId || '*none*'} | ${q.domainId || '*unknown*'} | ${q.reason} |\n`;
    }
    
    report += '\n---\n\n';
  }

  // Opportunities Summary
  report += '## Opportunities for Question Generation\n\n';
  
  const opportunities: Array<{ topic: string; code: string; priority: 'high' | 'medium' | 'low'; questionsNeeded: number }> = [];
  
  for (const [topicCode, coverage] of topicCoverage.entries()) {
    if (coverage.status === 'not_covered') {
      opportunities.push({
        topic: coverage.topic.text,
        code: topicCode,
        priority: 'high',
        questionsNeeded: 3
      });
    } else if (coverage.status === 'partial') {
      opportunities.push({
        topic: coverage.topic.text,
        code: topicCode,
        priority: 'medium',
        questionsNeeded: 2
      });
    }
  }

  // Sort by priority
  opportunities.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority === 'high' ? -1 : 1;
    }
    return a.code.localeCompare(b.code);
  });

  report += `**Total Opportunities:** ${opportunities.length}\n\n`;
  report += '### High Priority (Not Covered)\n\n';
  
  const highPriority = opportunities.filter(o => o.priority === 'high');
  report += `**Count:** ${highPriority.length} topics\n\n`;
  
  for (const opp of highPriority.slice(0, 20)) {
    report += `- **${opp.code}**: ${opp.topic}\n`;
    report += `  - Questions needed: ${opp.questionsNeeded}\n`;
  }
  
  if (highPriority.length > 20) {
    report += `\n*... and ${highPriority.length - 20} more high-priority opportunities*\n`;
  }

  report += '\n### Medium Priority (Partially Covered)\n\n';
  
  const mediumPriority = opportunities.filter(o => o.priority === 'medium');
  report += `**Count:** ${mediumPriority.length} topics\n\n`;
  
  for (const opp of mediumPriority.slice(0, 20)) {
    report += `- **${opp.code}**: ${opp.topic}\n`;
    report += `  - Questions needed: ${opp.questionsNeeded}\n`;
  }
  
  if (mediumPriority.length > 20) {
    report += `\n*... and ${mediumPriority.length - 20} more medium-priority opportunities*\n`;
  }

  report += '\n---\n\n';
  report += '## Recommendations\n\n';
  report += '1. **Resolve mapping discrepancies** - Standardize on a single source of truth for question-to-skill mappings\n';
  report += '2. **Prioritize high-priority gaps** - Focus on generating questions for topics with 0 coverage\n';
  report += '3. **Strengthen partial coverage** - Add questions to topics with only 1-2 questions\n';
  report += '4. **Review out-of-scope questions** - Determine if these questions should be remapped or removed\n';
  report += '5. **Create skill mappings** - For uncovered topics, consider creating new skills or expanding existing ones\n\n';

  return report;
}

if (import.meta.main) {
  const report = generateReport();
  console.log(report);
}

export { generateReport };
