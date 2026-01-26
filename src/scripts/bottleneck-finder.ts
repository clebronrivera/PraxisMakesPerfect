import { SKILL_MAP } from '../brain/skill-map';
import { runCapacityTest } from './capacity-test';
import { getAllSkills } from './diagnostic-utils';
import questionSkillMapData from '../data/question-skill-map.json';

const PRAXIS_WEIGHTS: Record<number, number> = {
  1: 0.32,
  2: 0.10,
  3: 0.08,
  4: 0.14,
  5: 0.08,
  6: 0.06,
  7: 0.05,
  8: 0.07,
  9: 0.04,
  10: 0.06
};

interface BottleneckSkill {
  skillId: string;
  name: string;
  domainId: number;
  domainName: string;
  domainWeight: number;
  bankCount: number;
  generatedCapacity: number;
  totalPool: number;
  bottleneckScore: number;
}

export function findBottlenecks(): BottleneckSkill[] {
  // Count bank questions per skill
  const bankCounts = new Map<string, number>();
  for (const entry of questionSkillMapData.mappedQuestions) {
    const count = bankCounts.get(entry.skillId) ?? 0;
    bankCounts.set(entry.skillId, count + 1);
  }

  // Get generation capacity per skill
  const capacity = runCapacityTest();
  const capacityBySkill = new Map<string, number>();
  for (const domain of capacity.domainSummaries) {
    for (const skill of domain.skills) {
      capacityBySkill.set(skill.skillId, skill.capacity);
    }
  }

  // Build skill metadata
  const skillMetadata: Record<string, { name: string; domainId: number; domainName: string }> = {};
  for (const domain of Object.values(SKILL_MAP)) {
    for (const cluster of domain.clusters) {
      for (const skill of cluster.skills) {
        skillMetadata[skill.skillId] = {
          name: skill.name,
          domainId: domain.domainId,
          domainName: domain.name
        };
      }
    }
  }

  // Calculate bottleneck scores
  const bottlenecks: BottleneckSkill[] = [];
  for (const skill of getAllSkills()) {
    const metadata = skillMetadata[skill.skillId];
    if (!metadata) continue;

    const bankCount = bankCounts.get(skill.skillId) ?? 0;
    const generatedCapacity = Math.round(capacityBySkill.get(skill.skillId) ?? 0);
    const totalPool = bankCount + generatedCapacity;
    const domainWeight = PRAXIS_WEIGHTS[metadata.domainId] ?? 0;

    // Bottleneck score: (domainWeight × 100) / totalPool
    // Higher score = more bottleneck (high weight, low pool)
    const bottleneckScore = totalPool > 0 ? (domainWeight * 100) / totalPool : Infinity;

    bottlenecks.push({
      skillId: skill.skillId,
      name: metadata.name,
      domainId: metadata.domainId,
      domainName: metadata.domainName,
      domainWeight,
      bankCount,
      generatedCapacity,
      totalPool,
      bottleneckScore
    });
  }

  // Sort by bottleneck score (highest first)
  bottlenecks.sort((a, b) => b.bottleneckScore - a.bottleneckScore);

  return bottlenecks;
}

if (import.meta.main) {
  const bottlenecks = findBottlenecks();

  console.log('BOTTLENECK ANALYSIS');
  console.log('===================');
  console.log('');
  console.log('Top 10 Bottleneck Skills (highest domain weight, lowest question pool):');
  console.log('');
  console.log('Skill ID          | Domain | Weight | Bank | Generated | Total Pool | Score');
  console.log('------------------|--------|--------|------|-----------|------------|-------');

  for (const bottleneck of bottlenecks.slice(0, 10)) {
    console.log(
      `${bottleneck.skillId.padEnd(17)} | ${bottleneck.domainId.toString().padEnd(6)} | ${(bottleneck.domainWeight * 100).toFixed(0).padStart(5)}% | ${bottleneck.bankCount.toString().padStart(4)} | ${bottleneck.generatedCapacity.toString().padStart(9)} | ${bottleneck.totalPool.toString().padStart(10)} | ${bottleneck.bottleneckScore.toFixed(2)}`
    );
  }

  console.log('');
  console.log('Key Insights:');
  console.log(`- Skills with highest bottleneck scores need immediate attention`);
  console.log(`- Score = (Domain Weight × 100) / Total Pool`);
  console.log(`- Higher score = more critical bottleneck`);
  console.log('');

  // Show breakdown by domain
  console.log('Bottlenecks by Domain:');
  const byDomain = new Map<number, BottleneckSkill[]>();
  for (const bottleneck of bottlenecks.slice(0, 20)) {
    const existing = byDomain.get(bottleneck.domainId) ?? [];
    existing.push(bottleneck);
    byDomain.set(bottleneck.domainId, existing);
  }

  for (const [domainId, skills] of byDomain.entries()) {
    const domainName = skills[0]?.domainName ?? 'Unknown';
    console.log(`\nDomain ${domainId}: ${domainName}`);
    for (const skill of skills.slice(0, 3)) {
      console.log(`  - ${skill.skillId}: ${skill.name} (Pool: ${skill.totalPool}, Score: ${skill.bottleneckScore.toFixed(2)})`);
    }
  }
}
